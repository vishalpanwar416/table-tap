import { supabase } from '../supabase';

const DEFAULT_AVATAR_URL = 'https://vogixryubhpqziivspks.supabase.co/storage/v1/object/public/avatars//default.jpg';

const upsertProfileIfNeeded = async (user, extraFields = {}) => {
  await supabase.from('profiles').upsert([{
    id: user.id,
    full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
    email: user.email,
    avatar_url: DEFAULT_AVATAR_URL,
    ...extraFields
  }]);
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
      console.error('Failed to get current user:', error.message);
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
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get profile:', error.message);
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
      console.error('Profile completion check failed:', error.message);
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
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Sign in failed:', error.message);
      throw error;
    }
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
        password: newPassword
      });
      
      if (error) throw error;
      return {
        success: true,
        message: 'Password updated successfully',
        user: data.user
      };
    } catch (error) {
      console.error('Password reset failed:', error.message);
      throw new Error('Failed to update password. The link may have expired.');
    }
  },

  /**
   * Sign in with Google OAuth
   * @param {string} [redirectTo='/home'] - Redirect URL after auth
   * @returns {Promise<Object>} Auth session data
   * @throws {Error} If OAuth fails
   */
  signInWithGoogle: async (redirectTo = '/home') => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${redirectTo}`
        }
      });
      
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await upsertProfileIfNeeded(user, {
          avatar_url: user.user_metadata?.avatar_url || DEFAULT_AVATAR_URL
        });
      }

      return data;
    } catch (error) {
      console.error('Google sign in failed:', error.message);
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
      const { fullName, email, password, mobileNumber, dateOfBirth } = userData;
      const { data: { user }, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            mobile_number: mobileNumber,
            date_of_birth: dateOfBirth,
          },
        }
      });
      
      if (authError) throw authError;
      if (!user) throw new Error('User creation failed');
      
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert([{
          id: user.id,
          full_name: fullName,
          email,
          mobile_number: mobileNumber,
          date_of_birth: dateOfBirth,
          avatar_url: DEFAULT_AVATAR_URL
        }]);
      
      if (profileError) throw profileError;
      return user;
    } catch (error) {
      console.error('Sign up failed:', error.message);
      throw error;
    }
  },

  /**
   * Sign up with Google
   * @param {string} [redirectTo='/home'] - Redirect URL after auth
   * @returns {Promise<Object>} Auth data
   * @throws {Error} If Google signup failss
   */
  signUpWithGoogle: async (redirectTo = '/home') => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${redirectTo}`,
          queryParams: {
            prompt: 'consent',
            screen_hint: 'signup',
            include_granted_scopes: 'true'
          }
        }
      });
      
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await upsertProfileIfNeeded(user, {
          avatar_url: user.user_metadata?.avatar_url || DEFAULT_AVATAR_URL
        });
      }

      return data;
    } catch (error) {
      console.error('Google sign up failed:', error.message);
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
      
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name,
          email: user.email,
          ...profileData
        });
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Profile update failed:', error.message);
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
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Password reset failed:', error.message);
      throw error;
    }
  },

  /**
   * Send password reset email
   * @param {string} email - User email
   * @returns {Promise<Object>} Result data
   * @throws {Error} If reset fails
   */
  sendPasswordResetEmail: async (email) => {
    if (typeof supabase.auth.resetPasswordForEmail === 'function') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      return;
    }
    if (supabase.auth.api && typeof supabase.auth.api.resetPasswordForEmail === 'function') {
      const { error } = await supabase.auth.api.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      return;
    }
    throw new Error('resetPasswordForEmail is not available on your Supabase client');
  },

  /**
   * Verify password reset token validity
   * @param {string} accessToken - The password reset token
   * @returns {Promise<{isValid: boolean, user?: object}>} Verification result
   */
  verifyPasswordResetToken: async (token) => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      return { isValid: !error, user };
    } catch (error) {
      console.error('Token verification failed:', error);
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
      const { data: { session }, error: sessionError } = await supabase.auth.setSession({
        access_token: token,
        refresh_token: ''
      });
      
      if (sessionError) {
        throw sessionError;
      }

      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Password update failed:', error);
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
      console.error('Sign out failed:', error.message);
      throw error;
    }
  }
};

export default authService;