import React, { useState } from 'react';
import { X, Upload, Trash2, MapPin, Phone, Mail, Clock, Globe, Building2, Users } from 'lucide-react';

// Utility function to extract coordinates from Google Maps links
const extractCoordinatesFromGoogleMaps = (url) => {
  if (!url) return { latitude: '', longitude: '' };
  
  try {
    // Try to extract coordinates from Google Maps URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    // Look for coordinates in the path
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (part.includes('@')) {
        const coordsMatch = part.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (coordsMatch) {
          return {
            latitude: coordsMatch[2],
            longitude: coordsMatch[1]
          };
        }
      }
    }
    
    // If no coordinates found in path, try query parameters
    const queryParams = urlObj.searchParams;
    const lat = queryParams.get('lat') || queryParams.get('latitude');
    const lng = queryParams.get('lng') || queryParams.get('longitude');
    
    if (lat && lng) {
      return { latitude: lat, longitude: lng };
    }
    
    return { latitude: '', longitude: '' };
  } catch (error) {
    return { latitude: '', longitude: '' };
  }
};

// Function to check if URL is a short Google Maps URL
const isShortGoogleMapsUrl = (url) => {
  return url && (
    url.includes('maps.app.goo.gl') ||
    url.includes('goo.gl/maps') ||
    url.includes('maps.google.com/maps?q=') && !url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/)
  );
};

// Restaurant Modal
export const RestaurantModal = ({ show, onClose, onSubmit, data, setData, isEditing }) => {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(data.logo_url || '');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 font-spartan">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto font-spartan">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold font-spartan">
              {isEditing ? 'Edit Restaurant' : 'Add New Restaurant'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 font-spartan">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-spartan">
                  Restaurant Name *
                </label>
                <input
                  type="text"
                  required
                  value={data.name || ''}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-spartan"
                  placeholder="Enter restaurant name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-spartan">
                  Cuisine Type
                </label>
                <input
                  type="text"
                  value={data.cuisine_type || ''}
                  onChange={(e) => setData({ ...data, cuisine_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-spartan"
                  placeholder="e.g., Italian, Indian, Chinese"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-spartan">
                Address
              </label>
              <textarea
                value={data.address || ''}
                onChange={(e) => setData({ ...data, address: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-spartan"
                placeholder="Enter full address"
              />
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-spartan">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={data.contact_phone || ''}
                  onChange={(e) => setData({ ...data, contact_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-spartan"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-spartan">
                  Email Address
                </label>
                <input
                  type="email"
                  value={data.contact_email || ''}
                  onChange={(e) => setData({ ...data, contact_email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-spartan"
                  placeholder="Enter email address"
                />
              </div>
            </div>

            {/* Business Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-spartan">
                  Opening Hours
                </label>
                <input
                  type="text"
                  value={data.opening_hours || ''}
                  onChange={(e) => setData({ ...data, opening_hours: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-spartan"
                  placeholder="e.g., 9:00 AM - 10:00 PM"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-spartan">
                  GST Number
                </label>
                <input
                  type="text"
                  value={data.gst_number || ''}
                  onChange={(e) => setData({ ...data, gst_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-spartan"
                  placeholder="Enter GST number"
                />
              </div>
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-spartan">
                Restaurant Logo
              </label>
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Logo preview" className="w-full h-full object-cover" />
                  ) : (
                    <Upload className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 font-spartan"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Logo
                  </label>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-spartan">
                Description
              </label>
              <textarea
                value={data.description || ''}
                onChange={(e) => setData({ ...data, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-spartan"
                placeholder="Enter restaurant description"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-spartan"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-spartan"
              >
                {isEditing ? 'Update Restaurant' : 'Add Restaurant'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Staff Modal
export const StaffModal = ({ show, onClose, onSubmit, data, setData, restaurants, isEditing }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 font-spartan">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto font-spartan">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold font-spartan">
              {isEditing ? 'Edit Staff Member' : 'Add New Staff Member'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 font-spartan">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-spartan">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={data.name || ''}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-spartan"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-spartan">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={data.email || ''}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-spartan"
                  placeholder="Enter email address"
                />
              </div>
            </div>

            {/* Contact and Role */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-spartan">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={data.phone_number || ''}
                  onChange={(e) => setData({ ...data, phone_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-spartan"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-spartan">
                  Role *
                </label>
                <select
                  required
                  value={data.role || ''}
                  onChange={(e) => setData({ ...data, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-spartan"
                >
                  <option value="" className="font-spartan">Select role</option>
                  <option value="manager" className="font-spartan">Manager</option>
                  <option value="captain" className="font-spartan">Captain</option>
                  <option value="waiter" className="font-spartan">Waiter</option>
                  <option value="chef" className="font-spartan">Chef</option>
                  <option value="cashier" className="font-spartan">Cashier</option>
                </select>
              </div>
            </div>

            {/* Restaurant Assignment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-spartan">
                Assign to Restaurant *
              </label>
              <select
                required
                value={data.restaurant_id || ''}
                onChange={(e) => setData({ ...data, restaurant_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-spartan"
              >
                <option value="" className="font-spartan">Select restaurant</option>
                {restaurants.map(restaurant => (
                  <option key={restaurant.id} value={restaurant.id} className="font-spartan">
                    {restaurant.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-spartan"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-spartan"
              >
                {isEditing ? 'Update Staff' : 'Add Staff'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default { RestaurantModal, StaffModal }; 