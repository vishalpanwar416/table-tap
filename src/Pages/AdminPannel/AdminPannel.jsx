import {React, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, X, ArrowLeft, Bell } from 'lucide-react';
import AdminSidebar from './components/AdminSidebar'; 
import AdminHeader from './components/AdminHeader';
import MobileAdminHeader from './components/MobileAdminHeader';
import ToastNotifications from './components/ToastNotifications';
import LoadingSpinner from './components/LoadingSpinner';
import RestaurantManagement from './components/RestaurantManagement';
import StaffManagement from './components/StaffManagement';
import { RestaurantModal, StaffModal } from './components/Modals';
import { useAuth } from '../../config/AuthContext';
import { supabase } from '../../supabase';
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
} from './admin_service';
import ProfilePhotoModal from './components/ProfilePhotoModal';
import { ManagerNotificationProvider } from '../../context/ManagerNotificationContext';
import SubscriptionManagement from './components/SubscriptionManagement';

const menuItems = [
  { id: 'restaurants', icon: 'Building2', label: 'Restaurants' },
  { id: 'staff', icon: 'Users', label: 'Staff Management' },
  { id: 'subscriptions', icon: 'CreditCard', label: 'Subscriptions' },
];

const AdminPanel = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('restaurants');
  const [restaurants, setRestaurants] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showError, setShowError] = useState(false);
  const [success, setSuccess] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);

  const [showAddRestaurant, setShowAddRestaurant] = useState(false);
  const [showEditRestaurant, setShowEditRestaurant] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showEditStaff, setShowEditStaff] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [editingStaff, setEditingStaff] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
  const [selectedCuisineType, setSelectedCuisineType] = useState('');
  const [selectedStaffRole, setSelectedStaffRole] = useState('');
  const [selectedConnectionStatus, setSelectedConnectionStatus] = useState('');

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
    google_maps_link: '',
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

  const [showProfilePhotoModal, setShowProfilePhotoModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const navigate = useNavigate();

  // Load user profile data
  useEffect(() => {
    const loadUserProfile = async () => {
      if (user) {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('full_name, email, avatar_url, profile_role')
            .eq('id', user.id)
            .single();

          if (!error && profile) {
            setCurrentUserProfile(profile);
          } else {
          }
        } catch (error) {
        }
      } else {
      }
    };

    loadUserProfile();
  }, [user]);

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
      handleSuccess(`Restaurant ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      handleError('Failed to toggle restaurant status: ' + err.message);
    }
  };

  const handleToggleRestaurantAI = async (id) => {
    try {
      const restaurant = restaurants.find(r => r.id === id);
      const newAIStatus = !restaurant.ai_enabled;
      
      const { error } = await supabase
        .from('restaurants')
        .update({ ai_enabled: newAIStatus })
        .eq('id', id);

      if (error) {
        handleError('Failed to update AI status: ' + error.message);
        return;
      }

      setRestaurants(prev => 
        prev.map(r => 
          r.id === id 
            ? { ...r, ai_enabled: newAIStatus }
            : r
        )
      );
      handleSuccess(`AI analytics ${newAIStatus ? 'enabled' : 'disabled'} successfully`);
    } catch (err) {
      handleError('Failed to toggle AI status: ' + err.message);
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
      handleSuccess('Restaurant created successfully');
      setShowAddRestaurant(false);
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
        google_maps_link: '',
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
    } catch (err) {
      handleError('Failed to create restaurant: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditRestaurant = (restaurant) => {
    // Ensure social_media has the proper structure and extract coordinates
    const restaurantWithDefaultSocialMedia = {
      ...restaurant,
      social_media: restaurant.social_media || {
        facebook: '',
        instagram: '',
        twitter: '',
        website: ''
      },
      // Ensure latitude and longitude are properly set
      latitude: restaurant.latitude || '',
      longitude: restaurant.longitude || '',
      // Ensure google_maps_link is preserved
      google_maps_link: restaurant.google_maps_link || ''
    };
    setSelectedRestaurant(restaurantWithDefaultSocialMedia);
    setShowEditRestaurant(true);
  };

  const handleUpdateRestaurant = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (!selectedRestaurant.name || !selectedRestaurant.manager_email) {
        handleError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(selectedRestaurant.manager_email)) {
        handleError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      const restaurantData = {
        ...selectedRestaurant,
        location: selectedRestaurant.latitude && selectedRestaurant.longitude 
          ? `POINT(${selectedRestaurant.longitude} ${selectedRestaurant.latitude})`
          : null,
        social_media: Object.keys(selectedRestaurant.social_media).some(key => 
          selectedRestaurant.social_media[key].trim() !== ''
        ) ? selectedRestaurant.social_media : null
      };

      delete restaurantData.latitude;
      delete restaurantData.longitude;

      const { data, error } = await updateRestaurant(selectedRestaurant.id, restaurantData);
      
      if (error) {
        handleError(error);
        setLoading(false);
        return;
      }

      await fetchData();
      handleSuccess('Restaurant updated successfully');
      setShowEditRestaurant(false);
      setSelectedRestaurant(null);
    } catch (err) {
      handleError('Failed to update restaurant: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setLoading(true);
    
    try {
      if (!newStaff.name || !newStaff.email || !newStaff.restaurant_id) {
        handleError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newStaff.email)) {
        handleError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      const { data, error } = await createStaff(newStaff);
      
      if (error) {
        handleError(error);
        setLoading(false);
        return;
      }

      await fetchData();
      handleSuccess('Staff member added successfully');
      setShowAddStaff(false);
      setNewStaff({
        name: '',
        email: '',
        phone_number: '',
        role: 'captain',
        restaurant_id: ''
      });
    } catch (err) {
      handleError('Failed to add staff member: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteRestaurant = async (restaurantId) => {
    if (!window.confirm('Are you sure you want to delete this restaurant? This action cannot be undone.')) {
      return;
    }
    
    try {
      const { error } = await deleteRestaurant(restaurantId);
      if (error) {
        handleError('Failed to delete restaurant: ' + error);
        return;
      }

      await fetchData();
      handleSuccess('Restaurant deleted successfully');
    } catch (err) {
      handleError('Failed to delete restaurant: ' + err.message);
    }
  };
  
  const handleDeleteStaff = async (staffId) => {
    if (!window.confirm('Are you sure you want to delete this staff member? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await deleteStaff(staffId);
      if (error) {
        handleError('Failed to delete staff member: ' + error);
        return;
      }

      await fetchData();
      handleSuccess('Staff member deleted successfully');
    } catch (err) {
      handleError('Failed to delete staff member: ' + err.message);
    }
  };

  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (!editingStaff.name || !editingStaff.email || !editingStaff.restaurant_id) {
        handleError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editingStaff.email)) {
        handleError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      const { data, error } = await updateStaff(editingStaff.id, editingStaff);
      
      if (error) {
        handleError(error);
        setLoading(false);
        return;
      }

      await fetchData();
      handleSuccess('Staff member updated successfully');
      setShowEditStaff(false);
      setEditingStaff(null);
    } catch (err) {
      handleError('Failed to update staff member: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter restaurants and staff based on search and filters
  const filteredRestaurants = restaurants.filter(restaurant => {
    const searchMatch = !searchTerm || 
      restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.contact_phone?.includes(searchTerm) ||
      restaurant.contact_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.cuisine_type?.toLowerCase().includes(searchTerm.toLowerCase());

    const statusMatch = !selectedRestaurantId || 
      (selectedRestaurantId === 'active' && restaurant.is_active) ||
      (selectedRestaurantId === 'inactive' && !restaurant.is_active);

    return searchMatch && statusMatch;
  });

  const filteredStaff = staff.filter(staffMember => {
    const searchMatch = !searchTerm || 
      staffMember.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staffMember.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (staffMember.phone_number && typeof staffMember.phone_number === 'string' && staffMember.phone_number.includes(searchTerm)) ||
      staffMember.role?.toLowerCase().includes(searchTerm.toLowerCase());

    const restaurantMatch = !selectedRestaurantId || 
      staffMember.restaurant_id === selectedRestaurantId;

    // Add role filter
    const roleMatch = !selectedStaffRole || 
      staffMember.role === selectedStaffRole;

    // Add connection status filter
    const connectionMatch = !selectedConnectionStatus || 
      (selectedConnectionStatus === 'connected' && staffMember.connected) ||
      (selectedConnectionStatus === 'disconnected' && !staffMember.connected);

    return searchMatch && restaurantMatch && roleMatch && connectionMatch;
  });

  const handleSuccess = (successMessage) => {
    setSuccess(successMessage);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

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

  const handleAddStaffClick = (restaurantId = null) => {
    if (restaurantId) {
      setNewStaff(prev => ({ ...prev, restaurant_id: restaurantId }));
    }
    setShowAddStaff(true);
  };

  const handleEditStaffClick = (staff) => {
    setEditingStaff(staff);
    setShowEditStaff(true);
  };

  const handleProfilePhotoUpdate = (newAvatarUrl) => {
    // Update the current user profile state
    setCurrentUserProfile(prev => ({
      ...prev,
      avatar_url: newAvatarUrl
    }));
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'restaurants':
        return (
          <RestaurantManagement
            restaurants={filteredRestaurants}
            loading={loading}
            onAddRestaurant={() => setShowAddRestaurant(true)}
            onToggleStatus={handleToggleRestaurantStatus}
            onToggleAI={handleToggleRestaurantAI}
            onEdit={handleEditRestaurant}
            onDelete={handleDeleteRestaurant}
            onClick={handleRestaurantClick}
          />
        );
      case 'staff':
        return (
          <div className="-mx-4 md:mx-0 px-4 md:px-0">
            <StaffManagement
              staff={filteredStaff}
              restaurants={restaurants}
              selectedRestaurantId={selectedRestaurantId}
              setSelectedRestaurantId={setSelectedRestaurantId}
              onAddStaff={() => setShowAddStaff(true)}
              onEdit={handleEditStaffClick}
              onDelete={handleDeleteStaff}
            />
          </div>
        );
      case 'subscriptions':
        return <SubscriptionManagement />;
      default:
        return null;
    }
  };

  if (loading && (restaurants.length === 0 && staff.length === 0)) {
    return <LoadingSpinner />;
  }

  return (
    <ManagerNotificationProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 font-spartan">
        {/* Sidebar */}
        <AdminSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          menuItems={menuItems}
          currentUser={currentUserProfile}
          restaurantName="Admin Panel"
          userRole="admin"
          onProfilePhotoClick={() => setShowProfilePhotoModal(true)}
          showMobileNav={showMobileMenu}
          setShowMobileNav={setShowMobileMenu}
        />

        {/* Main Content */}
        <div className="md:ml-64 transition-all duration-300 font-spartan">
          {/* Mobile Header */}
          <MobileAdminHeader
            activeTab={activeTab}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            restaurants={restaurants}
            staff={staff}
            currentUser={currentUserProfile}
            selectedRestaurantId={selectedRestaurantId}
            setSelectedRestaurantId={setSelectedRestaurantId}
            selectedCuisineType={selectedCuisineType}
            setSelectedCuisineType={setSelectedCuisineType}
            selectedStaffRole={selectedStaffRole}
            setSelectedStaffRole={setSelectedStaffRole}
            selectedConnectionStatus={selectedConnectionStatus}
            setSelectedConnectionStatus={setSelectedConnectionStatus}
            onMenuToggle={() => setShowMobileMenu(!showMobileMenu)}
          />

          {/* Desktop Header */}
          <div className="hidden md:block">
            <AdminHeader
              activeTab={activeTab}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              restaurants={restaurants}
              staff={staff}
              currentUser={currentUserProfile}
              selectedRestaurantId={selectedRestaurantId}
              setSelectedRestaurantId={setSelectedRestaurantId}
              selectedCuisineType={selectedCuisineType}
              setSelectedCuisineType={setSelectedCuisineType}
              selectedStaffRole={selectedStaffRole}
              setSelectedStaffRole={setSelectedStaffRole}
              selectedConnectionStatus={selectedConnectionStatus}
              setSelectedConnectionStatus={setSelectedConnectionStatus}
            />
          </div>

          {/* Main Content Area */}
          <div className="p-4 md:p-6">
            {loading ? (
              <LoadingSpinner />
            ) : (
              renderActiveTab()
            )}
          </div>
        </div>

        {/* Modals */}
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
          data={selectedRestaurant || {
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
            google_maps_link: '',
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
          }}
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
          data={editingStaff || {
            name: '',
            email: '',
            phone_number: '',
            role: 'captain',
            restaurant_id: ''
          }}
          setData={setEditingStaff}
          restaurants={restaurants}
          isEditing={true}
        />

        {/* Profile Photo Modal */}
        <ProfilePhotoModal
          show={showProfilePhotoModal}
          onClose={() => setShowProfilePhotoModal(false)}
          currentUser={currentUserProfile}
          onPhotoUpdate={handleProfilePhotoUpdate}
        />
      </div>
    </ManagerNotificationProvider>
  );
};

export default AdminPanel;