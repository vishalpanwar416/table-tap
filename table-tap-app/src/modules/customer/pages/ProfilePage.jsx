import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, Camera, LogOut, Trash2, User, Mail, Phone, Calendar, Edit3, Save, X, AlertCircle, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DeleteProfilePopup from '../../shared/components/auth/auth/DeleteProfilePopup';
import { optimizeProfileImage, validateImageFile, ProgressiveImage } from '../../shared/utils/imageOptimization';
import authService from '../../shared/api/authService';
import { supabase } from '../../shared/supabase';
import LoadingScreen from '../../shared/components/LoadingScreen';

// DefaultAvatar component - moved outside the main component
const DefaultAvatar = ({ className = 'w-full h-full', iconClassName = 'w-12 h-12 text-gray-400' }) => (
  <div className={`bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ${className}`}>
    <User className={iconClassName} />
  </div>
);

const ProfilePage = () => {
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    dob: "",
    profileImg: ""
  });
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...profileData });
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const user = await authService.getCurrentUser();
        if (!user) {
          setError('Authentication required');
          return;
        }

        setUser(user);

        const profile = await authService.getProfile(user.id);

        if (profile) {
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
        }
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // --- Optimized Image Upload with Better Error Handling ---
  const handleImageUpload = useCallback(async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      // 1. Validate the image file first
      const validation = await validateImageFile(file);
      if (!validation.isValid) {
        alert(validation.errors.join(', '));
        return;
      }

      // 2. Optimize the image for profile avatar with error handling
      let optimizedDataUrl;
      try {
        optimizedDataUrl = await optimizeProfileImage(file, { maxSize: 256, quality: 0.7 });
      } catch (optimizeError) {
        console.error('Image optimization failed:', optimizeError);
        // Fallback: use the original file if optimization fails
        optimizedDataUrl = URL.createObjectURL(file);
      }

      // 3. Convert data URL to Blob with error handling
      let optimizedFile;
      try {
        const res = await fetch(optimizedDataUrl);
        if (!res.ok) {
          throw new Error('Failed to fetch optimized image');
        }
        const blob = await res.blob();
        optimizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), { type: 'image/jpeg' });
      } catch (blobError) {
        console.error('Blob conversion failed:', blobError);
        // Fallback: use the original file
        optimizedFile = file;
      }

      const user = await authService.getCurrentUser();
      if (!user) throw new Error('Authentication required');
      const fileName = `${user.id}-${Date.now()}.jpg`;
      const filePath = `profile-photos/${user.id}/${fileName}`;
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, optimizedFile, {
          cacheControl: '3600',
          upsert: true
        });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      await authService.updateProfile({ avatar_url: publicUrl });

      setProfileData(prev => ({ ...prev, profileImg: publicUrl }));
      setFormData(prev => ({ ...prev, profileImg: publicUrl }));

      // Clean up the object URL if we created one
      if (optimizedDataUrl.startsWith('blob:')) {
        URL.revokeObjectURL(optimizedDataUrl);
      }

    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading image: ' + error.message);
    } finally {
      setUploading(false);
    }
  }, []);
  // --- End Optimized Image Upload ---

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
      // Basic sanitization: remove potential script tags
      const sanitizedValue = value.replace(/[<>]/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: sanitizedValue
      }));
    }
  }, [formatDateInput]);

  const validateEmail = useCallback((email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) &&
      email.length <= 254 &&
      email.length >= 5 &&
      !email.includes('..') &&
      !email.startsWith('.') &&
      !email.endsWith('.');
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!user) return;

    setIsSubmitting(true);

    try {
      const cleanPhone = formData.phone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        alert('Phone number must be at least 10 digits');
        return;
      }

      if (!/^\d{2}-\d{2}-\d{4}$/.test(formData.dob)) {
        alert('Please use DD-MM-YYYY format for date of birth (e.g., 25-12-1990)');
        return;
      }

      if (!validateEmail(formData.email)) {
        alert('Please enter a valid email address');
        return;
      }

      const [day, month, year] = formData.dob.split('-');
      const dobDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

      if (isNaN(dobDate.getTime())) {
        alert('Please enter a valid date of birth');
        return;
      }

      const today = new Date();
      if (dobDate > today) {
        alert('Date of birth cannot be in the future');
        return;
      }

      const emailChanged = formData.email !== user.email;

      await authService.updateProfile({
        full_name: formData.name,
        mobile_number: cleanPhone,
        date_of_birth: dobDate.toISOString()
      });

      setProfileData(prev => ({
        ...prev,
        name: formData.name,
        phone: cleanPhone,
        dob: formData.dob
      }));

      if (emailChanged) {
        if (!validateEmail(formData.email)) {
          alert('Please enter a valid email address in the format: example@domain.com');
          return;
        }

        const cleanEmail = formData.email.trim().toLowerCase();

        try {
          const { data: { user: updatedUser }, error: authError } = await supabase.auth.updateUser({
            email: cleanEmail
          });

          if (authError) {

            if (authError.message.includes('User already registered') ||
              authError.message.includes('already exists') ||
              authError.code === 'email_address_invalid') {
              alert('This email address is already registered or invalid. Please use a different email.');
            } else if (authError.message.includes('rate') || authError.message.includes('limit')) {
              alert('Too many email change attempts. Please wait a few minutes before trying again.');
            } else if (authError.message.includes('invalid') || authError.message.includes('Invalid')) {
              alert(`Email validation failed: ${authError.message}\n\nPlease try:\n- A different email provider\n- Removing special characters\n- Using a standard format like: name@example.com`);
            } else {
              alert(`Error updating email: ${authError.message}\n\nIf this persists, please contact support.`);
            }
            return;
          }

          if (updatedUser) {
            setProfileData(prev => ({
              ...prev,
              email: cleanEmail
            }));

            if (!updatedUser.email_confirmed_at) {
              alert('Profile updated successfully! Please check your new email for a verification link.');
            } else {
              alert('Profile and email updated successfully!');
            }
          }
        } catch (emailError) {
          alert(`Profile information updated, but email update failed: ${emailError.message}\n\nPlease try updating your email again later.`);
        }
      } else {
        alert('Profile updated successfully!');
      }

      setIsEditing(false);

    } catch (error) {
      alert('Failed to update profile: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  }, [user, formData, validateEmail]);

  const handleLogout = useCallback(async () => {
    try {
      await authService.signOut();
      navigate('/login');
    } catch (error) {
      alert('Error logging out. Please try again.');
    }
  }, [navigate]);

  if (loading) {
    return <LoadingScreen message="Loading Profile..." variant="page" />;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black p-4">
        <div className="text-center text-white">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-white text-black px-6 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-start min-h-screen bg-black p-4">
      <div className="w-full max-w-[390px] md:max-w-4xl lg:max-w-6xl h-screen flex flex-col">

        {/* Header with Back Button and Title */}
        <div className="relative flex items-center justify-center py-6 md:py-8">
          <button
            onClick={() => navigate(-1)}
            className="absolute left-4 text-orange-500 hover:text-orange-600 transition-all duration-300 p-2 rounded-full hover:bg-orange-500/10 active:bg-orange-500/20 focus:outline-none focus:ring-2 focus:ring-orange-500/30 z-10"
            aria-label="Go back"
          >
            <ChevronLeft size={30} />
          </button>

          <div className="text-center">
            <h1 className="text-2xl md:text-4xl text-white font-spartan-medium">
              My Profile
            </h1>
            <p className="text-gray-400 mt-2 text-sm md:text-base">
              Manage your account information
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-t-[30px] p-4 md:p-6 flex-1 flex flex-col min-h-[calc(100vh-200px)] overflow-y-auto shadow-xl">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
              {/* Profile Image Section - Editing Mode */}
              <div className="flex flex-col items-center justify-center mb-8">
                <div className="relative group">
                  <div className="w-32 h-32 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden relative shadow-xl ring-4 ring-white">
                    {formData.profileImg ? (
                      <img
                        src={formData.profileImg}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <DefaultAvatar
                        className="w-full h-full"
                        iconClassName="w-16 h-16 md:w-20 md:h-20 text-gray-400"
                      />
                    )}
                  </div>
                  <label className="absolute bottom-2 right-2 bg-black/90 backdrop-blur-sm p-3 rounded-full cursor-pointer hover:bg-black transition-all duration-300 group-hover:scale-110 shadow-xl ring-2 ring-white">
                    <Camera className="w-5 h-5 text-white" />
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </label>
                  {uploading && (
                    <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-3 text-center font-medium">
                  Tap the camera icon to change your photo
                </p>
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-600" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent text-black transition-all duration-300 shadow-sm hover:shadow-md"
                    placeholder="Enter your full name"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    Date of Birth
                  </label>
                  <input
                    type="text"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    placeholder="DD-MM-YYYY (e.g., 25-12-1990)"
                    className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent text-black transition-all duration-300 shadow-sm hover:shadow-md"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-600" />
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent text-black transition-all duration-300 shadow-sm hover:shadow-md"
                    placeholder="example@domain.com"
                    disabled={isSubmitting}
                  />
                  {formData.email !== user?.email && (
                    <div className="flex items-center gap-2 text-xs text-gray-600 mt-2 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                      <AlertCircle className="w-3 h-3 text-yellow-600" />
                      <span className="font-medium">Changing your email will require verification</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-600" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent text-black transition-all duration-300 shadow-sm hover:shadow-md"
                    placeholder="+91 987 654 3210"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...profileData });
                    setIsEditing(false);
                  }}
                  className="px-8 py-4 bg-gray-100 text-gray-700 rounded-2xl font-semibold hover:bg-gray-200 transition-all duration-300 flex items-center gap-2 shadow-sm hover:shadow-md"
                  disabled={isSubmitting}
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-4 bg-black text-white rounded-2xl font-semibold hover:bg-gray-800 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col h-full">
              {/* Profile Header - Viewing Mode */}
              <div className="flex flex-col items-center justify-center mb-10">
                <div className="relative mb-6">
                  <div className="w-32 h-32 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden shadow-2xl ring-4 ring-white">
                    {profileData.profileImg ? (
                      <ProgressiveImage
                        src={profileData.profileImg}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <DefaultAvatar
                        className="w-full h-full"
                        iconClassName="w-16 h-16 md:w-20 md:h-20 text-gray-400"
                      />
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{profileData.name || 'User'}</h2>
                <p className="text-gray-500 text-sm font-medium">{profileData.email}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                  <Shield className="w-3 h-3" />
                  <span>Verified Account</span>
                </div>
              </div>

              {/* Profile Information Cards */}
              <div className="space-y-4 flex-1">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 md:p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-black rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                      <User className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm text-gray-500 mb-1 font-medium">Full Name</h3>
                      <p className="text-gray-900 font-semibold text-base md:text-lg truncate">{profileData.name || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 md:p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-black rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                      <Calendar className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm text-gray-500 mb-1 font-medium">Date of Birth</h3>
                      <p className="text-gray-900 font-semibold text-base md:text-lg truncate">{profileData.dob || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 md:p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-black rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                      <Mail className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm text-gray-500 mb-1 font-medium">Email</h3>
                      <p className="text-gray-900 font-semibold text-base md:text-lg break-all">{profileData.email}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 md:p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-black rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                      <Phone className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm text-gray-500 mb-1 font-medium">Phone Number</h3>
                      <p className="text-gray-900 font-semibold text-base md:text-lg truncate">{profileData.phone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-4 mt-8">
                <button
                  aria-label="Edit profile information"
                  onClick={() => setIsEditing(true)}
                  className="w-full py-4 bg-black text-white rounded-2xl font-semibold hover:bg-gray-800 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Edit3 className="w-5 h-5" />
                  Edit Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full py-4 bg-gray-600 text-white rounded-2xl font-semibold hover:bg-gray-700 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
                <button
                  onClick={() => setShowDeletePopup(true)}
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-semibold hover:bg-red-700 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Profile Popup */}
      <DeleteProfilePopup
        isOpen={showDeletePopup}
        onClose={() => setShowDeletePopup(false)}
      />
    </div>
  );
};

export default ProfilePage;