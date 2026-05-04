import { supabase } from '../../shared/supabase';

export const DEFAULT_AVATAR_URL =
  'https://vogixryubhpqziivspks.supabase.co/storage/v1/object/public/avatars/default.jpg';

const AUTH_RATE_LIMIT_URL = `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/auth-rate-limit`;

/**
 * Route auth actions through the rate-limited edge function.
 * Falls back to direct Supabase auth if the function is unreachable.
 */
async function callAuthEdgeFunction(action, payload) {
  const res = await fetch(AUTH_RATE_LIMIT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: process.env.REACT_APP_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ action, ...payload }),
  });
  if (res.status === 429) {
    const json = await res.json().catch(() => ({}));
    const retryAfter = json.retryAfter || 60;
    throw Object.assign(
      new Error(`Too many attempts. Please wait ${retryAfter} seconds before trying again.`),
      { status: 429, retryAfter },
    );
  }
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Authentication failed');
  return json;
}

export const syncProfile = async (user, extraFields = {}) => {
  const metadata = user.user_metadata || {};
  const googleAvatar = metadata.avatar_url || metadata.picture;

  const { error } = await supabase.from('profiles').upsert([
    {
      id: user.id,
      full_name: metadata.full_name || metadata.name || user.email,
      email: user.email,
      avatar_url: googleAvatar || DEFAULT_AVATAR_URL,
      ...extraFields,
    },
  ]);

  if (error) console.error('Error syncing profile:', error);
};

export const authService = {
  /**
   * Get the current authenticated user
   * @returns {Promise<Object|null>} The user object or null if not authenticated
   * @throws {Error} If there's an error fetching the user
   */
  getCurrentUser: async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get complete user profile
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} The full profile data
   * @throws {Error} If profile cannot be fetched
   */
  getProfile: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select()
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Check if the user profile is complete
   * @param {string} userId - The user ID
   * @returns {Promise<boolean>} True if profile has required fields
   */
  isProfileComplete: async (userId) => {
    try {
      const profile = await authService.getProfile(userId);
      return Boolean(profile?.mobile_number && profile?.date_of_birth);
    } catch (error) {
      return false;
    }
  },

  /**
   * Sign in with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Auth session data
   * @throws {Error} If sign in fails
   */
  signInWithPassword: async (email, password) => {
    // Route through rate-limited edge function; on success inject session locally
    const { session, user } = await callAuthEdgeFunction('sign_in', {
      email: email.trim(),
      password: password.trim(),
    });
    if (session) {
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
    }
    return { session, user };
  },

  /**
   * Complete password reset with token from email
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Result data
   * @throws {Error} If reset fails
   */
  completePasswordReset: async (newPassword) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      return {
        success: true,
        message: 'Password updated successfully',
        user: data.user,
      };
    } catch (error) {
      throw new Error('Failed to update password. The link may have expired.');
    }
  },

  /**
   * Sign in with Google OAuth
   * @param {string} [redirectTo='/home'] - Redirect URL after auth
   * @returns {Promise<Object>} Auth session data
   * @throws {Error} If OAuth fails
   */
  signInWithGoogle: async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Must land on /auth-callback so AuthCallback.jsx can pick up the
          // session tokens and run the role-based redirect logic.
          redirectTo: `${window.location.origin}/auth-callback`,
        },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Sign up with email and password
   * @param {Object} userData - User registration data
   * @param {string} userData.fullName - User's full name
   * @param {string} userData.email - User email
   * @param {string} userData.password - User password
   * @param {string} userData.mobileNumber - User mobile number
   * @param {string} userData.dateOfBirth - User date of birth
   * @returns {Promise<Object>} The created user
   * @throws {Error} If signup fails
   */
  signUp: async (userData) => {
    try {
      const { fullName, email, password, mobileNumber, dateOfBirth, avatar_url } = userData;
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            mobile_number: mobileNumber,
            date_of_birth: dateOfBirth,
          },
        },
      });

      if (authError) throw authError;
      if (!user) throw new Error('User creation failed');

      const { error: profileError } = await supabase.from('profiles').upsert([
        {
          id: user.id,
          full_name: fullName,
          email,
          mobile_number: mobileNumber,
          date_of_birth: dateOfBirth,
          avatar_url: avatar_url || DEFAULT_AVATAR_URL,
        },
      ]);

      if (profileError) throw profileError;
      return user;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Send an OTP to a phone number
   * @param {string} phone - The phone number (e.g. +91XXXXXXXXXX)
   * @returns {Promise<Object>} The response data
   */
  signInWithPhone: async (phone) => {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: phone.replace(/\s/g, ''),
      });
      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Verify an OTP for a phone number
   * @param {string} phone - The phone number
   * @param {string} token - The OTP code
   * @returns {Promise<Object>} Auth session data
   */
  verifyOtp: async (phone, token) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone.replace(/\s/g, ''),
        token,
        type: 'sms',
      });
      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Sign up with Google
   * @param {string} [redirectTo='/home'] - Redirect URL after auth
   * @returns {Promise<Object>} Auth data
   * @throws {Error} If Google signup failss
   */
  signUpWithGoogle: async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Must land on /auth-callback so AuthCallback.jsx can pick up the
          // session tokens and run the role-based redirect logic.
          redirectTo: `${window.location.origin}/auth-callback`,
          queryParams: {
            prompt: 'consent',
            screen_hint: 'signup',
            include_granted_scopes: 'true',
          },
        },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Complete or update user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Updated profile data
   * @throws {Error} If update fails or no authenticated user
   */
  updateProfile: async (profileData) => {
    try {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name,
        email: user.email,
        ...profileData,
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Send password reset email
   * @param {string} email - User email
   * @returns {Promise<Object>} Result data
   * @throws {Error} If reset fails
   */
  resetPassword: async (email) => {
    return callAuthEdgeFunction('forgot_password', {
      email: email.trim(),
      redirectTo: `${window.location.origin}/reset-password`,
    });
  },

  /**
   * Send password reset email
   * @param {string} email - User email
   * @returns {Promise<Object>} Result data
   * @throws {Error} If reset fails
   */
  sendPasswordResetEmail: async (email) => {
    return callAuthEdgeFunction('forgot_password', {
      email: email.trim(),
      redirectTo: `${window.location.origin}/reset-password`,
    });
  },

  /**
   * Verify password reset token validity
   * @param {string} accessToken - The password reset token
   * @returns {Promise<{isValid: boolean, user?: object}>} Verification result
   */
  verifyPasswordResetToken: async (token) => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);
      return { isValid: !error, user };
    } catch (error) {
      return { isValid: false };
    }
  },

  /**
   * Update password with reset token
   * @param {string} newPassword - The new password
   * @param {string} token - The password reset token
   * @returns {Promise<Object>} Updated user data
   * @throws {Error} If password update fails
   */
  updatePasswordWithToken: async (newPassword, token) => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.setSession({
        access_token: token,
        refresh_token: '',
      });

      if (sessionError) {
        throw sessionError;
      }

      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Sign out the current user
   * @returns {Promise<{success: boolean}>} Success status
   * @throws {Error} If sign out fails
   */
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Check if an email is already registered using RPC (more secure)
   * @param {string} email - Email to check
   * @returns {Promise<{exists: boolean}>} Check result
   */
  checkEmailExistsRPC: async (email) => {
    try {
      const trimmedEmail = email.trim().toLowerCase();

      const { data, error } = await supabase.rpc('check_email_exists', {
        email_to_check: trimmedEmail,
      });

      if (error) {
        console.error('RPC error:', error);
        return { exists: false };
      }

      return { exists: data || false };
    } catch (error) {
      console.error('Error in checkEmailExistsRPC:', error);
      return { exists: false };
    }
  },
};

export default authService;
