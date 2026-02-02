
import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  RefreshCw,
  AlertCircle,
  Lock,
  Edit3,
  MapPin,
  Globe,
  Phone,
  Mail,
  Clock,
  CreditCard,
  Shield,
  Instagram,
  Facebook,
  Building,
  FileText,
  Award,
  ChevronLeft,
  Zap,
  Power,
  Image as ImageIcon,
  Upload,
  MessageCircle,
  Receipt,
  ShoppingBag,
  Eye,
  EyeOff,
  Key
} from 'lucide-react';
import { useAdminRestaurant } from '../../../shared/context/AdminRestaurantContext';
import SubscriptionSection from './SubscriptionSection';
import BillingInvoice from './BillingInvoice';
const RestaurantInformation = () => {
  const {
    restaurant,
    updateRestaurant,
    loading,
    error,
    userRole,
    canEdit,
    canView
  } = useAdminRestaurant();

  const [formData, setFormData] = useState(restaurant || {});
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [showSwiggyKey, setShowSwiggyKey] = useState(false);
  const [showZomatoKey, setShowZomatoKey] = useState(false);
  const [showBillingPanel, setShowBillingPanel] = useState(false);

  // Check if user is owner or admin (can see API keys)
  const canSeeApiKeys = () => {
    return userRole === 'owner' || userRole === 'admin';
  };

  useEffect(() => {
    if (restaurant) {
      setFormData(restaurant);
    }
  }, [restaurant]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSocialMediaChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      social_media: {
        ...prev.social_media,
        [name]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError(null);

    try {
      const success = await updateRestaurant(formData);
      if (success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        setIsEditing(false);
      } else {
        setSaveError('Failed to update restaurant information.');
      }
    } catch (err) {
      setSaveError('An error occurred while saving. Please try again.');
    }
  };

  const handleReset = () => {
    setFormData(restaurant);
    setIsEditing(false);
    setSaveError(null);
  };

  const extractLatLngFromMapLink = () => {
    const url = formData.google_maps_link;
    if (!url) return;
    // Regex for typical Google Maps URLs
    const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match) {
      setFormData(prev => ({
        ...prev,
        latitude: match[1],
        longitude: match[2]
      }));
    } else {
      alert("Could not extract coordinates from the link.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
          <span className="ml-4 text-gray-600 font-medium text-lg">Loading restaurant information...</span>
        </div>
      </div>
    );
  }

  if (error || !canView()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50 p-6 flex items-center justify-center">
        <div className="text-center p-12 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            {error ? 'Access Denied' : 'Unauthorized Access'}
          </h3>
          <p className="text-gray-600 text-lg">
            {error || "You don't have permission to view this information."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Removed redundant header */}

        {/* Role Badge */}
        <div className="flex justify-center">
          <div className="inline-flex items-center px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full shadow-lg border">
            <span className="text-sm font-medium text-gray-700">
              Role: <span className="capitalize text-blue-600 font-semibold">{userRole}</span>
            </span>
            {!canEdit() && (
              <span className="ml-3 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full">
                View Only
              </span>
            )}
          </div>
        </div>

        {/* Success Message */}
        {saveSuccess && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-400 rounded-xl p-5 shadow-sm">
            <div className="flex items-center">
              <Award className="w-5 h-5 text-green-600 mr-3" />
              <p className="text-green-800 font-semibold">Restaurant information updated successfully!</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border overflow-hidden">
          {isEditing && canEdit() ? (
            // --- EDITING FORM ---
            <form onSubmit={handleSubmit} className="p-8">
              {saveError && (
                <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-400 rounded-xl p-5 mb-8">
                  <div className="flex items-center">
                    <AlertCircle className="w-6 h-6 text-red-500 mr-3" />
                    <p className="text-red-700 font-medium">{saveError}</p>
                  </div>
                </div>
              )}

              <div className="space-y-10">
                {/* Basic Information */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <Building className="w-5 h-5 mr-2 text-blue-600" /> Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Restaurant Name</label>
                      <input type="text" name="name" value={formData.name || ''} onChange={handleChange} className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" required />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Cuisine Type</label>
                      <input type="text" name="cuisine_type" value={formData.cuisine_type || ''} onChange={handleChange} className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" />
                    </div>
                  </div>
                </div>

                {/* Restaurant Assets */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <ImageIcon className="w-5 h-5 mr-2 text-blue-600" /> Restaurant Assets
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Logo Section */}
                    <div className="space-y-4">
                      <label className="block text-sm font-semibold text-gray-700">Restaurant Logo</label>
                      <div className="flex flex-col items-center p-6 bg-white/50 border-2 border-dashed border-gray-200 rounded-2xl">
                        {formData.logo_url ? (
                          <div className="relative group">
                            <img
                              src={formData.logo_url}
                              alt="Logo"
                              className="w-32 h-32 object-contain rounded-xl bg-white shadow-sm"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                              <p className="text-white text-xs font-medium">Update in Admin Panel</p>
                            </div>
                          </div>
                        ) : (
                          <div className="w-32 h-32 bg-gray-100 rounded-xl flex items-center justify-center">
                            <ImageIcon className="w-10 h-10 text-gray-400" />
                          </div>
                        )}
                        <p className="mt-4 text-xs text-center text-gray-500 italic">
                          Logo management is available in the Main Admin Panel
                        </p>
                      </div>
                    </div>

                    {/* Photo Section */}
                    <div className="space-y-4">
                      <label className="block text-sm font-semibold text-gray-700">Restaurant Photo</label>
                      <div className="flex flex-col items-center p-6 bg-white/50 border-2 border-dashed border-gray-200 rounded-2xl">
                        {formData.restaurant_photo_url ? (
                          <div className="relative group w-full">
                            <img
                              src={formData.restaurant_photo_url}
                              alt="Restaurant"
                              className="w-full h-32 object-cover rounded-xl shadow-sm"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                              <p className="text-white text-xs font-medium">Update in Admin Panel</p>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-32 bg-gray-100 rounded-xl flex items-center justify-center">
                            <ImageIcon className="w-10 h-10 text-gray-400" />
                          </div>
                        )}
                        <p className="mt-4 text-xs text-center text-gray-500 italic">
                          Photo management is available in the Main Admin Panel
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <Phone className="w-5 h-5 mr-2 text-blue-600" /> Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Contact Phone</label>
                      <input type="text" name="contact_phone" value={formData.contact_phone || ''} onChange={handleChange} className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Contact Email</label>
                      <input type="email" name="contact_email" value={formData.contact_email || ''} onChange={handleChange} className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" />
                    </div>
                  </div>
                </div>

                {/* Business Details */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-blue-600" /> Business Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Opening Hours</label>
                      <input type="text" name="opening_hours" value={formData.opening_hours || ''} onChange={handleChange} className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" placeholder="e.g., Mon-Sun: 9:00 AM - 10:00 PM" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Time Zone</label>
                      <select name="timezone" value={formData.timezone || 'Asia/Kolkata'} onChange={handleChange} className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all">
                        <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Features & Settings */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-blue-600" /> Features & Settings
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/50 border border-gray-200 p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="block text-sm font-semibold text-gray-700">AI Analytics</span>
                        <span className="text-xs text-gray-500">Enable AI-powered insights</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="ai_enabled"
                          checked={formData.ai_enabled || false}
                          onChange={handleChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="bg-white/50 border border-gray-200 p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="block text-sm font-semibold text-gray-700">Restaurant Status</span>
                        <span className="text-xs text-gray-500">Temporarily open/close restaurant</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="is_active"
                          checked={formData.is_active || false}
                          onChange={handleChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Bill Sharing Options */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <Receipt className="w-5 h-5 mr-2 text-blue-600" /> Bill Sharing Options
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">Allow customers to receive their bills via email or WhatsApp</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/50 border border-gray-200 p-4 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                          <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <span className="block text-sm font-semibold text-gray-700">Email Bill</span>
                          <span className="text-xs text-gray-500">Send bills via email</span>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="email_bill_enabled"
                          checked={formData.email_bill_enabled !== false}
                          onChange={handleChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="bg-white/50 border border-gray-200 p-4 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                          <MessageCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <span className="block text-sm font-semibold text-gray-700">WhatsApp Bill</span>
                          <span className="text-xs text-gray-500">Send bills via WhatsApp</span>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="whatsapp_bill_enabled"
                          checked={formData.whatsapp_bill_enabled !== false}
                          onChange={handleChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Location & Online Presence */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-blue-600" /> Location & Online Presence
                  </h3>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Address</label>
                      <input type="text" name="address" value={formData.address || ''} onChange={handleChange} className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Google Maps Link</label>
                      <input type="url" name="google_maps_link" value={formData.google_maps_link || ''} onChange={handleChange} className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" placeholder="https://maps.google.com/..." />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Instagram Handle</label>
                        <input type="text" name="instagram" value={formData.social_media?.instagram || ""} onChange={handleSocialMediaChange} className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" placeholder="@restaurant" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Facebook Page</label>
                        <input type="text" name="facebook" value={formData.social_media?.facebook || ""} onChange={handleSocialMediaChange} className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" placeholder="RestaurantOfficial" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Latitude</label>
                        <input
                          type="number"
                          step="any"
                          name="latitude"
                          value={formData.latitude || ''}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                          placeholder="e.g., 19.0760"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Longitude</label>
                        <input
                          type="number"
                          step="any"
                          name="longitude"
                          value={formData.longitude || ''}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                          placeholder="e.g., 72.8777"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Legal & Payment */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-blue-600" /> Legal & Payment Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">GST Number</label>
                      <input type="text" name="gst_number" value={formData.gst_number || ''} onChange={handleChange} className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" placeholder="29AADCB2230M1ZP" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">FSSAI License</label>
                      <input type="text" name="fssai_license" value={formData.fssai_license || ''} onChange={handleChange} className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" placeholder="12345678901234" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Razorpay Key ID</label>
                      <input type="text" name="razorpay_key_id" value={formData.razorpay_key_id || ''} onChange={handleChange} className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" placeholder="rzp_test_..." />
                    </div>
                  </div>
                </div>

                {/* Aggregator Integration - Only visible to Owner and Admin */}
                {canSeeApiKeys() && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                      <ShoppingBag className="w-5 h-5 mr-2 text-blue-600" /> Aggregator Integration
                    </h3>
                    <p className="text-sm text-gray-500 mb-4 flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Only visible to Restaurant Owner and Admin
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Swiggy API Key */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <div className="w-6 h-6 bg-orange-500 rounded-lg flex items-center justify-center">
                            <ShoppingBag className="w-3 h-3 text-white" />
                          </div>
                          Swiggy API Key
                        </label>
                        <div className="relative">
                          <input 
                            type={showSwiggyKey ? "text" : "password"} 
                            name="swiggy_api_key" 
                            value={formData.swiggy_api_key || ''} 
                            onChange={handleChange} 
                            className="w-full px-4 py-3 pr-12 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 transition-all" 
                            placeholder="Enter Swiggy API Key" 
                          />
                          <button
                            type="button"
                            onClick={() => setShowSwiggyKey(!showSwiggyKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showSwiggyKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        {formData.swiggy_api_key && (
                          <p className="text-xs text-green-600 flex items-center gap-1">
                            <Key className="w-3 h-3" /> API key configured
                          </p>
                        )}
                      </div>

                      {/* Zomato API Key */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <div className="w-6 h-6 bg-red-500 rounded-lg flex items-center justify-center">
                            <ShoppingBag className="w-3 h-3 text-white" />
                          </div>
                          Zomato API Key
                        </label>
                        <div className="relative">
                          <input 
                            type={showZomatoKey ? "text" : "password"} 
                            name="zomato_api_key" 
                            value={formData.zomato_api_key || ''} 
                            onChange={handleChange} 
                            className="w-full px-4 py-3 pr-12 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 transition-all" 
                            placeholder="Enter Zomato API Key" 
                          />
                          <button
                            type="button"
                            onClick={() => setShowZomatoKey(!showZomatoKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showZomatoKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        {formData.zomato_api_key && (
                          <p className="text-xs text-green-600 flex items-center gap-1">
                            <Key className="w-3 h-3" /> API key configured
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="mt-4 text-xs text-gray-400 italic">
                      * API keys are encrypted and stored securely. Contact support if you need help with integration.
                    </p>
                  </div>
                )}

                {/* Description */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-blue-600" /> Description
                  </h3>
                  <textarea name="description" value={formData.description || ''} onChange={handleChange} rows="4" className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all resize-none" placeholder="Tell customers about your restaurant..."></textarea>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-12 pt-8 border-t">
                <button type="button" onClick={handleReset} className="px-8 py-3 bg-white border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-all shadow-sm flex items-center"><RefreshCw className="w-4 h-4 mr-2" /> Cancel</button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg flex items-center ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            // --- DISPLAY MODE ---
            <div className="p-8">
              <div className="space-y-10">
                {/* Basic Information */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center"><Building className="w-5 h-5 mr-2 text-blue-600" /> Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border">
                      <h4 className="text-sm font-semibold text-gray-600 mb-2">Restaurant Name</h4>
                      <p className="text-lg font-medium text-gray-900">{restaurant?.name || 'N/A'}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border">
                      <h4 className="text-sm font-semibold text-gray-600 mb-2">Cuisine Type</h4>
                      <p className="text-lg font-medium text-gray-900">{restaurant?.cuisine_type || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Restaurant Assets Display */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <ImageIcon className="w-5 h-5 mr-2 text-blue-600" /> Restaurant Assets
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Logo Display */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center">
                      <h4 className="text-sm font-semibold text-gray-600 mb-4 self-start">Official Logo</h4>
                      {restaurant?.logo_url ? (
                        <img
                          src={restaurant.logo_url}
                          alt="Logo"
                          className="w-40 h-40 object-contain rounded-2xl bg-white shadow-sm border p-2"
                        />
                      ) : (
                        <div className="w-40 h-40 bg-gray-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-200">
                          <ImageIcon className="w-12 h-12 text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Photo Display */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center">
                      <h4 className="text-sm font-semibold text-gray-600 mb-4 self-start">Cover Photo</h4>
                      {restaurant?.restaurant_photo_url ? (
                        <img
                          src={restaurant.restaurant_photo_url}
                          alt="Restaurant"
                          className="w-full h-40 object-cover rounded-2xl shadow-sm border"
                        />
                      ) : (
                        <div className="w-full h-40 bg-gray-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-200">
                          <ImageIcon className="w-12 h-12 text-gray-300" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center"><FileText className="w-5 h-5 mr-2 text-blue-600" /> Description</h3>
                  <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-6 border">
                    <p className="text-lg leading-relaxed text-gray-700">{restaurant?.description || 'No description provided.'}</p>
                  </div>
                </div>

                {/* Contact & Socials */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center"><Globe className="w-5 h-5 mr-2 text-blue-600" /> Contact & Social Media</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border"><h4 className="text-sm font-semibold text-gray-600 mb-2 flex items-center"><Phone className="w-4 h-4 mr-2 text-green-600" /> Phone</h4><p className="text-lg font-medium text-gray-900">{restaurant?.contact_phone || 'N/A'}</p></div>
                    <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border"><h4 className="text-sm font-semibold text-gray-600 mb-2 flex items-center"><Mail className="w-4 h-4 mr-2 text-orange-600" /> Email</h4><p className="text-lg font-medium text-gray-900">{restaurant?.contact_email || 'N/A'}</p></div>
                    <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-6 border"><h4 className="text-sm font-semibold text-gray-600 mb-2 flex items-center"><Instagram className="w-4 h-4 mr-2 text-pink-600" /> Instagram</h4><p className="text-lg font-medium text-gray-900">{restaurant?.social_media?.instagram || 'N/A'}</p></div>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border"><h4 className="text-sm font-semibold text-gray-600 mb-2 flex items-center"><Facebook className="w-4 h-4 mr-2 text-blue-600" /> Facebook</h4><p className="text-lg font-medium text-gray-900">{restaurant?.social_media?.facebook || 'N/A'}</p></div>
                  </div>
                </div>

                {/* Latitude and Longitude */}
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-6 border">
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">Latitude</h4>
                  <p className="text-lg font-medium text-gray-900">{restaurant?.latitude || 'Not provided'}</p>
                </div>
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-6 border">
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">Longitude</h4>
                  <p className="text-lg font-medium text-gray-900">{restaurant?.longitude || 'Not provided'}</p>
                </div>

              </div>

              {/* Features Status Display */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-blue-600" /> Features & Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 border flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-600 mb-1">AI Analytics</h4>
                      <p className={`text-lg font-bold ${restaurant?.ai_enabled ? 'text-green-600' : 'text-gray-500'}`}>
                        {restaurant?.ai_enabled ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                    <div className={`p-3 rounded-full ${restaurant?.ai_enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <Zap className={`w-6 h-6 ${restaurant?.ai_enabled ? 'text-green-600' : 'text-gray-400'}`} />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-600 mb-1">Restaurant Status</h4>
                      <p className={`text-lg font-bold ${restaurant?.is_active ? 'text-green-600' : 'text-red-500'}`}>
                        {restaurant?.is_active ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                    <div className={`p-3 rounded-full ${restaurant?.is_active ? 'bg-green-100' : 'bg-red-100'}`}>
                      <Power className={`w-6 h-6 ${restaurant?.is_active ? 'text-green-600' : 'text-red-500'}`} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bill Sharing Status Display with Toggles */}
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Receipt className="w-5 h-5 mr-2 text-blue-600" /> Bill Sharing Options
                </h3>
                <p className="text-sm text-gray-500 mb-4">Toggle to enable/disable bill sharing options</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-full ${restaurant?.email_bill_enabled !== false ? 'bg-blue-100' : 'bg-gray-100'}`}>
                        <Mail className={`w-6 h-6 ${restaurant?.email_bill_enabled !== false ? 'text-blue-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-600 mb-1">Email Bill</h4>
                        <p className="text-xs text-gray-500">Send bills via email</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={restaurant?.email_bill_enabled !== false}
                        onChange={async (e) => {
                          const newValue = e.target.checked;
                          const success = await updateRestaurant({ ...restaurant, email_bill_enabled: newValue });
                          if (success) {
                            setSaveSuccess(true);
                            setTimeout(() => setSaveSuccess(false), 2000);
                          }
                        }}
                        className="sr-only peer"
                        disabled={!canEdit()}
                      />
                      <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${!canEdit() ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                    </label>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-full ${restaurant?.whatsapp_bill_enabled !== false ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <MessageCircle className={`w-6 h-6 ${restaurant?.whatsapp_bill_enabled !== false ? 'text-green-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-600 mb-1">WhatsApp Bill</h4>
                        <p className="text-xs text-gray-500">Send bills via WhatsApp</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={restaurant?.whatsapp_bill_enabled !== false}
                        onChange={async (e) => {
                          const newValue = e.target.checked;
                          const success = await updateRestaurant({ ...restaurant, whatsapp_bill_enabled: newValue });
                          if (success) {
                            setSaveSuccess(true);
                            setTimeout(() => setSaveSuccess(false), 2000);
                          }
                        }}
                        className="sr-only peer"
                        disabled={!canEdit()}
                      />
                      <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600 ${!canEdit() ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Aggregator Integration Status - Only visible to Owner and Admin */}
              {canSeeApiKeys() && (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <ShoppingBag className="w-5 h-5 mr-2 text-blue-600" /> Aggregator Integration
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Only visible to Restaurant Owner and Admin
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Swiggy Status */}
                    <div className={`rounded-xl p-6 border flex items-center justify-between ${restaurant?.swiggy_api_key ? 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-full ${restaurant?.swiggy_api_key ? 'bg-orange-100' : 'bg-gray-100'}`}>
                          <ShoppingBag className={`w-6 h-6 ${restaurant?.swiggy_api_key ? 'text-orange-600' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-1">Swiggy</h4>
                          <p className={`text-sm font-bold ${restaurant?.swiggy_api_key ? 'text-orange-600' : 'text-gray-500'}`}>
                            {restaurant?.swiggy_api_key ? 'Connected' : 'Not Connected'}
                          </p>
                          {restaurant?.swiggy_api_key && (
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <Key className="w-3 h-3" />
                              API Key: ••••••{restaurant.swiggy_api_key.slice(-4)}
                            </p>
                          )}
                        </div>
                      </div>
                      {canEdit() && (
                        <button 
                          onClick={() => setIsEditing(true)} 
                          className="px-4 py-2 text-sm font-semibold text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                        >
                          {restaurant?.swiggy_api_key ? 'Edit' : 'Add Key'}
                        </button>
                      )}
                    </div>

                    {/* Zomato Status */}
                    <div className={`rounded-xl p-6 border flex items-center justify-between ${restaurant?.zomato_api_key ? 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-full ${restaurant?.zomato_api_key ? 'bg-red-100' : 'bg-gray-100'}`}>
                          <ShoppingBag className={`w-6 h-6 ${restaurant?.zomato_api_key ? 'text-red-600' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-1">Zomato</h4>
                          <p className={`text-sm font-bold ${restaurant?.zomato_api_key ? 'text-red-600' : 'text-gray-500'}`}>
                            {restaurant?.zomato_api_key ? 'Connected' : 'Not Connected'}
                          </p>
                          {restaurant?.zomato_api_key && (
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <Key className="w-3 h-3" />
                              API Key: ••••••{restaurant.zomato_api_key.slice(-4)}
                            </p>
                          )}
                        </div>
                      </div>
                      {canEdit() && (
                        <button 
                          onClick={() => setIsEditing(true)} 
                          className="px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          {restaurant?.zomato_api_key ? 'Edit' : 'Add Key'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end mt-12 pt-8 border-t">
                {canEdit() ? (
                  <button onClick={() => setIsEditing(true)} className="group px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105">
                    <Edit3 className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" /> Edit Information
                  </button>
                ) : (
                  <div className="flex items-center text-gray-500 bg-gray-50 px-6 py-3 rounded-xl border"><Lock className="w-4 h-4 mr-2" /> <span className="font-medium">View only access</span></div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Subscription Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border overflow-hidden p-8">
          <SubscriptionSection restaurantId={restaurant?.id} />
        </div>

        {/* Billing & Invoice Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border overflow-hidden p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Receipt className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Billing & Invoices</h3>
                <p className="text-gray-500 text-sm">View payment history, download invoices, and manage billing</p>
              </div>
            </div>
            <button
              onClick={() => setShowBillingPanel(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
            >
              <FileText className="w-5 h-5" />
              View Billing
            </button>
          </div>
        </div>

      </div>

      {/* Billing Invoice Panel */}
      <BillingInvoice
        isOpen={showBillingPanel}
        onClose={() => setShowBillingPanel(false)}
        restaurantId={restaurant?.id}
        restaurant={restaurant}
      />
    </div>
  );
};

export default RestaurantInformation;