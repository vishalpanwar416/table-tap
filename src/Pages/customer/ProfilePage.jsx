import React, { useState, useEffect } from 'react';
import { ArrowLeft, Camera, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';

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
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!user || error) return;

      setUser(user);
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, email, mobile_number, date_of_birth, avatar_url')
        .eq('id', user.id)
        .single();

      if (!profileError) {
        const dobDate = profile.date_of_birth ? new Date(profile.date_of_birth) : null;
        const dobString = dobDate ? 
          `${dobDate.getDate()}/${dobDate.getMonth() + 1}/${dobDate.getFullYear()}` : '';

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
    };

    fetchProfile();

    const channel = supabase.channel('profile-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
      }, (payload) => {
        if (user?.id && payload.new.id === user.id) {
          const dobDate = payload.new.date_of_birth ? 
            new Date(payload.new.date_of_birth) : null;
          const dobString = dobDate ? 
            `${dobDate.getDate()}/${dobDate.getMonth() + 1}/${dobDate.getFullYear()}` : '';

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

  const handleImageUpload = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;
  
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication required');
  
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-photos/${user.id}/${fileName}`;
  
      // Corrected storage access
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload( filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
  
      if (uploadError) throw uploadError;
  
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
  
      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);
  
      if (updateError) throw updateError;
  
      // Update state
      setProfileData(prev => ({ ...prev, profileImg: publicUrl }));
      setFormData(prev => ({ ...prev, profileImg: publicUrl }));
      
    } catch (error) {
      alert('Error uploading image: ' + error.message);
    } finally {
      setUploading(false);
    }
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) return;

    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      alert('Phone number must be at least 10 digits');
      return;
    }

    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(formData.dob)) {
      alert('Please use DD/MM/YYYY format for date of birth');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.email)) {
    alert('Please enter a valid email address');
    return;
  }


    try {
      const [day, month, year] = formData.dob.split('/');
      const dobDate = new Date(`${year}-${month}-${day}`);
      const { data: { user: updatedUser }, error: authError } = await supabase.auth.updateUser({
        email: formData.email
      });
      if (authError) throw authError;
      const { error: reAuthError } = await supabase.auth.reauthenticate();
if (reAuthError) throw reAuthError;
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.name,
          email: formData.email,
          mobile_number: cleanPhone,
          date_of_birth: dobDate.toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      setProfileData(prev => ({
        ...prev,
        name: formData.name,
        phone: cleanPhone,
        dob: formData.dob,
        email: formData.email
      }));
      if (updatedUser.email_confirmed_at) {
        // Update profile here
      } else {
        alert('Please verify your new email address before continuing');
      }
      //setProfileData(formData);
      setIsEditing(false);
    alert('Profile updated successfully! Please check your new email for verification.');
    } catch (error) {
      console.error('Update error:', error);
      alert('Error updating profile: ' + error.message);
    }
  };

  return (
    <div className="flex justify-center items-start min-h-screen bg-black p-4">
      <div className="w-full max-w-[390px] md:max-w-4xl lg:max-w-6xl h-screen flex flex-col">
        <button 
          className="absolute left-4 top-7 md:left-8 md:top-8 text-orange-500 hover:text-orange-600 transition-colors z-10"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={30} className="md:w-8 md:h-8" />
        </button>

        <div className="pt-4 md:pt-6 pb-6 relative">
          <h1 className="text-3xl md:text-3xl text-center text-white font-spartan-medium">
            My Profile
          </h1>
        </div>

        <div className="bg-white rounded-3xl p-4 md:p-6 flex-1 flex flex-col min-h-[calc(100vh-200px)] overflow-y-auto shadow-xl">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
              <div className="flex flex-col items-center justify-center mb-6">
                <div className="relative">
                  <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-gray-200 overflow-hidden relative">
                    <img 
                      src={formData.profileImg || "/default-avatar.png"} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <label className="absolute bottom-0 right-0 bg-black/80 p-2 rounded-full cursor-pointer hover:bg-black transition-colors">
                    <Camera className="w-5 h-5 text-white" />
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </label>
                  {uploading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500 ml-1">Full Name</label>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full p-4 bg-gray-100 rounded-xl border-0 focus:ring-2 focus:ring-orange-500 text-black"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-500 ml-1">Date of Birth</label>
                  <input 
                    type="text" 
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    className="w-full p-4 bg-gray-100 rounded-xl border-0 focus:ring-2 focus:ring-orange-500 text-black"
                    placeholder="DD/MM/YYYY"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-500 ml-1">Email</label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-4 bg-gray-100 rounded-xl border-0 focus:ring-2 focus:ring-orange-500 text-black"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-500 ml-1">Phone</label>
                  <input 
                    type="tel" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full p-4 bg-gray-100 rounded-xl border-0 focus:ring-2 focus:ring-orange-500 text-black"
                    placeholder="+91 987 654 3210"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 justify-center pt-4">
                <button 
                  type="button"
                  onClick={() => {
                    setFormData({...profileData});
                    setIsEditing(false);
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-black/80 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex flex-col items-center justify-center mb-8">
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-gray-200 overflow-hidden mb-4">
                  <img 
                    src={profileData.profileImg || "/default-avatar.png"} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-black">{profileData.name}</h2>
                <p className="text-gray-500">{profileData.email}</p>
              </div>
              
              <div className="space-y-6 flex-1">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h3 className="text-sm text-gray-500 mb-1">Full Name</h3>
                  <p className="text-black font-medium">{profileData.name}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h3 className="text-sm text-gray-500 mb-1">Date of Birth</h3>
                  <p className="text-black font-medium">{profileData.dob}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h3 className="text-sm text-gray-500 mb-1">Email</h3>
                  <p className="text-black font-medium">{profileData.email}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h3 className="text-sm text-gray-500 mb-1">Phone</h3>
                  <p className="text-black font-medium">{profileData.phone}</p>
                </div>
              </div>
              
              <div className="flex flex-col gap-3 mt-6">
                <button 
                  onClick={() => setIsEditing(true)}
                  className="w-full py-3 bg-black text-white rounded-xl font-medium hover:bg-black/80 transition-colors"
                >
                  Edit Profile
                </button>
                <button 
                  onClick={() => supabase.auth.signOut().then(() => navigate('/login'))}
                  className="w-full py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;