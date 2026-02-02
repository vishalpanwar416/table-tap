import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Trash2, MapPin, Phone, Mail, Clock, Globe, Building2, Users, ChevronDown, Check, UserCog, Star, Award, ChefHat, UtensilsCrossed, Coins, Crown } from 'lucide-react';
import { uploadRestaurantPhotoForAdmin, uploadRestaurantLogo, getRestaurantManagers, updateManagerDetails } from '../admin_service';
// Remove the supabase import since we're moving all calls to the service
// import { supabase } from '../../../../shared/supabase'; 

// Utility function to extract coordinates from Google Maps links
const extractCoordinatesFromGoogleMaps = (url) => {
  if (!url) return { latitude: '', longitude: '' };

  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');

    // Look for @lat,lng in the path
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      if (part.startsWith('@')) {
        // Remove '@', split by comma, and take first two numbers
        const coords = part.substring(1).split(',');
        if (coords.length >= 2) {
          return {
            latitude: coords[0],
            longitude: coords[1]
          };
        }
      }
    }
    // Try query param q=lat,lng
    const queryParams = urlObj.searchParams;
    const q = queryParams.get('q');
    if (q && /^-?\d+\.\d+,-?\d+\.\d+$/.test(q)) {
      const [lat, lng] = q.split(',');
      return { latitude: lat, longitude: lng };
    }
    // Try lat/lng params
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [restaurantPhotoFile, setRestaurantPhotoFile] = useState(null);
  const [managers, setManagers] = useState([]); // Add this
  const [selectedManagerId, setSelectedManagerId] = useState(''); // Add this

  // Update image preview when data change
  useEffect(() => {
    setImagePreview(data.logo_url || '');
  }, [data.logo_url]);

  // Fetch managers when editing
  useEffect(() => {
    if (isEditing && data.id) {
      fetchManagers(data.id);
    }
  }, [isEditing, data.id]);

  // Add this function to fetch managers
  const fetchManagers = async (restaurantId) => {
    try {
      const { data: managersData, error } = await getRestaurantManagers(restaurantId);

      if (!error && managersData) {
        setManagers(managersData);
        // Set the first manager as selected by default
        if (managersData.length > 0) {
          const firstManager = managersData[0];
          setSelectedManagerId(firstManager.id);
          setData(prev => ({
            ...prev,
            manager_name: firstManager.staff_name || '',
            manager_email: firstManager.staff_email || '',
            manager_phone: firstManager.staff_phone_number || ''
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching managers:', error);
    }
  };

  // Handle manager selection
  const handleManagerChange = (managerId) => {
    setSelectedManagerId(managerId);
    const selectedManager = managers.find(m => m.id === managerId);
    if (selectedManager) {
      setData(prev => ({
        ...prev,
        manager_name: selectedManager.staff_name || '',
        manager_email: selectedManager.staff_email || '',
        manager_phone: selectedManager.staff_phone_number || ''
      }));
    }
  };

  // Auto-fill latitude/longitude when google_maps_link changes
  useEffect(() => {
    if (data.google_maps_link) {
      const { latitude, longitude } = extractCoordinatesFromGoogleMaps(data.google_maps_link);
      if (latitude && longitude) {
        // Only update if different to avoid infinite loop
        if (data.latitude !== latitude || data.longitude !== longitude) {
          setData(prev => ({
            ...prev,
            latitude,
            longitude,
          }));
        }
      }
    }
  }, [data.google_maps_link, setData]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setIsSubmitting(true);
        // Use a temporary ID if restaurant is not yet created
        const tempId = data.id || `temp_${Date.now()}`;
        const { url, error } = await uploadRestaurantLogo(file, tempId);

        if (url) {
          setImagePreview(url);
          setData({ ...data, logo_url: url });
        } else {
          alert(error || 'Failed to upload logo');
        }
      } catch (error) {
        alert('Error uploading logo: ' + error.message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(e);

      // If editing and a manager is selected, update the manager details
      if (isEditing && selectedManagerId) {
        const { error } = await updateManagerDetails(selectedManagerId, data);
        if (error) {
          console.error('Error updating manager details:', error);
        }
      }

      // Then upload the photo if there's a file
      if (restaurantPhotoFile && data.id) {
        const { url, error } = await uploadRestaurantPhotoForAdmin(restaurantPhotoFile, data.id);
        if (url) {
          // Update the restaurant with the photo URL
          // You might need to call an update function here
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setData({ ...data, logo_url: '' });
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 px-8 py-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">
                  {isEditing ? 'Edit Restaurant' : 'Add New Restaurant'}
                </h3>
                <p className="text-blue-100 text-sm">
                  {isEditing ? 'Update restaurant information' : 'Create a new restaurant profile'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(92vh-120px)]">
          <div className="space-y-8">
            {/* Logo Section */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
              <label className="block text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                Restaurant Logo
              </label>
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-dashed border-blue-200 rounded-2xl flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:border-blue-400">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Logo preview" className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="w-8 h-8 text-blue-400" />
                    )}
                  </div>
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
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
                    className="cursor-pointer inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Logo
                  </label>
                  <p className="text-sm text-gray-500 mt-2">
                    Recommended: 200x200px, max 2MB
                  </p>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-500" />
                  Restaurant Name *
                </label>
                <input
                  type="text"
                  required
                  value={data.name || ''}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300"
                  placeholder="Enter restaurant name"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-500" />
                  Cuisine Type
                </label>
                <input
                  type="text"
                  value={data.cuisine_type || ''}
                  onChange={(e) => setData({ ...data, cuisine_type: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300"
                  placeholder="e.g., Italian, Indian, Chinese"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-500" />
                Address *
              </label>
              <textarea
                required
                value={data.address || ''}
                onChange={(e) => setData({ ...data, address: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300 resize-none"
                placeholder="Enter full address"
              />
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-green-500" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={data.contact_phone || ''}
                  onChange={(e) => setData({ ...data, contact_phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300"
                  placeholder="Enter phone number"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-500" />
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={data.contact_email || ''}
                  onChange={(e) => setData({ ...data, contact_email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300"
                  placeholder="Enter email address"
                />
              </div>
            </div>

            {/* Compliance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-500" />
                  GST Number
                </label>
                <input
                  type="text"
                  value={data.gst_number || ''}
                  onChange={(e) => setData({ ...data, gst_number: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300"
                  placeholder="Enter GST number"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-orange-500" />
                  FSSAI License
                </label>
                <input
                  type="text"
                  value={data.fssai_license || ''}
                  onChange={(e) => setData({ ...data, fssai_license: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300"
                  placeholder="Enter FSSAI License Number"
                />
              </div>
            </div>

            {/* Manager Information */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-500" />
                Manager Information
              </label>

              {isEditing && managers.length > 1 ? (
                // Show dropdown if multiple managers
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Manager
                    </label>
                    <select
                      value={selectedManagerId}
                      onChange={(e) => handleManagerChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {managers.map(manager => (
                        <option key={manager.id} value={manager.id}>
                          {manager.staff_name || manager.staff_email} {manager.connected ? '(Connected)' : '(Not Connected)'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Manager Name
                      </label>
                      <input
                        type="text"
                        value={data.manager_name || ''}
                        onChange={(e) => setData({ ...data, manager_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter manager's name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Manager Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={data.manager_email || ''}
                        onChange={(e) => setData({ ...data, manager_email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter manager's email address"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Manager Phone
                    </label>
                    <input
                      type="tel"
                      value={data.manager_phone || ''}
                      onChange={(e) => setData({ ...data, manager_phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter manager's phone number"
                    />
                  </div>
                </div>
              ) : (
                // Show regular form fields for new restaurant or single manager
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Manager Name
                    </label>
                    <input
                      type="text"
                      value={data.manager_name || ''}
                      onChange={(e) => setData({ ...data, manager_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter manager's name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Manager Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={data.manager_email || ''}
                      onChange={(e) => setData({ ...data, manager_email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter manager's email address"
                    />
                  </div>
                </div>
              )}

              {!isEditing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Manager Phone
                  </label>
                  <input
                    type="tel"
                    value={data.manager_phone || ''}
                    onChange={(e) => setData({ ...data, manager_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter manager's phone number"
                  />
                </div>
              )}
            </div>

            {/* Business Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  Opening Hours *
                </label>
                <input
                  type="text"
                  required
                  value={data.opening_hours || ''}
                  onChange={(e) => setData({ ...data, opening_hours: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300"
                  placeholder="e.g., 9:00 AM - 10:00 PM"
                  list="opening-hours-suggestions"
                />
                <datalist id="opening-hours-suggestions">
                  <option value="8:00 AM - 8:00 PM" />
                  <option value="9:00 AM - 10:00 PM" />
                  <option value="10:00 AM - 11:00 PM" />
                  <option value="11:00 AM - 11:00 PM" />
                  <option value="24 Hours" />
                  <option value="7:00 AM - 11:00 PM" />
                  <option value="11:00 AM - 12:00 AM" />
                  <option value="12:00 PM - 12:00 AM" />
                  <option value="Closed on Mondays" />
                </datalist>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-500" />
                  GST Number
                </label>
                <input
                  type="text"
                  value={data.gst_number || ''}
                  onChange={(e) => setData({ ...data, gst_number: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300"
                  placeholder="Enter GST number"
                />
              </div> {/* moved GST to Compliance section above */}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Description
              </label>
              <textarea
                value={data.description || ''}
                onChange={(e) => setData({ ...data, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300 resize-none"
                placeholder="Enter restaurant description"
              />
            </div>

            {/* Google Maps Link */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Globe className="w-4 h-4 text-green-500" />
                Google Maps Link
              </label>
              <input
                type="url"
                value={data.google_maps_link || ''}
                onChange={(e) => setData({ ...data, google_maps_link: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300"
                placeholder="Paste Google Maps URL"
              />
            </div>

            {/* Latitude & Longitude */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={data.latitude || ''}
                  onChange={(e) => setData({ ...data, latitude: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300"
                  placeholder="Latitude"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-500" />
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={data.longitude || ''}
                  onChange={(e) => setData({ ...data, longitude: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300"
                  placeholder="Longitude"
                />
              </div>
            </div>

            {/* Aggregator Integrations */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-100">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-orange-500" />
                  Aggregator Integrations
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 font-medium">Enabled</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={data.aggregators_enabled || false}
                      onChange={(e) => setData({ ...data, aggregators_enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <img src="https://www.swiggy.com/favicon.ico" alt="Swiggy" className="w-4 h-4" />
                    Swiggy API Key
                  </label>
                  <input
                    type="text"
                    value={data.swiggy_api_key || ''}
                    onChange={(e) => setData({ ...data, swiggy_api_key: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 bg-white"
                    placeholder="Enter Swiggy API Key"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <img src="https://www.zomato.com/favicon.ico" alt="Zomato" className="w-4 h-4" />
                    Zomato API Key
                  </label>
                  <input
                    type="text"
                    value={data.zomato_api_key || ''}
                    onChange={(e) => setData({ ...data, zomato_api_key: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 bg-white"
                    placeholder="Enter Zomato API Key"
                  />
                </div>
              </div>
            </div>

            {/* Restaurant Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-spartan">
                Restaurant Photo
              </label>
              <div className="flex items-center space-x-4">
                <div className="w-32 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  {data.restaurant_photo_url ? (
                    <img src={data.restaurant_photo_url} alt="Restaurant preview" className="w-full h-full object-cover" />
                  ) : (
                    <Upload className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        try {
                          // Use a temporary ID if restaurant is not yet created
                          const tempId = data.id || `temp_${Date.now()}`;
                          const { url, error } = await uploadRestaurantPhotoForAdmin(file, tempId);
                          if (url) {
                            setData({ ...data, restaurant_photo_url: url });
                          } else {
                            alert(error || 'Failed to upload photo');
                          }
                        } catch (error) {
                          alert('Error uploading photo: ' + error.message);
                        }
                      }
                    }}
                    className="hidden"
                    id="restaurant-photo-upload"
                  />
                  <label
                    htmlFor="restaurant-photo-upload"
                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 font-spartan"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Photo
                  </label>
                </div>
              </div>
            </div>

            {/* moved FSSAI to Compliance section above */}

            {/* UPI ID */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                UPI ID
              </label>
              <input
                type="text"
                value={data.upi_id || ''}
                onChange={(e) => setData({ ...data, upi_id: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300"
                placeholder="Enter UPI ID"
              />
            </div>

            {/* Social Media Links */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Social Media Links
              </label>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <input
                  type="url"
                  value={data.social_media?.facebook || ''}
                  onChange={(e) => setData({ ...data, social_media: { ...data.social_media, facebook: e.target.value } })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300"
                  placeholder="Facebook URL"
                />
                <input
                  type="url"
                  value={data.social_media?.instagram || ''}
                  onChange={(e) => setData({ ...data, social_media: { ...data.social_media, instagram: e.target.value } })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300"
                  placeholder="Instagram URL"
                />
                <input
                  type="url"
                  value={data.social_media?.twitter || ''}
                  onChange={(e) => setData({ ...data, social_media: { ...data.social_media, twitter: e.target.value } })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300"
                  placeholder="Twitter URL"
                />
                <input
                  type="url"
                  value={data.social_media?.website || ''}
                  onChange={(e) => setData({ ...data, social_media: { ...data.social_media, website: e.target.value } })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300"
                  placeholder="Website URL"
                />
              </div>
            </div>

            {/* AI Enabled Toggle */}
            <div className="flex items-center space-x-3 mt-4">
              <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-400" />
                AI Enabled
              </label>
              <input
                type="checkbox"
                checked={!!data.ai_enabled}
                onChange={(e) => setData({ ...data, ai_enabled: e.target.checked })}
                className="form-checkbox h-5 w-5 text-indigo-600 transition duration-150"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:from-blue-700 hover:to-purple-700'
                  }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {isEditing ? 'Updating...' : 'Adding...'}
                  </div>
                ) : (
                  isEditing ? 'Update Restaurant' : 'Add Restaurant'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Staff Modal
export const StaffModal = ({ show, onClose, onSubmit, data, setData, restaurants, isEditing }) => {
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [restaurantSearch, setRestaurantSearch] = useState('');
  const [filteredRestaurants, setFilteredRestaurants] = useState(restaurants);
  const [highlightedIndex, setHighlightedIndex] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Role toggle options
  const roles = [
    { value: 'owner', label: 'Owner', icon: Crown, color: 'from-amber-600 to-yellow-600' },
    { value: 'manager', label: 'Manager', icon: UserCog, color: 'from-blue-600 to-indigo-600' },
    { value: 'captain', label: 'Captain', icon: Users, color: 'from-purple-600 to-pink-600' },
    { value: 'chef', label: 'Chef', icon: ChefHat, color: 'from-orange-600 to-red-600' },
    { value: 'waiter', label: 'Waiter', icon: UtensilsCrossed, color: 'from-green-600 to-emerald-600' },
    { value: 'cashier', label: 'Cashier', icon: Coins, color: 'from-yellow-600 to-amber-600' }
  ];

  // Initialize restaurant search when editing
  useEffect(() => {
    if (isEditing && data.restaurant_id) {
      const restaurant = restaurants.find(r => r.id === data.restaurant_id);
      if (restaurant) {
        setRestaurantSearch(restaurant.name);
      }
    } else {
      setRestaurantSearch('');
    }
  }, [isEditing, data.restaurant_id, restaurants]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setRestaurantSearch(value);
    setFilteredRestaurants(
      restaurants.filter((restaurant) =>
        restaurant.name.toLowerCase().includes(value.toLowerCase())
      )
    );
  };

  const handleClear = () => {
    setRestaurantSearch('');
    setFilteredRestaurants(restaurants);
    inputRef.current.focus();
  };

  const handleSelect = (restaurant) => {
    setData({ ...data, restaurant_id: restaurant.id });
    setRestaurantSearch(restaurant.name);
    setDropdownOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prevIndex) =>
        prevIndex < filteredRestaurants.length - 1 ? prevIndex + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prevIndex) =>
        prevIndex > 0 ? prevIndex - 1 : filteredRestaurants.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex !== null) {
        handleSelect(filteredRestaurants[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setDropdownOpen(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🔍 StaffModal handleSubmit called');
    console.log('🔍 Current form data:', data);
    console.log('🔍 Is editing:', isEditing);

    if (isEditing) {
      const confirmed = window.confirm(`Are you sure you want to update ${data.name}'s information?`);
      console.log('🔍 User confirmed update:', confirmed);
      if (!confirmed) return;
    }

    setIsSubmitting(true);
    console.log('🔍 Set submitting to true');

    try {
      console.log('🔍 About to call onSubmit with data:', data);
      await onSubmit(e);
      console.log(' onSubmit completed successfully');
    } catch (error) {
      console.error('❌ Error in StaffModal handleSubmit:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        data: data
      });
    } finally {
      console.log('🔍 Set submitting to false');
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !inputRef.current.contains(e.target)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Add this useEffect to track data changes
  useEffect(() => {
    if (isEditing) {
      console.log('🔍 StaffModal data changed:', data);
    }
  }, [data, isEditing]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 px-8 py-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">
                  {isEditing ? 'Edit Staff Member' : 'Add New Staff Member'}
                </h3>
                <p className="text-purple-100 text-sm">
                  {isEditing ? 'Update staff member information' : 'Create a new staff member profile'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(92vh-120px)]">
          <div className="space-y-8">
            {/* Basic Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={data.name || ''}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300"
                  placeholder="Enter full name"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-green-500" />
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={data.email || ''}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300"
                  placeholder="Enter email address"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-500" />
                Phone Number
              </label>
              <input
                type="tel"
                value={data.phone_number || ''}
                onChange={(e) => setData({ ...data, phone_number: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300"
                placeholder="Enter phone number"
              />
            </div>

            {/* Role Selection */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                <UserCog className="w-4 h-4 text-purple-500" />
                Role *
              </label>
              <div className="flex gap-4 bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-2xl border border-gray-200">
                {roles.map((role) => {
                  const Icon = role.icon;
                  return (
                    <button
                      type="button"
                      key={role.value}
                      onClick={() => setData({ ...data, role: role.value })}
                      className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all duration-300 ${data.role === role.value
                        ? `bg-gradient-to-r ${role.color} text-white shadow-lg scale-105 border-2 border-white`
                        : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      <Icon className="w-5 h-5" />
                      {role.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Restaurant Assignment */}
            <div className="space-y-2 relative">
              <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-orange-500" />
                Assign to Restaurant *
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search and select restaurant..."
                  value={restaurantSearch}
                  ref={inputRef}
                  onFocus={() => setDropdownOpen(true)}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className="w-full px-4 py-3 pr-20 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300"
                  autoComplete="off"
                  required
                />
                {restaurantSearch && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-12 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>

              {dropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-auto z-30 animate-in slide-in-from-top-2 duration-200">
                  {filteredRestaurants.length === 0 ? (
                    <div className="px-4 py-3 text-gray-500 text-center">No restaurants found</div>
                  ) : (
                    filteredRestaurants.map((restaurant, idx) => (
                      <div
                        key={restaurant.id}
                        ref={dropdownRef}
                        className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-all duration-200 ${data.restaurant_id === restaurant.id
                          ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500'
                          : ''
                          } ${highlightedIndex === idx ? 'bg-gray-50' : ''
                          } hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl`}
                        onMouseDown={() => handleSelect(restaurant)}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-medium">{restaurant.name}</span>
                        </div>
                        {data.restaurant_id === restaurant.id && (
                          <Check className="w-5 h-5 text-purple-600" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:from-purple-700 hover:to-pink-700'
                  }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {isEditing ? 'Updating...' : 'Adding...'}
                  </div>
                ) : (
                  isEditing ? 'Update Staff' : 'Add Staff'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default { RestaurantModal, StaffModal };