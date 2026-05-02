import React, { useState, useRef } from 'react';
import { X, Camera, Upload, Trash2, User } from 'lucide-react';
import { supabase } from '../../../../shared/supabase';

const ProfilePhotoModal = ({ show, onClose, currentUser, onPhotoUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = async (file) => {
    if (!file) return;

    try {
      setUploading(true);
      
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-photos/${currentUser.id}/${fileName}`;

      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update the user's profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', currentUser.id);

      if (updateError) {
        throw updateError;
      }

      // Call the callback to update the UI
      onPhotoUpdate(publicUrl);
      setUploading(false);
    } catch (error) {
      setUploading(false);
      // Error handling without console
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setUploading(true);
      
      // Remove the old photo from storage if it exists
      if (currentUser?.avatar_url) {
        const oldFilePath = currentUser.avatar_url.split('/').pop();
        if (oldFilePath) {
          await supabase.storage
            .from('avatars')
            .remove([`profile-photos/${oldFilePath}`])
            .catch(() => {}); // Don't throw if file doesn't exist
        }
      }

      // Update the profile to remove the avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', currentUser.id);

      if (updateError) {
        throw updateError;
      }

      // Call the callback to update the UI
      onPhotoUpdate(null);
      setUploading(false);
    } catch (error) {
      setUploading(false);
      // Error handling without console
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Profile Photo
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Photo Display */}
        <div className="text-center mb-6">
          <div className="relative inline-block">
            {currentUser?.avatar_url ? (
              <img
                src={currentUser.avatar_url}
                alt="Current profile"
                className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary-500 flex items-center justify-center text-white text-2xl font-bold">
                {currentUser?.email?.charAt(0).toUpperCase() || 'A'}
              </div>
            )}
            
            {/* Preview overlay */}
            {previewUrl && (
              <div className="absolute inset-0 rounded-full overflow-hidden">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
          
          <p className="text-sm text-gray-600 mt-2">
            {currentUser?.avatar_url ? 'Current Profile Photo' : 'No Profile Photo'}
          </p>
        </div>

        {/* Upload Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload New Photo
            </label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileSelect}
                />
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={() => handlePhotoUpload(fileInputRef.current?.files[0])}
              disabled={!previewUrl || uploading}
              className="flex-1 bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  Upload Photo
                </>
              )}
            </button>
            
            {currentUser?.avatar_url && (
              <button
                onClick={handleRemovePhoto}
                disabled={uploading}
                className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePhotoModal; 