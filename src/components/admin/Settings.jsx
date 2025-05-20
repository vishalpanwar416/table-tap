import React, { useState } from 'react';
import { Settings, Save, RefreshCw } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';

const SettingsManagement = () => {
  const { restaurant, updateRestaurant } = useRestaurant();
  // Add google_maps_link to the default restaurant if it doesn't exist
  const initialRestaurant = {
    ...restaurant,
    google_maps_link: restaurant.google_maps_link || ""
  };
  const [formData, setFormData] = useState(initialRestaurant);
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = updateRestaurant(formData);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setIsEditing(false);
    }
  };

  const handleReset = () => {
    setFormData(restaurant);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Restaurant Settings</h2>
        <Settings className="w-6 h-6 text-gray-500" />
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
              <input
                type="text"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
              <input
                type="email"
                name="contact_email"
                value={formData.contact_email}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine Type</label>
              <input
                type="text"
                name="cuisine_type"
                value={formData.cuisine_type}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Opening Hours</label>
              <input
                type="text"
                name="opening_hours"
                value={formData.opening_hours}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Google Maps Link</label>
              <input
                type="text"
                name="google_maps_link"
                value={formData.google_maps_link}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="https://maps.google.com/..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full p-2 border border-gray-300 rounded-md"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md text-white hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          {saveSuccess && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    Restaurant settings updated successfully!
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Restaurant Name</h3>
                <p className="mt-1 text-sm text-gray-900">{restaurant.name}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Contact Phone</h3>
                <p className="mt-1 text-sm text-gray-900">{restaurant.contact_phone}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Contact Email</h3>
                <p className="mt-1 text-sm text-gray-900">{restaurant.contact_email}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Cuisine Type</h3>
                <p className="mt-1 text-sm text-gray-900">{restaurant.cuisine_type}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Opening Hours</h3>
                <p className="mt-1 text-sm text-gray-900">{restaurant.opening_hours}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Google Maps Link</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {restaurant.google_maps_link ? (
                    <a 
                      href={restaurant.google_maps_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View on Google Maps
                    </a>
                  ) : (
                    "Not provided"
                  )}
                </p>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-500">Address</h3>
              <p className="mt-1 text-sm text-gray-900">{restaurant.address}</p>
            </div>
            
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-500">Description</h3>
              <p className="mt-1 text-sm text-gray-900">{restaurant.description}</p>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Edit Information
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsManagement;