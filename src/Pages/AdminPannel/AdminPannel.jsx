import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  ChefHat,
  ToggleLeft,
  ToggleRight,
  Eye,
  UserPlus,
  Search,
  Filter,
  Loader,
  X,
  ExternalLink,
  CreditCard,
  FileText,
  Shield,
  Globe,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import Sidebar from '../../components/admin/Sidebar';
import { RestaurantModal, StaffModal } from '../../components/superAdmin/Modals';
import { 
  getAllRestaurants,
  getAllStaff,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  toggleRestaurantStatus,
  createStaff,
  updateStaff,
  deleteStaff,
} from '../../Pages/AdminPannel/admin_service';
import AsyncSelect from 'react-select/async';

const menuItems = [
  { id: 'restaurants', icon: 'Building2', label: 'Restaurants' },
  { id: 'staff', icon: 'Users', label: 'Staff Management' },
];

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('restaurants');
  const [restaurants, setRestaurants] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showError, setShowError] = useState(false);

  const [showAddRestaurant, setShowAddRestaurant] = useState(false);
  const [showEditRestaurant, setShowEditRestaurant] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showEditStaff, setShowEditStaff] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [editingStaff, setEditingStaff] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');

  const [newRestaurant, setNewRestaurant] = useState({
    name: '',
    address: '',
    contact_phone: '',
    contact_email: '',
    cuisine_type: '',
    description: '',
    opening_hours: '',
    latitude: '',
    longitude: '',
    logo_url: '',
    razorpay_key_id: '',
    currency: 'INR',
    Maps_link: '',
    gst_number: '',
    fssai_license: '',
    social_media: {
      facebook: '',
      instagram: '',
      twitter: '',
      website: ''
    },
    manager_name: '',
    manager_email: '',
    manager_phone: ''
  });

  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    phone_number: '',
    role: 'captain',
    restaurant_id: ''
  });

  const navigate = useNavigate();

  // Load data on component mount and tab change
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [restaurantsResponse, staffResponse] = await Promise.all([
        getAllRestaurants(),
        getAllStaff()
      ]);

      if (restaurantsResponse.error) {
        throw new Error(restaurantsResponse.error);
      }
      if (staffResponse.error) {
        throw new Error(staffResponse.error);
      }

      setRestaurants(restaurantsResponse.data);
      setStaff(staffResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      handleError('Failed to load data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRestaurantStatus = async (id) => {
    try {
      const restaurant = restaurants.find(r => r.id === id);
      const newStatus = !restaurant.is_active;
      
      const { error } = await toggleRestaurantStatus(id, newStatus);
      if (error) {
        handleError('Failed to update restaurant status: ' + error);
        return;
      }

      setRestaurants(prev => 
        prev.map(r => 
          r.id === id 
            ? { ...r, is_active: newStatus }
            : r
        )
      );
    } catch (err) {
      handleError('Failed to toggle restaurant status: ' + err.message);
    }
  };

  const handleAddRestaurant = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (!newRestaurant.name || !newRestaurant.manager_email) {
        handleError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newRestaurant.manager_email)) {
        handleError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      const restaurantData = {
        ...newRestaurant,
        location: newRestaurant.latitude && newRestaurant.longitude 
          ? `POINT(${newRestaurant.longitude} ${newRestaurant.latitude})`
          : null,
        social_media: Object.keys(newRestaurant.social_media).some(key => 
          newRestaurant.social_media[key].trim() !== ''
        ) ? newRestaurant.social_media : null
      };

      delete restaurantData.latitude;
      delete restaurantData.longitude;

      const { data, error } = await createRestaurant(restaurantData);
      
      if (error) {
        handleError(error);
        setLoading(false);
        return;
      }

      await fetchData();
      
      setNewRestaurant({
        name: '', 
        address: '', 
        contact_phone: '', 
        contact_email: '',
        cuisine_type: '', 
        description: '', 
        opening_hours: '',
        latitude: '', 
        longitude: '',
        logo_url: '',
        razorpay_key_id: '',
        currency: 'INR',
        Maps_link: '',
        gst_number: '',
        fssai_license: '',
        social_media: {
          facebook: '',
          instagram: '',
          twitter: '',
          website: ''
        },
        manager_name: '', 
        manager_email: '', 
        manager_phone: ''
      });
      setShowAddRestaurant(false);
    } catch (err) {
      console.error('Error in handleAddRestaurant:', err);
      handleError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditRestaurant = (restaurant) => {
    let latitude = '', longitude = '';
    if (restaurant.location) {
      const match = restaurant.location.match(/POINT\(([^)]+)\)/);
      if (match) {
        const [lng, lat] = match[1].split(' ');
        longitude = lng;
        latitude = lat;
      }
    }

    setSelectedRestaurant({
      ...restaurant,
      latitude,
      longitude,
      social_media: restaurant.social_media || {
        facebook: '',
        instagram: '',
        twitter: '',
        website: ''
      }
    });
    setShowEditRestaurant(true);
  };

  const handleUpdateRestaurant = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const restaurantData = {
        ...selectedRestaurant,
        location: selectedRestaurant.latitude && selectedRestaurant.longitude 
          ? `POINT(${selectedRestaurant.longitude} ${selectedRestaurant.latitude})`
          : null,
        social_media: Object.keys(selectedRestaurant.social_media).some(key => 
          selectedRestaurant.social_media[key] && selectedRestaurant.social_media[key].trim() !== ''
        ) ? selectedRestaurant.social_media : null
      };

      delete restaurantData.latitude;
      delete restaurantData.longitude;
      delete restaurantData.manager;

      const { error } = await updateRestaurant(selectedRestaurant.id, restaurantData);
      
      if (error) {
        handleError(error);
        setLoading(false);
        return;
      }

      await fetchData();
      setShowEditRestaurant(false);
      setSelectedRestaurant(null);
    } catch (err) {
      handleError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * MODIFIED: Refreshes all data after staff creation to get the final state from the database.
   */
  const handleAddStaff = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await createStaff(newStaff);
      
      if (error) {
        handleError('Failed to create staff member: ' + error);
        return;
      }

      // IMPORTANT: Refresh all data to ensure the UI is consistent
      // with any changes made by the database triggers.
      await fetchData();

      setNewStaff({ name: '', email: '', phone_number: '', role: 'captain', restaurant_id: '' });
      setShowAddStaff(false);
    } catch (err) {
      console.error('Error in handleAddStaff:', err);
      handleError('Failed to create staff member: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteRestaurant = async (restaurantId) => {
    if (!window.confirm('Are you sure you want to delete this restaurant? This action is irreversible.')) {
      return;
    }
    
    try {
      const { error } = await deleteRestaurant(restaurantId);
      if (error) {
        handleError('Failed to delete restaurant: ' + error);
        return;
      }
      setRestaurants(prev => prev.filter(r => r.id !== restaurantId));
    } catch (err) {
      handleError('Failed to delete restaurant: ' + err.message);
    }
  };
  
  const handleDeleteStaff = async (staffId) => {
    if (!window.confirm('Are you sure you want to remove this staff member? This may delete their user account if they have no other roles.')) {
      return;
    }

    try {
      const { error } = await deleteStaff(staffId);
      if (error) {
        handleError('Failed to remove staff member: ' + error);
        return;
      }

      await fetchData(); // Refresh data after deletion
    } catch (err) {
      handleError('Failed to remove staff member: ' + err.message);
    }
  };

  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await updateStaff(editingStaff.id, editingStaff);
      if (error) {
        handleError('Failed to update staff member: ' + error);
        return;
      }

      await fetchData();
      setShowEditStaff(false);
      setEditingStaff(null);
    } catch (err) {
      handleError('Failed to update staff member: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredRestaurants = restaurants.filter(restaurant =>
    restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (restaurant.cuisine_type && restaurant.cuisine_type.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredStaff = staff.filter(member =>
    (!selectedRestaurantId || member.restaurant_id === selectedRestaurantId) &&
    (
      (member?.name && member.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (member?.restaurant_name && member.restaurant_name.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  );

  const handleError = (errorMessage) => {
    setError(errorMessage);
    setShowError(true);
    setTimeout(() => {
      setShowError(false);
    }, 5000);
  };

  const handleRestaurantClick = (restaurant) => {
    // Navigate to the restaurant management dashboard
    navigate(`/managerdashboard?restaurant=${restaurant.id}`);
  };

  const loadOptions = async (inputValue) => {
    const res = await fetch(`/api/restaurants?search=${inputValue}`);
    const data = await res.json();
    return data.restaurants.map(r => ({ value: r.id, label: r.name }));
  };

  if (loading && (restaurants.length === 0 && staff.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        menuItems={menuItems}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm z-10 p-4 md:p-6 flex justify-between items-center">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800">
            {activeTab === 'restaurants' ? 'Restaurants' : 'Staff Management'}
          </h2>
          <div className="relative text-gray-600">
            <input 
              type="search" 
              placeholder="Search..." 
              className="bg-gray-100 h-10 px-5 pr-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="absolute right-0 top-0 mt-3 mr-4">
              <Search className="h-4 w-4" />
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mx-4 mt-4">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
            <button 
              onClick={() => setError(null)}
              className="float-right font-bold text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        )}

        {/* Main Content Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {activeTab === 'restaurants' && (
            <div>
              {/* Restaurants Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Restaurants ({filteredRestaurants.length})
                </h2>
                <button
                  onClick={() => setShowAddRestaurant(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Restaurant
                </button>
              </div>

              {/* Loading indicator for restaurants tab */}
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading restaurants...</span>
                </div>
              )}

              {/* Restaurants Grid */}
              {!loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredRestaurants.map((restaurant) => (
                    <div 
                      key={restaurant.id} 
                      className={`rounded-lg shadow-md overflow-hidden flex flex-col transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02] ${
                        restaurant.is_active 
                          ? 'bg-white hover:bg-gray-50' 
                          : 'bg-red-50 border border-red-100 hover:bg-red-100'
                      }`}
                      onClick={() => handleRestaurantClick(restaurant)}
                    >
                      <div className="p-6 flex-grow">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center space-x-3">
                            {restaurant.logo_url && (
                              <img 
                                src={restaurant.logo_url} 
                                alt={`${restaurant.name} logo`}
                                className={`w-10 h-10 rounded-full object-cover transition-all duration-300 ${
                                  !restaurant.is_active ? 'opacity-60' : ''
                                }`}
                              />
                            )}
                            <h3 className={`text-lg font-semibold transition-all duration-300 ${
                              restaurant.is_active ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {restaurant.name}
                            </h3>
                          </div>
                          <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleToggleRestaurantStatus(restaurant.id)}
                              className={`relative w-20 h-10 rounded-lg focus:outline-none transition-all duration-300 shadow-md group overflow-hidden
                                ${restaurant.is_active
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-200'
                                  : 'bg-gradient-to-r from-gray-100 to-gray-200 shadow-gray-200'
                                }
                              `}
                              aria-label={restaurant.is_active ? 'Deactivate restaurant' : 'Activate restaurant'}
                            >
                              {/* Toggle slider */}
                              <div
                                className={`absolute top-1 w-8 h-8 bg-white rounded-md shadow-lg flex items-center justify-center transition-all duration-300 ease-out
                                  ${restaurant.is_active
                                    ? 'translate-x-11 shadow-green-100'
                                    : 'translate-x-1 shadow-gray-100'
                                  }
                                `}
                              >
                                {/* Status icon */}
                                {restaurant.is_active ? (
                                  <div className="w-4 h-4 bg-green-500 rounded-sm flex items-center justify-center">
                                    <div className="w-2 h-2 bg-white rounded-sm"></div>
                                  </div>
                                ) : (
                                  <div className="w-4 h-4 bg-gray-300 rounded-sm flex items-center justify-center">
                                    <div className="w-2 h-2 bg-gray-100 rounded-sm"></div>
                                  </div>
                                )}
                              </div>
                              
                              {/* Text labels */}
                              <div className="flex justify-between items-center h-full px-3">
                                <span className={`text-xs font-semibold transition-all duration-300 ${
                                  restaurant.is_active 
                                    ? 'text-white' 
                                    : 'text-gray-400'
                                }`}>
                                  ON
                                </span>
                                <span className={`text-xs font-semibold transition-all duration-300 ${
                                  !restaurant.is_active 
                                    ? 'text-gray-600' 
                                    : 'text-white/60'
                                }`}>
                                  OFF
                                </span>
                              </div>
                              
                              {/* Active state glow */}
                              {restaurant.is_active && (
                                <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-500/20 rounded-lg"></div>
                              )}
                            </button>
                          </div>
                        </div>
                        
                        <div className={`space-y-2 text-sm transition-all duration-300 ${
                          restaurant.is_active ? 'text-gray-600' : 'text-gray-500'
                        }`}>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2" />
                            {restaurant.address || 'No address provided'}
                          </div>
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2" />
                            {restaurant.contact_phone || 'No phone provided'}
                          </div>
                          <div className="flex items-center">
                            <ChefHat className="h-4 w-4 mr-2" />
                            {restaurant.cuisine_type || 'Cuisine not specified'}
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2" />
                            {restaurant.staff_count || 0} staff members
                          </div>
                          {restaurant.currency && (
                            <div className="flex items-center">
                              <CreditCard className="h-4 w-4 mr-2" />
                              Currency: {restaurant.currency}
                            </div>
                          )}
                        </div>

                        {(restaurant.gst_number || restaurant.fssai_license) && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs font-medium text-gray-700 mb-2">Business Details</p>
                            {restaurant.gst_number && (
                              <div className="flex items-center text-xs text-gray-600 mb-1">
                                <FileText className="h-3 w-3 mr-1" />
                                GST: {restaurant.gst_number}
                              </div>
                            )}
                            {restaurant.fssai_license && (
                              <div className="flex items-center text-xs text-gray-600">
                                <Shield className="h-3 w-3 mr-1" />
                                FSSAI: {restaurant.fssai_license}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="mt-4 pt-4 border-t">
                          <div className="flex justify-between items-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              restaurant.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {restaurant.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                              <button 
                                onClick={() => handleEditRestaurant(restaurant)}
                                className="text-gray-600 hover:text-gray-800"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              {restaurant.Maps_link && (
                                <a 
                                  href={restaurant.Maps_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              )}
                              <button 
                                onClick={() => handleDeleteRestaurant(restaurant.id)} 
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {restaurant.manager && (
                          <div className="mt-3 p-3 bg-gray-50 rounded">
                            <p className="text-sm font-medium text-gray-700">Manager</p>
                            <p className="text-sm text-gray-600">{restaurant.manager.name}</p>
                            <p className="text-xs text-gray-500">{restaurant.manager.email}</p>
                            {restaurant.manager.phone && (
                              <p className="text-xs text-gray-500">{restaurant.manager.phone}</p>
                            )}
                            {!restaurant.manager.connected && (
                              <p className="text-xs text-orange-600 mt-1">
                                ⚠️ Not connected to user account
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && filteredRestaurants.length === 0 && (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No restaurants found</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'staff' && (
            <div>
              {/* Enhanced Staff Header */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Staff Management
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage staff across all restaurants
                  </p>
                </div>
                <button
                  onClick={() => setShowAddStaff(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <UserPlus className="h-5 w-5 mr-2" />
                  Add Staff
                </button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Total Staff</p>
                      <p className="text-2xl font-bold text-gray-900">{staff.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Building2 className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Restaurants</p>
                      <p className="text-2xl font-bold text-gray-900">{restaurants.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Shield className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Managers</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {staff.filter(s => s.role === 'manager').length}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <ChefHat className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Kitchen Staff</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {staff.filter(s => s.role === 'chef').length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search and Filter Bar */}
              <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        placeholder="Search staff by name, email, or restaurant..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={selectedRestaurantId}
                      onChange={(e) => setSelectedRestaurantId(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Restaurants</option>
                      {restaurants.map(restaurant => (
                        <option key={restaurant.id} value={restaurant.id}>
                          {restaurant.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedRestaurantId('');
                      }}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>

              {/* Restaurant-based Staff Organization */}
              <div className="space-y-4">
                {restaurants.map(restaurant => {
                  const restaurantStaff = staff.filter(s => s.restaurant_id === restaurant.id);
                  const filteredRestaurantStaff = restaurantStaff.filter(member =>
                    (!selectedRestaurantId || member.restaurant_id === selectedRestaurantId) &&
                    (
                      (member?.name && member.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                      (member?.email && member.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                      (member?.restaurant_name && member.restaurant_name.toLowerCase().includes(searchTerm.toLowerCase()))
                    )
                  );

                  // Skip if no staff and we're filtering by restaurant
                  if (selectedRestaurantId && restaurant.id !== selectedRestaurantId) return null;
                  
                  // Skip if no staff match the search criteria
                  if (searchTerm && filteredRestaurantStaff.length === 0) return null;

                  return (
                    <div key={restaurant.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                      <div className="bg-gray-50 px-6 py-4 border-b">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Building2 className="h-5 w-5 text-gray-600" />
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{restaurant.name}</h3>
                              <p className="text-sm text-gray-600">
                                {restaurantStaff.length} staff member{restaurantStaff.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              restaurant.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {restaurant.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <button
                              onClick={() => {
                                setSelectedRestaurantId(selectedRestaurantId === restaurant.id ? '' : restaurant.id);
                              }}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              {selectedRestaurantId === restaurant.id ? (
                                <ChevronDown className="h-5 w-5" />
                              ) : (
                                <ChevronRight className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {filteredRestaurantStaff.length > 0 && (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {filteredRestaurantStaff.map(member => (
                                <tr key={member.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="flex-shrink-0 h-10 w-10">
                                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                          <Users className="h-5 w-5 text-gray-500" />
                                        </div>
                                      </div>
                                      <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                                        <div className="text-sm text-gray-500">{member.email}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                      member.role === 'manager' ? 'bg-purple-100 text-purple-800' :
                                      member.role === 'captain' ? 'bg-blue-100 text-blue-800' :
                                      member.role === 'chef' ? 'bg-orange-100 text-orange-800' :
                                      member.role === 'waiter' ? 'bg-green-100 text-green-800' :
                                      member.role === 'cashier' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                      {member.phone_number || 'N/A'}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                      member.connected ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {member.connected ? 'Connected' : 'Standalone'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex space-x-2">
                                      <button 
                                        onClick={() => {
                                          setEditingStaff(member);
                                          setShowEditStaff(true);
                                        }}
                                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                        title="Edit staff member"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteStaff(member.id)} 
                                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                        title="Delete staff member"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      
                      {filteredRestaurantStaff.length === 0 && restaurantStaff.length === 0 && (
                        <div className="px-6 py-8 text-center">
                          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No staff members for this restaurant</p>
                          <button
                            onClick={() => {
                              setNewStaff(prev => ({ ...prev, restaurant_id: restaurant.id }));
                              setShowAddStaff(true);
                            }}
                            className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            Add staff for {restaurant.name}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {!loading && restaurants.length === 0 && (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No restaurants found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <RestaurantModal
        show={showAddRestaurant}
        onClose={() => setShowAddRestaurant(false)}
        onSubmit={handleAddRestaurant}
        data={newRestaurant}
        setData={setNewRestaurant}
        isEditing={false}
      />

      <RestaurantModal
        show={showEditRestaurant}
        onClose={() => {
          setShowEditRestaurant(false);
          setSelectedRestaurant(null);
        }}
        onSubmit={handleUpdateRestaurant}
        data={selectedRestaurant}
        setData={setSelectedRestaurant}
        isEditing={true}
      />

      <StaffModal
        show={showAddStaff}
        onClose={() => setShowAddStaff(false)}
        onSubmit={handleAddStaff}
        data={newStaff}
        setData={setNewStaff}
        restaurants={restaurants}
        isEditing={false}
      />

      <StaffModal
        show={showEditStaff}
        onClose={() => {
          setShowEditStaff(false);
          setEditingStaff(null);
        }}
        onSubmit={handleUpdateStaff}
        data={editingStaff}
        setData={setEditingStaff}
        restaurants={restaurants}
        isEditing={true}
      />
    </div>
  );
};

export default AdminPanel;