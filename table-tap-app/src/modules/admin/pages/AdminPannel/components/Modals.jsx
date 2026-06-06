import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  MapPin,
  Phone,
  Mail,
  Clock,
  Globe,
  Building2,
  Users,
  ChevronDown,
  Check,
  UserCog,
  Star,
  Award,
  ChefHat,
  UtensilsCrossed,
  Coins,
  Crown,
} from 'lucide-react';
import {
  uploadRestaurantPhotoForAdmin,
  uploadRestaurantLogo,
  getRestaurantOwners,
  updateOwnerDetails,
  getSystemSetting,
} from '../admin_service.js';
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
            longitude: coords[1],
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
  return (
    url &&
    (url.includes('maps.app.goo.gl') ||
      url.includes('goo.gl/maps') ||
      (url.includes('maps.google.com/maps?q=') && !url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/)))
  );
};

// Map Picker Component
const MapPicker = ({ apiKey, onLocationSelect, initialLocation }) => {
  const mapRef = useRef(null);
  const searchInputRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!apiKey) {
      setLoadError('Maps API Key is missing');
      setIsLoading(false);
      return;
    }

    const initMap = () => {
      if (!mapRef.current) return;

      try {
        const defaultLat = parseFloat(initialLocation?.lat);
        const defaultLng = parseFloat(initialLocation?.lng);

        const hasValidCoords = !isNaN(defaultLat) && !isNaN(defaultLng);
        const defaultLocation = hasValidCoords
          ? { lat: defaultLat, lng: defaultLng }
          : { lat: 20.5937, lng: 78.9629 }; // Center of India

        const googleMap = new window.google.maps.Map(mapRef.current, {
          center: defaultLocation,
          zoom: hasValidCoords ? 16 : 5,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: 'greedy', // Better for mobile
        });

        const googleMarker = new window.google.maps.Marker({
          position: defaultLocation,
          map: googleMap,
          draggable: true,
          animation: window.google.maps.Animation.DROP,
        });

        // Add "Locate Me" control
        const controlDiv = document.createElement('div');
        const controlUI = document.createElement('button');
        controlUI.type = 'button';
        controlUI.style.backgroundColor = '#fff';
        controlUI.style.border = '2px solid #fff';
        controlUI.style.borderRadius = '3px';
        controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
        controlUI.style.cursor = 'pointer';
        controlUI.style.margin = '10px';
        controlUI.style.padding = '8px';
        controlUI.title = 'Click to recenter to your location';
        controlUI.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></svg>';
        controlDiv.appendChild(controlUI);

        controlUI.addEventListener('click', () => {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const pos = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                };
                googleMap.setCenter(pos);
                googleMap.setZoom(17);
                googleMarker.setPosition(pos);
                onLocationSelect(pos);
              },
              () => {
                alert('Error: The Geolocation service failed.');
              },
            );
          } else {
            alert("Error: Your browser doesn't support geolocation.");
          }
        });

        googleMap.controls[window.google.maps.ControlPosition.RIGHT_BOTTOM].push(controlDiv);

        // Search Box logic
        if (searchInputRef.current && window.google.maps.places) {
          const searchBox = new window.google.maps.places.SearchBox(searchInputRef.current);

          searchBox.addListener('places_changed', () => {
            const places = searchBox.getPlaces();
            if (places.length === 0) return;

            const place = places[0];
            if (!place.geometry || !place.geometry.location) return;

            googleMap.setCenter(place.geometry.location);
            googleMap.setZoom(17);
            googleMarker.setPosition(place.geometry.location);

            onLocationSelect({
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
              address: place.formatted_address,
            });
          });
        }

        // Click on map to move marker
        googleMap.addListener('click', (e) => {
          googleMarker.setPosition(e.latLng);
          onLocationSelect({
            lat: e.latLng.lat(),
            lng: e.latLng.lng(),
          });
        });

        // Drag marker
        googleMarker.addListener('dragend', () => {
          const pos = googleMarker.getPosition();
          onLocationSelect({
            lat: pos.lat(),
            lng: pos.lng(),
          });
        });

        setMap(googleMap);
        setMarker(googleMarker);
        setIsLoading(false);
      } catch (err) {
        console.error('Map initialization failed:', err);
        setLoadError('Failed to initialize map. Check your API key and permissions.');
        setIsLoading(false);
      }
    };

    // Global auth failure handler
    window.gm_authFailure = () => {
      setLoadError('Google Maps Authentication Failed. Check API Key restrictions.');
      setIsLoading(false);
    };

    if (window.google && window.google.maps) {
      initMap();
    } else {
      const scriptId = 'google-maps-script';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = initMap;
        script.onerror = () => {
          setLoadError('Failed to load Google Maps script.');
          setIsLoading(false);
        };
        document.head.appendChild(script);
      } else {
        // Script already exists but google object not ready yet? Wait or check again
        const interval = setInterval(() => {
          if (window.google && window.google.maps) {
            clearInterval(interval);
            initMap();
          }
        }, 100);
      }
    }
  }, [apiKey]);

  return (
    <div className="space-y-3">
      {loadError ? (
        <div className="w-full h-[300px] bg-red-50 rounded-2xl border border-red-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-3">
            <X className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-red-900 mb-1">Map Error</h4>
          <p className="text-xs text-red-600 max-w-[200px]">{loadError}</p>
        </div>
      ) : (
        <>
          <div className="relative group">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search for a location..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-600 focus:border-transparent transition-all outline-none bg-white shadow-sm pr-10"
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.preventDefault();
              }}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-gray-600 transition-colors">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="relative">
            <div
              ref={mapRef}
              className={`w-full h-[300px] rounded-2xl border border-gray-200 shadow-inner overflow-hidden transition-opacity duration-500 ${isLoading ? 'opacity-30' : 'opacity-100'}`}
              style={{ background: '#f8fafc' }}
            />
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-3 border-gray-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter">
                  Loading Map...
                </span>
              </div>
            )}
          </div>
          <p className="text-[10px] text-gray-500 italic flex items-center gap-1">
            <span className="text-gray-600">TIP:</span> You can drag the marker or click anywhere on
            the map to set the exact location.
          </p>
        </>
      )}
    </div>
  );
};

// Restaurant Modal
export const RestaurantModal = ({ show, onClose, onSubmit, data, setData, isEditing }) => {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(data.logo_url || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [restaurantPhotoFile, setRestaurantPhotoFile] = useState(null);
  const [owners, setOwners] = useState([]); // Corrected state name
  const [selectedOwnerId, setSelectedOwnerId] = useState(''); // Corrected state name
  const [mapsApiKey, setMapsApiKey] = useState('');
  const [showMap, setShowMap] = useState(false);

  // Fetch Maps API key
  useEffect(() => {
    const fetchKey = async () => {
      try {
        const setting = await getSystemSetting('google_maps_key');
        // Handle cases where setting might be a string or an object with key/api_key
        const key =
          setting?.key || setting?.api_key || (typeof setting === 'string' ? setting : null);
        if (key) {
          setMapsApiKey(key);
        }
      } catch (err) {
        console.error('Error fetching Maps key:', err);
      }
    };
    fetchKey();
  }, []);

  // Update image preview when data change
  useEffect(() => {
    setImagePreview(data.logo_url || '');
  }, [data.logo_url]);

  // Fetch owners when editing
  useEffect(() => {
    if (isEditing && data.id) {
      fetchOwners(data.id);
    }
  }, [isEditing, data.id]);

  // Add this function to fetch owners
  const fetchOwners = async (restaurantId) => {
    try {
      const { data: ownersData, error } = await getRestaurantOwners(restaurantId);

      if (!error && ownersData) {
        setOwners(ownersData);
        // Set the first owner as selected by default
        if (ownersData.length > 0) {
          const firstOwner = ownersData[0];
          setSelectedOwnerId(firstOwner.id);
          setData((prev) => ({
            ...prev,
            owner_name: firstOwner.staff_name || '',
            owner_email: firstOwner.staff_email || '',
            owner_phone: firstOwner.staff_phone_number || '',
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching owners:', error);
    }
  };

  // Handle owner selection
  const handleOwnerChange = (ownerId) => {
    setSelectedOwnerId(ownerId);
    const selectedOwner = owners.find((m) => m.id === ownerId);
    if (selectedOwner) {
      setData((prev) => ({
        ...prev,
        owner_name: selectedOwner.staff_name || '',
        owner_email: selectedOwner.staff_email || '',
        owner_phone: selectedOwner.staff_phone_number || '',
      }));
    }
  };

  // Auto-fill latitude/longitude when google_maps_link changes
  useEffect(() => {
    if (data.google_maps_link) {
      const { latitude, longitude } = extractCoordinatesFromGoogleMaps(data.google_maps_link);
      if (latitude && longitude) {
        // Parse as numbers to compare correctly
        const newLat = parseFloat(latitude);
        const newLng = parseFloat(longitude);
        const currentLat = parseFloat(data.latitude);
        const currentLng = parseFloat(data.longitude);

        // Only update if significantly different to avoid rounding issues and infinite loops
        if (Math.abs(currentLat - newLat) > 0.000001 || Math.abs(currentLng - newLng) > 0.000001) {
          setData((prev) => ({
            ...prev,
            latitude: newLat,
            longitude: newLng,
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

  // Handle location selection from Map
  const handleLocationSelect = (location) => {
    setData((prev) => ({
      ...prev,
      latitude: location.lat,
      longitude: location.lng,
      // Only update address if it was provided (from search) and current address is empty
      address: location.address && !prev.address ? location.address : prev.address,
    }));
  };

  const handleApplyMapsLink = () => {
    const coords = extractCoordinatesFromGoogleMaps(data.google_maps_link);
    if (coords.latitude && coords.longitude) {
      setData((prev) => ({
        ...prev,
        latitude: coords.latitude,
        longitude: coords.longitude,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // 1. First, update owner details if necessary (before closing modal)
      if (isEditing && selectedOwnerId) {
        // Ensure owner data is up to date in the staff record
        const { error: ownerError } = await updateOwnerDetails(selectedOwnerId, {
          owner_name: data.owner_name,
          owner_email: data.owner_email,
          owner_phone: data.owner_phone,
        });
        if (ownerError) {
          console.error('Error updating owner details:', ownerError);
        }
      }

      // 2. Upload photo if changed
      if (restaurantPhotoFile && data.id) {
        const { url, error: uploadError } = await uploadRestaurantPhotoForAdmin(
          restaurantPhotoFile,
          data.id,
        );
        if (uploadError) {
          console.error('Error uploading photo:', uploadError);
        } else if (url) {
          data.restaurant_photo_url = url;
        }
      }

      // 3. Call the parent's onSubmit (which updates restaurant table and closes modal)
      await onSubmit(e);
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to update: ' + error.message);
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
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden shadow-2xl animate-in slide-in- duration-300">
        {/* Header */}
        <div className="bg-orange-500 px-8 py-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">
                  {isEditing ? 'Edit Restaurant' : 'Add New Restaurant'}
                </h3>
                <p className="text-gray-100 text-sm">
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
            <div className="  rounded-2xl p-6 border border-gray-200">
              <label className="block text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                Restaurant Logo
              </label>
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className="w-24 h-24 bg-orange-50 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:border-gray-500">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Logo preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Upload className="w-8 h-8 text-gray-500" />
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
                    className="cursor-pointer inline-flex items-center gap-3 px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Logo
                  </label>
                  <p className="text-sm text-gray-500 mt-2">Recommended: 200x200px, max 2MB</p>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-600" />
                  Restaurant Name *
                </label>
                <input
                  type="text"
                  required
                  value={data.name || ''}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-600 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300"
                  placeholder="Enter restaurant name"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Award className="w-4 h-4 text-orange-500" />
                  Cuisine Type
                </label>
                <input
                  type="text"
                  value={data.cuisine_type || ''}
                  onChange={(e) => setData({ ...data, cuisine_type: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-600 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300"
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
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-600 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300 resize-none"
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-600 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300"
                  placeholder="Enter phone number"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-600" />
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={data.contact_email || ''}
                  onChange={(e) => setData({ ...data, contact_email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-600 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300"
                  placeholder="Enter email address"
                />
              </div>
            </div>

            {/* Compliance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-orange-500" />
                  GST Number
                </label>
                <input
                  type="text"
                  value={data.gst_number || ''}
                  onChange={(e) => setData({ ...data, gst_number: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-600 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300"
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-600 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300"
                  placeholder="Enter FSSAI License Number"
                />
              </div>
            </div>

            {/* Owner Information */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-500" />
                Owner Information
              </label>

              {isEditing && owners.length > 1 ? (
                // Show dropdown if multiple owners
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Owner
                    </label>
                    <select
                      value={selectedOwnerId}
                      onChange={(e) => handleOwnerChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                    >
                      {owners.map((owner) => (
                        <option key={owner.id} value={owner.id}>
                          {owner.staff_name || owner.staff_email}{' '}
                          {owner.connected ? '(Connected)' : '(Not Connected)'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Owner Name
                      </label>
                      <input
                        type="text"
                        value={data.owner_name || ''}
                        onChange={(e) => setData({ ...data, owner_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                        placeholder="Enter owner's name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Owner Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={data.owner_email || ''}
                        onChange={(e) => setData({ ...data, owner_email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                        placeholder="Enter owner's email address"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Owner Phone
                    </label>
                    <input
                      type="tel"
                      value={data.owner_phone || ''}
                      onChange={(e) => setData({ ...data, owner_phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                      placeholder="Enter owner's phone number"
                    />
                  </div>
                </div>
              ) : (
                // Show regular form fields for new restaurant or single owner
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Owner Name
                    </label>
                    <input
                      type="text"
                      value={data.owner_name || ''}
                      onChange={(e) => setData({ ...data, owner_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                      placeholder="Enter owner's name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Owner Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={data.owner_email || ''}
                      onChange={(e) => setData({ ...data, owner_email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                      placeholder="Enter owner's email address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Owner Password (Optional)
                    </label>
                    <input
                      type="password"
                      value={data.owner_password || ''}
                      onChange={(e) => setData({ ...data, owner_password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                      placeholder={
                        isEditing
                          ? 'Leave blank to keep current'
                          : 'Enter to create account, leave blank to invite'
                      }
                      minLength={6}
                    />
                  </div>
                </div>
              )}

              {!isEditing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Owner Phone
                  </label>
                  <input
                    type="tel"
                    value={data.owner_phone || ''}
                    onChange={(e) => setData({ ...data, owner_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                    placeholder="Enter owner's phone number"
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-600 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300"
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
                  <Globe className="w-4 h-4 text-orange-500" />
                  GST Number
                </label>
                <input
                  type="text"
                  value={data.gst_number || ''}
                  onChange={(e) => setData({ ...data, gst_number: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-600 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300"
                  placeholder="Enter GST number"
                />
              </div>{' '}
              {/* moved GST to Compliance section above */}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Description</label>
              <textarea
                value={data.description || ''}
                onChange={(e) => setData({ ...data, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-600 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300 resize-none"
                placeholder="Enter restaurant description"
              />
            </div>

            {/* Google Maps Link */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-green-500" />
                  Google Maps Link
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (!mapsApiKey) {
                      alert(
                        "Please configure 'google_maps_key' in System Settings to use the map picker.",
                      );
                      return;
                    }
                    setShowMap(!showMap);
                  }}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 
                    ${
                      showMap
                        ? 'bg-gray-600 text-white border-gray-600 shadow-lg shadow-gray-100'
                        : mapsApiKey
                          ? 'bg-white text-gray-600 border-gray-100 hover:bg-gray-50'
                          : 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed'
                    }`}
                >
                  <MapPin className="w-3 h-3" />
                  {showMap ? 'Hide Map' : 'Pick from Map'}
                </button>
              </div>

              {showMap && mapsApiKey && (
                <div className="animate-in fade-in slide-in- duration-300 space-y-4">
                  <MapPicker
                    apiKey={mapsApiKey}
                    onLocationSelect={handleLocationSelect}
                    initialLocation={{ lat: data.latitude, lng: data.longitude }}
                  />
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setShowMap(false)}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gray-600 text-white rounded-xl font-bold text-sm hover:bg-gray-700 transition-all shadow-lg shadow-gray-200"
                    >
                      <Check className="w-4 h-4" />
                      Confirm Selection
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="url"
                  value={data.google_maps_link || ''}
                  onChange={(e) => setData({ ...data, google_maps_link: e.target.value })}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-600 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300"
                  placeholder="Paste Google Maps URL"
                />
                <button
                  type="button"
                  onClick={handleApplyMapsLink}
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors whitespace-nowrap"
                  title="Extract Coordinates from Link"
                >
                  Apply Link
                </button>
              </div>
            </div>

            {/* Latitude & Longitude */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-600" />
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={data.latitude || ''}
                  onChange={(e) => setData({ ...data, latitude: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-600 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300"
                  placeholder="Latitude"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-500" />
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={data.longitude || ''}
                  onChange={(e) => setData({ ...data, longitude: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-600 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300"
                  placeholder="Longitude"
                />
              </div>
            </div>

            {/* Aggregator Integrations */}
            <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100">
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
                    <img
                      src="https://www.swiggy.com/favicon.ico"
                      alt="Swiggy"
                      className="w-4 h-4"
                    />
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
                    <img
                      src="https://www.zomato.com/favicon.ico"
                      alt="Zomato"
                      className="w-4 h-4"
                    />
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
                    <img
                      src={data.restaurant_photo_url}
                      alt="Restaurant preview"
                      className="w-full h-full object-cover"
                    />
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
                <Globe className="w-4 h-4 text-gray-500" />
                UPI ID
              </label>
              <input
                type="text"
                value={data.upi_id || ''}
                onChange={(e) => setData({ ...data, upi_id: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-600 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300"
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
                  type="text"
                  value={data.social_media?.facebook || ''}
                  onChange={(e) =>
                    setData({
                      ...data,
                      social_media: { ...data.social_media, facebook: e.target.value },
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-600 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300"
                  placeholder="Facebook URL or handle"
                />
                <input
                  type="text"
                  value={data.social_media?.instagram || ''}
                  onChange={(e) =>
                    setData({
                      ...data,
                      social_media: { ...data.social_media, instagram: e.target.value },
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-600 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300"
                  placeholder="Instagram URL or handle"
                />
                <input
                  type="text"
                  value={data.social_media?.twitter || ''}
                  onChange={(e) =>
                    setData({
                      ...data,
                      social_media: { ...data.social_media, twitter: e.target.value },
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-600 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300"
                  placeholder="Twitter URL or handle"
                />
                <input
                  type="text"
                  value={data.social_media?.website || ''}
                  onChange={(e) =>
                    setData({
                      ...data,
                      social_media: { ...data.social_media, website: e.target.value },
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-600 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300"
                  placeholder="Website URL"
                />
              </div>
            </div>

            {/* Advanced Toggle Section */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                Advanced Features
              </h4>
              <div className="flex flex-wrap gap-8">
                {/* AI Enabled Toggle */}
                <div className="flex items-center space-x-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!data.ai_enabled}
                      onChange={(e) => setData({ ...data, ai_enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                  </label>
                  <span className="text-sm font-medium text-gray-700">AI Analytics</span>
                </div>

                {/* Billing Features Toggle */}
                <div className="flex items-center space-x-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={
                        data.billing_features_enabled !== false ||
                        data.online_bill_enabled !== false
                      }
                      onChange={(e) => {
                        const val = e.target.checked;
                        setData({
                          ...data,
                          billing_features_enabled: val,
                          online_bill_enabled: val,
                        });
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-600"></div>
                  </label>
                  <span className="text-sm font-medium text-gray-700">
                    Online Bill (WhatsApp/Email)
                  </span>
                </div>
              </div>
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
                className={`px-6 py-3 bg-orange-500 text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl ${
                  isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-orange-600'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {isEditing ? 'Updating...' : 'Adding...'}
                  </div>
                ) : isEditing ? (
                  'Update Restaurant'
                ) : (
                  'Add Restaurant'
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
    { value: 'owner', label: 'Owner', icon: Crown, color: ' ' },
    { value: 'manager', label: 'Manager', icon: UserCog, color: ' ' },
    { value: 'captain', label: 'Captain', icon: Users, color: ' ' },
    { value: 'chef', label: 'Chef', icon: ChefHat, color: ' ' },
    { value: 'waiter', label: 'Waiter', icon: UtensilsCrossed, color: ' ' },
    { value: 'cashier', label: 'Cashier', icon: Coins, color: ' ' },
  ];

  // Initialize restaurant search when editing
  useEffect(() => {
    if (isEditing && data.restaurant_id) {
      const restaurant = restaurants.find((r) => r.id === data.restaurant_id);
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
        restaurant.name.toLowerCase().includes(value.toLowerCase()),
      ),
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
        prevIndex < filteredRestaurants.length - 1 ? prevIndex + 1 : 0,
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prevIndex) =>
        prevIndex > 0 ? prevIndex - 1 : filteredRestaurants.length - 1,
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

    if (isEditing) {
      const confirmed = window.confirm(
        `Are you sure you want to update ${data.name}'s information?`,
      );
      if (!confirmed) return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(e);
    } catch (error) {
      console.error('❌ Error in StaffModal handleSubmit:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        data: data,
      });
    } finally {
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

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-hidden shadow-2xl animate-in slide-in- duration-300">
        {/* Header */}
        <div className="   px-8 py-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">
                  {isEditing ? 'Edit Staff Member' : 'Add New Staff Member'}
                </h3>
                <p className="text-orange-100 text-sm">
                  {isEditing
                    ? 'Update staff member information'
                    : 'Create a new staff member profile'}
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
                  <Users className="w-4 h-4 text-gray-600" />
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={data.name || ''}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300"
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300"
                  placeholder="Enter email address"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <UserCog className="w-4 h-4 text-gray-500" />
                  Password (Optional)
                </label>
                <input
                  type="password"
                  value={data.password || ''}
                  onChange={(e) => setData({ ...data, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300"
                  placeholder={
                    isEditing
                      ? 'Leave blank to keep current'
                      : 'Enter to create account, leave blank to invite'
                  }
                  minLength={6}
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
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300"
                placeholder="Enter phone number"
              />
            </div>

            {/* Role Selection */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                <UserCog className="w-4 h-4 text-orange-500" />
                Role *
              </label>
              <div className="flex gap-4   p-4 rounded-2xl border border-gray-200">
                {roles.map((role) => {
                  const Icon = role.icon;
                  return (
                    <button
                      type="button"
                      key={role.value}
                      onClick={() => setData({ ...data, role: role.value })}
                      className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all duration-300 ${
                        data.role === role.value
                          ? `${role.color} text-white shadow-lg scale-105 border-2 border-white`
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
                  className="w-full px-4 py-3 pr-20 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 bg-white hover:border-gray-300"
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
                <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-auto z-30 animate-in slide-in- duration-200">
                  {filteredRestaurants.length === 0 ? (
                    <div className="px-4 py-3 text-gray-500 text-center">No restaurants found</div>
                  ) : (
                    filteredRestaurants.map((restaurant, idx) => (
                      <div
                        key={restaurant.id}
                        ref={dropdownRef}
                        className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-all duration-200 ${
                          data.restaurant_id === restaurant.id
                            ? '  border-l-4 border-orange-500'
                            : ''
                        } ${
                          highlightedIndex === idx ? 'bg-gray-50' : ''
                        } hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl`}
                        onMouseDown={() => handleSelect(restaurant)}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8   rounded-full flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-medium">{restaurant.name}</span>
                        </div>
                        {data.restaurant_id === restaurant.id && (
                          <Check className="w-5 h-5 text-orange-600" />
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
                className={`px-6 py-3   text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl ${
                  isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover: hover:'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {isEditing ? 'Updating...' : 'Adding...'}
                  </div>
                ) : isEditing ? (
                  'Update Staff'
                ) : (
                  'Add Staff'
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
