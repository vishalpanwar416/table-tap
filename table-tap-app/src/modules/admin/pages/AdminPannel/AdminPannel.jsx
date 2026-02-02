import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, X, Bell } from 'lucide-react';
import AdminSidebar from './components/AdminSidebar';
import AdminHeader from './components/AdminHeader';
import MobileAdminHeader from './components/MobileAdminHeader';
import ToastNotifications from './components/ToastNotifications';
import LoadingSpinner from './components/LoadingSpinner';
import RestaurantManagement from './components/RestaurantManagement';
import StaffManagement from './components/StaffManagement';
import { RestaurantModal, StaffModal } from './components/Modals';
import InquiryManagement from './components/InquiryManagement';
import { useAuth } from '../../../shared/config/AuthContext';
import { supabase } from '../../../shared/supabase';
import {
  getAllRestaurants,
  getAllStaff,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  toggleRestaurantStatus,
  toggleRestaurantAggregators,
  createStaff,
  updateStaff,
  deleteStaff,
} from './admin_service';
import ProfilePhotoModal from './components/ProfilePhotoModal';
import { ManagerNotificationProvider } from '../../../shared/context/ManagerNotificationContext';
import SubscriptionManagement from './components/SubscriptionManagement';
import RegistrationRequests from '../../../restaurant/components/admin/RegistrationRequests';
import AdminDashboard from './components/AdminDashboard';

const menuItems = [
  { id: 'dashboard', icon: 'LayoutDashboard', label: 'Dashboard' },
  { id: 'restaurants', icon: 'Building2', label: 'Restaurants' },
  { id: 'registrations', icon: 'ClipboardList', label: 'Registrations' },
  { id: 'staff', icon: 'Users', label: 'Staff Management' },
  { id: 'inquiries', icon: 'MessageSquare', label: 'Lead Inquiries' },
  { id: 'subscriptions', icon: 'CreditCard', label: 'Subscriptions' },
];

const AdminPanel = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
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
    manager_phone: '',
    swiggy_api_key: '',
    zomato_api_key: ''
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
            .maybeSingle();

          if (!error && profile) {
            setCurrentUserProfile(profile);
            // Defense-in-depth: hard block non-admins
            if (profile.profile_role !== 'admin') {
              navigate('/home', { replace: true });
              return;
            }
          } else {
            console.error('Error loading profile:', error);
          }
        } catch (error) {
          console.error('Error loading profile:', error);
        }
      } else {
        console.log('No user found');
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

  const handleToggleRestaurantAggregators = async (id) => {
    try {
      const restaurant = restaurants.find(r => r.id === id);
      const newStatus = !restaurant.aggregators_enabled;

      const { error } = await toggleRestaurantAggregators(id, newStatus);
      if (error) {
        handleError('Failed to update restaurant aggregators: ' + error);
        return;
      }

      setRestaurants(prev =>
        prev.map(r =>
          r.id === id
            ? { ...r, aggregators_enabled: newStatus }
            : r
        )
      );
      handleSuccess(`Online aggregators ${newStatus ? 'enabled' : 'disabled'} successfully`);
    } catch (err) {
      handleError('Failed to toggle restaurant aggregators: ' + err.message);
    }
  };

  const handleToggleEmailBill = async (id) => {
    try {
      const restaurant = restaurants.find(r => r.id === id);
      const newStatus = !(restaurant.email_bill_enabled !== false);

      const { error } = await supabase
        .from('restaurants')
        .update({ email_bill_enabled: newStatus })
        .eq('id', id);

      if (error) {
        handleError('Failed to update email bill setting: ' + error.message);
        return;
      }

      setRestaurants(prev =>
        prev.map(r =>
          r.id === id
            ? { ...r, email_bill_enabled: newStatus }
            : r
        )
      );
      handleSuccess(`Email bill ${newStatus ? 'enabled' : 'disabled'} successfully`);
    } catch (err) {
      handleError('Failed to toggle email bill: ' + err.message);
    }
  };

  const handleToggleWhatsAppBill = async (id) => {
    try {
      const restaurant = restaurants.find(r => r.id === id);
      const newStatus = !(restaurant.whatsapp_bill_enabled !== false);

      const { error } = await supabase
        .from('restaurants')
        .update({ whatsapp_bill_enabled: newStatus })
        .eq('id', id);

      if (error) {
        handleError('Failed to update WhatsApp bill setting: ' + error.message);
        return;
      }

      setRestaurants(prev =>
        prev.map(r =>
          r.id === id
            ? { ...r, whatsapp_bill_enabled: newStatus }
            : r
        )
      );
      handleSuccess(`WhatsApp bill ${newStatus ? 'enabled' : 'disabled'} successfully`);
    } catch (err) {
      handleError('Failed to toggle WhatsApp bill: ' + err.message);
    }
  };

  const handleAddRestaurant = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await createRestaurant(newRestaurant);
      if (error) {
        handleError('Failed to create restaurant: ' + error);
        return;
      }

      setRestaurants(prev => [...prev, data]);
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
        manager_phone: '',
        swiggy_api_key: '',
        zomato_api_key: ''
      });
    } catch (err) {
      handleError('Failed to create restaurant: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditRestaurant = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setShowEditRestaurant(true);
  };

  const handleUpdateRestaurant = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await updateRestaurant(selectedRestaurant.id, selectedRestaurant);
      if (error) {
        handleError('Failed to update restaurant: ' + error);
        return;
      }

      setRestaurants(prev =>
        prev.map(r =>
          r.id === selectedRestaurant.id
            ? { ...r, ...data }
            : r
        )
      );
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
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await createStaff(newStaff);
      if (error) {
        handleError('Failed to create staff member: ' + error);
        return;
      }

      setStaff(prev => [...prev, data]);
      handleSuccess('Staff member created successfully');
      setShowAddStaff(false);
      setNewStaff({
        name: '',
        email: '',
        phone_number: '',
        role: 'captain',
        restaurant_id: ''
      });
    } catch (err) {
      handleError('Failed to create staff member: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRestaurant = async (restaurantId) => {
    try {
      const { error } = await deleteRestaurant(restaurantId);
      if (error) {
        handleError('Failed to delete restaurant: ' + error);
        return;
      }

      setRestaurants(prev => prev.filter(r => r.id !== restaurantId));
      handleSuccess('Restaurant deleted successfully');
    } catch (err) {
      handleError('Failed to delete restaurant: ' + err.message);
    }
  };

  const handleDeleteStaff = async (staffId) => {
    try {
      const { error } = await deleteStaff(staffId);
      if (error) {
        handleError('Failed to delete staff member: ' + error);
        return;
      }

      setStaff(prev => prev.filter(s => s.id !== staffId));
      handleSuccess('Staff member deleted successfully');
    } catch (err) {
      handleError('Failed to delete staff member: ' + err.message);
    }
  };

  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await updateStaff(editingStaff.id, editingStaff);
      if (error) {
        handleError('Failed to update staff member: ' + error);
        return;
      }

      setStaff(prev =>
        prev.map(s =>
          s.id === editingStaff.id
            ? { ...s, ...data }
            : s
        )
      );
      handleSuccess('Staff member updated successfully');
      setShowEditStaff(false);
      setEditingStaff(null);
    } catch (err) {
      console.error('Error in handleUpdateStaff:', err);
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

    const roleMatch = !selectedStaffRole ||
      staffMember.role === selectedStaffRole;

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
    navigate(`/restaurant?restaurant=${restaurant.id}`);
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
    setCurrentUserProfile(prev => ({
      ...prev,
      avatar_url: newAvatarUrl
    }));
  };

  // Add onLoadMore function for infinite scroll
  const handleLoadMore = async (type, page, pageSize, restaurantId = null) => {
    try {
      // For now, we'll return empty array since we're loading all data at once
      // In a real implementation, you would fetch more data from the server
      return [];
    } catch (error) {
      console.error('Error loading more data:', error);
      return [];
    }
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <AdminDashboard 
            restaurants={restaurants} 
            staff={staff} 
            onTabChange={setActiveTab}
          />
        );
      case 'restaurants':
        return (
          <RestaurantManagement
            restaurants={filteredRestaurants}
            loading={loading}
            onAddRestaurant={() => setShowAddRestaurant(true)}
            onToggleStatus={handleToggleRestaurantStatus}
            onToggleAI={handleToggleRestaurantAI}
            onToggleAggregators={handleToggleRestaurantAggregators}
            onToggleEmailBill={handleToggleEmailBill}
            onToggleWhatsAppBill={handleToggleWhatsAppBill}
            onEdit={handleEditRestaurant}
            onDelete={handleDeleteRestaurant}
            onClick={handleRestaurantClick}
            onLoadMore={(page, pageSize) => handleLoadMore('restaurants', page, pageSize)}
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
              onLoadMore={(restaurantId, page, pageSize) => handleLoadMore('staff', page, pageSize, restaurantId)}
            />
          </div>
        );
      case 'subscriptions':
        return <SubscriptionManagement />;
      case 'registrations':
        return <RegistrationRequests />;
      case 'inquiries':
        return <InquiryManagement />;
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

        {/* Toast Notifications */}
        <ToastNotifications
          showError={showError}
          showSuccess={showSuccess}
          error={error}
          success={success}
          onCloseError={() => setShowError(false)}
          onCloseSuccess={() => setShowSuccess(false)}
        />

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
            manager_phone: '',
            swiggy_api_key: '',
            zomato_api_key: ''
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