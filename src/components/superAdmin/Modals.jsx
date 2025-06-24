import React from 'react';
import { X } from 'lucide-react';

// Utility function to extract coordinates from Google Maps links
const extractCoordinatesFromGoogleMaps = (url) => {
  if (!url) return null;
  
  try {
    // Handle different Google Maps URL formats
    let coordinates = null;
    
    // Format 1: https://maps.google.com/?q=latitude,longitude
    const qParamMatch = url.match(/[?&]q=([^&]+)/);
    if (qParamMatch) {
      const qValue = decodeURIComponent(qParamMatch[1]);
      const coordsMatch = qValue.match(/(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (coordsMatch) {
        coordinates = {
          latitude: parseFloat(coordsMatch[1]),
          longitude: parseFloat(coordsMatch[2])
        };
      }
    }
    
    // Format 2: https://www.google.com/maps/place/.../@latitude,longitude,zoom
    if (!coordinates) {
      const atParamMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (atParamMatch) {
        coordinates = {
          latitude: parseFloat(atParamMatch[1]),
          longitude: parseFloat(atParamMatch[2])
        };
      }
    }
    
    // Format 3: https://maps.google.com/maps?ll=latitude,longitude
    if (!coordinates) {
      const llParamMatch = url.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (llParamMatch) {
        coordinates = {
          latitude: parseFloat(llParamMatch[1]),
          longitude: parseFloat(llParamMatch[2])
        };
      }
    }
    
    // Format 4: https://maps.google.com/maps?q=latitude,longitude
    if (!coordinates) {
      const qCoordsMatch = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (qCoordsMatch) {
        coordinates = {
          latitude: parseFloat(qCoordsMatch[1]),
          longitude: parseFloat(qCoordsMatch[2])
        };
      }
    }
    
    return coordinates;
  } catch (error) {
    console.error('Error extracting coordinates from Google Maps URL:', error);
    return null;
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

// Add/Edit Restaurant Modal
export const RestaurantModal = ({ 
  show, 
  onClose, 
  onSubmit, 
  data, 
  setData, 
  isEditing 
}) => {
  if (!show) return null;

  // Handle Google Maps link change and auto-fill coordinates
  const handleGoogleMapsLinkChange = (e) => {
    const url = e.target.value;
    
    // Extract coordinates from the URL
    const coordinates = extractCoordinatesFromGoogleMaps(url);
    
    if (coordinates) {
      // Update both URL and coordinates in a single setData call
      setData(prevData => ({
        ...prevData,
        google_maps_link: url,
        latitude: coordinates.latitude.toString(),
        longitude: coordinates.longitude.toString()
      }));
    } else {
      // Only update the URL if no coordinates found
      setData(prevData => ({
        ...prevData,
        google_maps_link: url
      }));
    }
    
    // Log for short URLs
    if (isShortGoogleMapsUrl(url)) {
      console.log('Short Google Maps URL detected. Coordinates cannot be auto-extracted.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={onSubmit} className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {isEditing ? 'Edit Restaurant' : 'Add New Restaurant'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <p className="text-sm text-gray-500 mb-4">Fields marked with * are required</p>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="border-b pb-4">
              <h4 className="text-md font-semibold mb-3">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Restaurant Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={data.name}
                    onChange={(e) => setData({...data, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cuisine Type
                  </label>
                  <input
                    type="text"
                    value={data.cuisine_type}
                    onChange={(e) => setData({...data, cuisine_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={data.description}
                    onChange={(e) => setData({...data, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    value={data.logo_url}
                    onChange={(e) => setData({...data, logo_url: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Opening Hours
                  </label>
                  <input
                    type="text"
                    value={data.opening_hours}
                    onChange={(e) => setData({...data, opening_hours: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Mon-Sun: 9AM-10PM"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-b pb-4">
              <h4 className="text-md font-semibold mb-3">Contact Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    value={data.address}
                    onChange={(e) => setData({...data, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    rows="2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={data.contact_phone}
                    onChange={(e) => setData({...data, contact_phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={data.contact_email}
                    onChange={(e) => setData({...data, contact_email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="border-b pb-4">
              <h4 className="text-md font-semibold mb-3">Location</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={data.latitude}
                    onChange={(e) => setData({...data, latitude: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 12.9716"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={data.longitude}
                    onChange={(e) => setData({...data, longitude: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 77.5946"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Google Maps Link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={data.google_maps_link}
                      onChange={handleGoogleMapsLinkChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="https://maps.google.com/?q=12.9716,77.5946"
                    />
                    <button
                      type="button"
                      onClick={() => window.open('https://maps.google.com', '_blank')}
                      className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md border border-gray-300"
                      title="Open Google Maps to find coordinates"
                    >
                      
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 space-y-1">
                    <p>Paste a Google Maps link to auto-fill coordinates</p>
                    {isShortGoogleMapsUrl(data.google_maps_link) && (
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2 mt-2">
                        <p className="text-yellow-700">
                          <strong>Note:</strong> Short Google Maps URLs cannot auto-extract coordinates. 
                        </p>
                        <p className="text-yellow-600 mt-1">
                          <strong>How to get coordinates:</strong>
                        </p>
                        <ol className="text-yellow-600 mt-1 ml-4 list-decimal">
                          <li>Right-click on the location in Google Maps</li>
                          <li>Select "What's here?" to see coordinates</li>
                          <li>Copy the full URL with coordinates</li>
                          <li>Or manually enter the coordinates above</li>
                        </ol>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Business Details */}
            <div className="border-b pb-4">
              <h4 className="text-md font-semibold mb-3">Business Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GST Number
                  </label>
                  <input
                    type="text"
                    value={data.gst_number}
                    onChange={(e) => setData({...data, gst_number: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    FSSAI License
                  </label>
                  <input
                    type="text"
                    value={data.fssai_license}
                    onChange={(e) => setData({...data, fssai_license: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="border-b pb-4">
              <h4 className="text-md font-semibold mb-3">Payment Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Razorpay Key ID
                  </label>
                  <input
                    type="text"
                    value={data.razorpay_key_id}
                    onChange={(e) => setData({...data, razorpay_key_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    value={data.currency}
                    onChange={(e) => setData({...data, currency: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="border-b pb-4">
              <h4 className="text-md font-semibold mb-3">Social Media</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Facebook
                  </label>
                  <input
                    type="url"
                    value={data.social_media.facebook}
                    onChange={(e) => setData({
                      ...data,
                      social_media: { ...data.social_media, facebook: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instagram
                  </label>
                  <input
                    type="url"
                    value={data.social_media.instagram}
                    onChange={(e) => setData({
                      ...data,
                      social_media: { ...data.social_media, instagram: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Twitter
                  </label>
                  <input
                    type="url"
                    value={data.social_media.twitter}
                    onChange={(e) => setData({
                      ...data,
                      social_media: { ...data.social_media, twitter: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    value={data.social_media.website}
                    onChange={(e) => setData({
                      ...data,
                      social_media: { ...data.social_media, website: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Manager Information */}
            {!isEditing && (
              <div>
                <h4 className="text-md font-semibold mb-3">Manager Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Manager Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={data.manager_name}
                      onChange={(e) => setData({...data, manager_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Manager Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={data.manager_email}
                      onChange={(e) => setData({...data, manager_email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Manager Phone Number
                    </label>
                    <input
                      type="tel"
                      value={data.manager_phone || ''}
                      onChange={(e) => setData({...data, manager_phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-3">
                      <p className="text-sm text-blue-700">
                        <strong>Note:</strong> This will create a restaurant staff entry for the manager. 
                        The manager can later connect their account by signing up with the same email address.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                {isEditing ? 'Update Restaurant' : 'Add Restaurant'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add/Edit Staff Modal
export const StaffModal = ({
  show,
  onClose,
  onSubmit,
  data,
  setData,
  restaurants,
  isEditing
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={onSubmit} className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {isEditing ? 'Edit Staff Member' : 'Add New Staff Member'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <p className="text-sm text-gray-500 mb-4">Fields marked with * are required</p>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="border-b pb-4">
              <h4 className="text-md font-semibold mb-3">Staff Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={data.name || ''}
                    onChange={(e) => setData({...data, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={data.email || ''}
                    onChange={(e) => setData({...data, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={data.phone_number || ''}
                    onChange={(e) => setData({...data, phone_number: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    required
                    value={data.role || 'captain'}
                    onChange={(e) => setData({...data, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="captain">Captain</option>
                    <option value="waiter">Waiter</option>
                    <option value="chef">Chef</option>
                    <option value="cashier">Cashier</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Restaurant Assignment */}
            <div className="border-b pb-4">
              <h4 className="text-md font-semibold mb-3">Restaurant Assignment</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Restaurant *
                </label>
                <select
                  required
                  value={data.restaurant_id || ''}
                  onChange={(e) => setData({...data, restaurant_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a restaurant</option>
                  {restaurants.map(restaurant => (
                    <option key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                {isEditing ? 'Update Staff Member' : 'Add Staff Member'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}; 