import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, LogOut, Trash2, Save, X, Edit3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { OptimizedPageWrapper, itemVariants } from '../../components/customer/OptimizedPageWrapper';
import DeleteProfilePopup from '../../components/auth/DeleteProfilePopup';
import { usePerformanceMonitor } from '../../hooks/usePerformance';
import { useDebounce } from '../../hooks/usePerformance';

const OptimizedProfilePage = memo(() => {
  const navigate = useNavigate();
  
  // Performance monitoring
  usePerformanceMonitor('ProfilePage');
  
  // State management
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    dob: "",
    profileImg: ""
  });
  const [formData, setFormData] = useState({...profileData});
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Debounced form validation
  const debouncedValidation = useDebounce(() => {
    validateForm();
  }, 500);

  // Memoized form validation
  const validateForm = useCallback(() => {
    const errors = [];
    
    if (!formData.name.trim()) {
      errors.push('Name is required');
    }
    
    if (!formData.email.trim()) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('Invalid email format');
    }
    
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      errors.push('Phone number must be at least 10 digits');
    }
    
    if (formData.dob && !/^\d{2}-\d{2}-\d{4}$/.test(formData.dob)) {
      errors.push('Date of birth must be in DD-MM-YYYY format');
    }
    
    return errors;
  }, [formData]);

  // Check for changes
  useEffect(() => {
    const changed = JSON.stringify(formData) !== JSON.stringify(profileData);
    setHasChanges(changed);
  }, [formData, profileData]);

  // Load profile data
  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Authentication required');
      }

      setUser(user);
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, email, mobile_number, date_of_birth, avatar_url')
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      // Format date for display
      let dobString = '';
      if (profile.date_of_birth) {
        const dobDate = new Date(profile.date_of_birth);
        if (!isNaN(dobDate.getTime())) {
          const day = dobDate.getDate().toString().padStart(2, '0');
          const month = (dobDate.getMonth() + 1).toString().padStart(2, '0');
          const year = dobDate.getFullYear();
          dobString = `${day}-${month}-${year}`;
        }
      }

      const newProfileData = {
        name: profile.full_name || '',
        email: profile.email || user.email,
        phone: profile.mobile_number || '',
        dob: dobString,
        profileImg: profile.avatar_url || ''
      };
      
      setProfileData(newProfileData);
      setFormData(newProfileData);
    } catch (err) {
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Real-time updates subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase.channel('profile-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
      }, (payload) => {
        if (payload.new.id === user.id) {
          // Update profile data in real-time
          let dobString = '';
          if (payload.new.date_of_birth) {
            const dobDate = new Date(payload.new.date_of_birth);
            if (!isNaN(dobDate.getTime())) {
              const day = dobDate.getDate().toString().padStart(2, '0');
              const month = (dobDate.getMonth() + 1).toString().padStart(2, '0');
              const year = dobDate.getFullYear();
              dobString = `${day}-${month}-${year}`;
            }
          }

          setProfileData(prev => ({
            ...prev,
            name: payload.new.full_name,
            phone: payload.new.mobile_number,
            dob: dobString,
            profileImg: payload.new.avatar_url
          }));
        }
      })
      .subscribe();

    return () => channel.unsubscribe();
  }, [user?.id]);

  // Image upload handler
  const handleImageUpload = useCallback(async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      if (!user) throw new Error('Authentication required');

      // Validate file
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('File size must be less than 5MB');
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Only JPEG, PNG, and WebP images are allowed');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-photos/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfileData(prev => ({ ...prev, profileImg: publicUrl }));
      setFormData(prev => ({ ...prev, profileImg: publicUrl }));
      
    } catch (error) {
      setError('Error uploading image: ' + error.message);
    } finally {
      setUploading(false);
    }
  }, [user]);

  // Form handlers
  const formatDateInput = useCallback((value) => {
    const digits = value.replace(/\D/g, '');
    
    if (digits.length <= 2) {
      return digits;
    } else if (digits.length <= 4) {
      return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    } else {
      return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 8)}`;
    }
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    
    if (name === 'dob') {
      const formattedValue = formatDateInput(value);
      setFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    debouncedValidation();
  }, [formatDateInput, debouncedValidation]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!user) return;
    
    const errors = validateForm();
    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }
    
    setIsSubmitting(true);
    setError(null);

    try {
      const cleanPhone = formData.phone.replace(/\D/g, '');
      
      // Convert DD-MM-YYYY to YYYY-MM-DD for database
      let dobDate = null;
      if (formData.dob && /^\d{2}-\d{2}-\d{4}$/.test(formData.dob)) {
        const [day, month, year] = formData.dob.split('-');
        dobDate = `${year}-${month}-${day}`;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.name.trim(),
          mobile_number: cleanPhone,
          date_of_birth: dobDate
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfileData(formData);
      setIsEditing(false);
      setHasChanges(false);
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  }, [user, formData, validateForm]);

  const handleCancel = useCallback(() => {
    setFormData(profileData);
    setIsEditing(false);
    setHasChanges(false);
    setError(null);
  }, [profileData]);

  const handleLogout = useCallback(() => {
    supabase.auth.signOut();
    navigate('/login');
  }, [navigate]);

  const handleRetry = useCallback(() => {
    loadProfile();
  }, [loadProfile]);

  // Profile section component
  const ProfileSection = memo(({ title, children, className = "" }) => (
    <motion.div 
      className={`bg-white rounded-xl p-6 mb-4 ${className}`}
      variants={itemVariants}
    >
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      {children}
    </motion.div>
  ));

  return (
    <OptimizedPageWrapper
      title="Profile"
      showBackButton
      onBack={() => navigate('/home')}
      loading={loading}
      error={error}
      onRetry={handleRetry}
    >
      <motion.div 
        className="bg-white rounded-t-[30px] flex-1 p-6"
        variants={itemVariants}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture Section */}
          <ProfileSection title="Profile Picture">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img
                  src={formData.profileImg || '/images/default-avatar.png'}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-4 border-orange-100"
                />
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="profile-upload"
                  disabled={uploading}
                />
                <label
                  htmlFor="profile-upload"
                  className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Choose Photo'}
                </label>
              </div>
            </div>
          </ProfileSection>

          {/* Personal Information Section */}
          <ProfileSection title="Personal Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Enter 10-digit phone number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                <input
                  type="text"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="DD-MM-YYYY"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>
            </div>
          </ProfileSection>

          {/* Action Buttons */}
          <ProfileSection title="Actions">
            <div className="flex flex-wrap gap-4">
              {isEditing ? (
                <>
                  <button
                    type="submit"
                    disabled={isSubmitting || !hasChanges}
                    className="flex items-center px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex items-center px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Profile
                </button>
              )}
              
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
              
              <button
                type="button"
                onClick={() => setShowDeletePopup(true)}
                className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </button>
            </div>
          </ProfileSection>
        </form>
      </motion.div>

      {/* Delete Account Popup */}
      <AnimatePresence>
        {showDeletePopup && (
          <DeleteProfilePopup
            isOpen={showDeletePopup}
            onClose={() => setShowDeletePopup(false)}
            onConfirm={() => {
              setShowDeletePopup(false);
              navigate('/login');
            }}
          />
        )}
      </AnimatePresence>
    </OptimizedPageWrapper>
  );
});

OptimizedProfilePage.displayName = 'OptimizedProfilePage';

export default OptimizedProfilePage; 