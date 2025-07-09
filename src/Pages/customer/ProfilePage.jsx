import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Camera, LogOut, Trash2, User, Mail, Phone, Calendar, Edit3, Save, X, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import DeleteProfilePopup from '../../components/auth/DeleteProfilePopup';

const ProfilePage = () => {
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    dob: "",
    profileImg: ""
  });
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({...profileData});
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data: { user }, error } = await supabase.auth.getUser();
        if (!user || error) {
          setError('Authentication required');
          return;
        }

        setUser(user);
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, email, mobile_number, date_of_birth, avatar_url')
          .eq('id', user.id)
          .single();

        if (!profileError) {
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

  const handleImageUpload = useCallback(async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;
  
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication required');
  
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
      alert('Error uploading image: ' + error.message);
    } finally {
      setUploading(false);
    }
  }, []);

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
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.name,
          mobile_number: cleanPhone,
          date_of_birth: dobDate.toISOString()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

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
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      alert('Error logging out. Please try again.');
    }
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black p-4">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Loading Profile</h2>
          <p className="text-gray-400">Getting your information...</p>
        </div>
      </div>
    );
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
            className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
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
        
        {/* Back Button */}
        <button 
          className="absolute left-4 top-7 md:left-8 md:top-8 text-orange-500 hover:text-orange-600 transition-colors z-10"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={30} className="md:w-8 md:h-8" />
        </button>

        {/* Page Title */}
        <div className="pt-4 md:pt-6 pb-4 relative">
          <h1 className="text-2xl md:text-4xl text-center text-white font-spartan-medium">
            My Profile
          </h1>
          <p className="text-center text-gray-400 mt-2 text-sm md:text-base">
            Manage your account information
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-3xl p-4 md:p-6 flex-1 flex flex-col min-h-[calc(100vh-200px)] overflow-y-auto shadow-xl">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
              {/* Profile Image Section */}
              <div className="flex flex-col items-center justify-center mb-6">
                <div className="relative group">
                  <div className="w-32 h-32 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 overflow-hidden relative shadow-lg">
                    <img 
                      src={formData.profileImg || "/default-avatar.png"} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <label className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm p-3 rounded-full cursor-pointer hover:bg-black transition-all duration-200 group-hover:scale-110 shadow-lg">
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
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Tap the camera icon to change your photo
                </p>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User className="w-4 h-4 text-orange-500" />
                    Full Name
                  </label>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black transition-all duration-200"
                    placeholder="Enter your full name"
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    Date of Birth
                  </label>
                  <input 
                    type="text" 
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    placeholder="DD-MM-YYYY (e.g., 25-12-1990)"
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black transition-all duration-200"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-orange-500" />
                    Email
                  </label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black transition-all duration-200"
                    placeholder="example@domain.com"
                    disabled={isSubmitting}
                  />
                  {formData.email !== user?.email && (
                    <div className="flex items-center gap-2 text-xs text-orange-600 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>Changing your email will require verification</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-orange-500" />
                    Phone Number
                  </label>
                  <input 
                    type="tel" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black transition-all duration-200"
                    placeholder="+91 987 654 3210"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3 justify-center pt-4">
                <button 
                  type="button"
                  onClick={() => {
                    setFormData({...profileData});
                    setIsEditing(false);
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200 flex items-center gap-2"
                  disabled={isSubmitting}
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
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
              {/* Profile Header */}
              <div className="flex flex-col items-center justify-center mb-8">
                <div className="w-32 h-32 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 overflow-hidden mb-4 shadow-lg">
                  <img 
                    src={profileData.profileImg || "/default-avatar.png"} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">{profileData.name || 'User'}</h2>
                <p className="text-gray-500 text-sm">{profileData.email}</p>
              </div>
              
              {/* Profile Information Cards */}
              <div className="space-y-4 flex-1">
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm text-gray-500 mb-1">Full Name</h3>
                      <p className="text-gray-900 font-medium">{profileData.name || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm text-gray-500 mb-1">Date of Birth</h3>
                      <p className="text-gray-900 font-medium">{profileData.dob || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm text-gray-500 mb-1">Email</h3>
                      <p className="text-gray-900 font-medium">{profileData.email}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                      <Phone className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm text-gray-500 mb-1">Phone Number</h3>
                      <p className="text-gray-900 font-medium">{profileData.phone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col gap-3 mt-6">
                <button 
                  onClick={() => setIsEditing(true)}
                  className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium hover:from-orange-600 hover:to-orange-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Edit3 className="w-5 h-5" />
                  Edit Profile
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl font-medium hover:from-gray-700 hover:to-gray-800 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
                <button 
                  onClick={() => setShowDeletePopup(true)}
                  className="w-full py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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