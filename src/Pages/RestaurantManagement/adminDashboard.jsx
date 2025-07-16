import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../../components/admin/Sidebar';
import MobileNav from '../../components/admin/MobileNav';
import DashboardOverview from '../../components/admin/DashboardOverviewComponents/DashboardOverview';
import MenuManagement from '../../components/admin/MenuManagementComponent/MenuManagement';
import OrderManagement from '../../components/admin/OrderManagement';
import UserManagement from '../../components/admin/UserManagement';
import OffersManagement from '../../components/admin/OffersManagement';
import SettingsManagement from '../../components/admin/Settings';
import InventoryManagement from '../../components/admin/InventoryManagement';
import LogoutPopup from '../../components/auth/LogoutPopup';
import NotificationSound from '../../components/admin/NotificationSound';
import NotificationToast from '../../components/admin/NotificationToast';
import AIAnalyticsChat from '../../components/admin/AIAnalyticsChat';
import ManagerNotificationsToast from '../../components/admin/ManagerNotificationsToast';
import QRManagement from '../../components/admin/QRManagement/QRManagement';
import InventoryActivityLogs from '../../components/admin/InventoryActivityLogs';
import { X, ArrowLeft, Package, BarChart3, Sparkles, Plus, Building2, ChevronDown, Clock } from 'lucide-react';
import { getAllFoodItems, getRestaurantFoodItems } from '../../api/foodService';
import { supabase } from '../../supabase';
import { updateOrderStatus as updateOrderStatusService } from '../../api/orderService';
import { useAdminRestaurant } from '../../context/AdminRestaurantContext';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { restaurantId } = useParams();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [foodItems, setFoodItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const orderChannelRef = useRef(null);
  const [playOrderSound, setPlayOrderSound] = useState(false);
  const [orderSoundType, setOrderSoundType] = useState('order');
  const [showOrderToast, setShowOrderToast] = useState(false);
  const [orderToastMessage, setOrderToastMessage] = useState('');
  const [orderToastTitle, setOrderToastTitle] = useState('');
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [createOrderData, setCreateOrderData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    table_number: '',
    items: [],
    notes: '',
    address: '',
    total: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  
  // Fix: Properly destructure all values from the context
  const { 
    restaurant, 
    userRestaurantId, 
    loading: restaurantLoading, 
    error: restaurantError,
    userRole: contextUserRole,
    setAdminRestaurant,
    isAdmin: contextIsAdmin
  } = useAdminRestaurant();

  // State for restaurant selector
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [showRestaurantSelector, setShowRestaurantSelector] = useState(false);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);

  // Menu items shared across components - with role-based filtering
  const getMenuItems = () => {
    const baseItems = [
      { id: 'dashboard', icon: 'LayoutDashboard', label: 'Dashboard' },
      { id: 'menu', icon: 'Utensils', label: 'Menu Management' },
      { id: 'orders', icon: 'ShoppingCart', label: 'Order Management' },
      { id: 'inventory', icon: 'Package', label: 'Inventory Management' },
      { id: 'users', icon: 'Users', label: 'User Management' },
      { id: 'offers', icon: 'Tag', label: 'Offers & Promotions' },
      { id: 'qr', icon: 'QrCode', label: 'QR Management' },
      { id: 'settings', icon: 'Settings', label: 'Restaurant Information' },
      { id: 'activity-logs', label: 'Activity Logs', icon: Clock },
    ];

    // Add AI Analytics only for managers and admins
    if (contextUserRole === 'manager' || contextUserRole === 'admin' || contextIsAdmin()) {
      baseItems.splice(7, 0, { id: 'analytics', icon: 'BarChart3', label: 'AI Analytics' });
    }

    return baseItems;
  };

  const menuItems = getMenuItems();

  const [notificationPermission, setNotificationPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );

  // New state for authentication loading
  const [authLoading, setAuthLoading] = useState(true);

  // Fetch all restaurants for admin selector
  const fetchAllRestaurants = async () => {
    if (!contextIsAdmin()) return;
    
    try {
      setLoadingRestaurants(true);
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name, is_active')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setAllRestaurants(data || []);
    } catch (error) {
      setErrorMsg('Failed to load restaurants');
    } finally {
      setLoadingRestaurants(false);
    }
  };

  // Load restaurants when component mounts for admin users
  useEffect(() => {
    if (contextIsAdmin()) {
      fetchAllRestaurants();
    }
  }, [contextIsAdmin]);

  // Handle restaurant selection
  const handleRestaurantSelect = async (restaurantId) => {
    if (restaurantId === userRestaurantId) {
      setShowRestaurantSelector(false);
      return;
    }

    try {
      const success = await setAdminRestaurant(restaurantId);
      if (success) {
        setSuccessMsg('Restaurant switched successfully');
        setShowRestaurantSelector(false);
      } else {
        setErrorMsg('Failed to switch restaurant');
      }
    } catch (error) {
      setErrorMsg('Failed to switch restaurant');
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showRestaurantSelector && !event.target.closest('.restaurant-selector')) {
        setShowRestaurantSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showRestaurantSelector]);

  // Check authentication and get user on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setAuthLoading(true); // Start loading
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) {
          navigate('/login');
          return;
        }
        setCurrentUser(user);
      } catch (error) {
        navigate('/login');
      } finally {
        setAuthLoading(false); // End loading
      }
    };
    
    checkAuth();
    
    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate('/login');
      } else if (session?.user) {
        setCurrentUser(session.user);
      }
    });
    
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [navigate]);

  // Request notification permission on component mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const fetchUserProfile = async () => {
      try {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('profile_role')
          .eq('id', currentUser.id)
          .single();

        if (!error && profileData) {
          const role = profileData.profile_role;
          setUserRole(role);
          
          // Allow manager, admin, and captain roles to access the dashboard
          setIsManager(role === 'manager');
          setIsAdmin(role === 'admin');
          
          // If user is neither manager, admin, nor captain, redirect them
          if (role !== 'manager' && role !== 'admin' && role !== 'captain') {
            navigate('/home');
            return;
          }
        }
      } catch (error) {
        navigate('/home');
      }
    };
    fetchUserProfile();
  }, [currentUser, navigate]);

  // Fetch food items with restaurant filter
  const fetchFoodItems = async () => {
    let loadingTimeout;
    try {
      setLoading(true);
      
      // Set a timeout to force loading to false after 15 seconds, preventing stuck loading states
      loadingTimeout = setTimeout(() => {
        setLoading(false);
        setErrorMsg('Request took too long. Please try again.');
      }, 15000);
      
      // Use restaurant-specific function if restaurant ID is available
      let data;
      if (userRestaurantId) {
        data = await getRestaurantFoodItems(userRestaurantId);
      } else {
        data = await getAllFoodItems();
      }
      
      setFoodItems(data || []);
      clearTimeout(loadingTimeout);
      return data;
    } catch (error) {
      setErrorMsg('Failed to load menu items: ' + (error.message || error));
      return [];
    } finally {
      clearTimeout(loadingTimeout);
      setLoading(false);
    }
  };
  
  // Use in useEffect to fetch food items on component mount
  useEffect(() => {
    if (currentUser) {
      fetchFoodItems();
    }
  }, [currentUser, userRestaurantId]); // Add userRestaurantId to dependencies

  // Enhanced fetch orders with restaurant filter
  useEffect(() => {
    if (!currentUser) return;

    let loadingTimeout;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        loadingTimeout = setTimeout(() => {
          setLoading(false);
          setErrorMsg('Orders request took too long. Please try again.');
        }, 15000);

        let query = supabase
          .from('orders')
          .select('*');
        
        // Filter by restaurant if available
        if (userRestaurantId) {
          query = query.eq('restaurant_id', userRestaurantId);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (error) {
        setErrorMsg('Failed to load orders: ' + (error.message || error));
      } finally {
        clearTimeout(loadingTimeout);
        setLoading(false);
      }
    };

    fetchOrders();

    // Remove previous channel if exists
    if (orderChannelRef.current) {
      supabase.removeChannel(orderChannelRef.current);
    }

    // Enhanced real-time subscription with restaurant filtering
    const channel = supabase
      .channel('orders-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          
          const { eventType, new: newRecord, old: oldRecord } = payload;

          // Filter by restaurant if available
          if (userRestaurantId && newRecord.restaurant_id !== userRestaurantId) {
            return; // Skip if not for this restaurant
          }

          setOrders((prevOrders) => {
            
            if (eventType === 'INSERT') {
              // Play sound for new order only
              let orderTotal = Number(newRecord.total);
              if (isNaN(orderTotal)) orderTotal = 0;
              const customerName = newRecord.customer_name || 'Unknown Customer';
              const orderId = newRecord.order_number || newRecord.id.slice(0,8);

              const soundType = orderTotal > 50 ? 'urgent' : 'order';
              setOrderSoundType(soundType);
              setPlayOrderSound(true);

              setOrderToastTitle('🔔 New Order Received!');
              setOrderToastMessage(
                `Order #${orderId} from ${customerName} - ₹${orderTotal.toFixed(2)}`
              );
              setShowOrderToast(true);

              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('New Order Received!', {
                  body: `Order #${orderId} from ${customerName} - Total: ₹${orderTotal.toFixed(2)}`,
                  icon: '/favicon.ico',
                  tag: 'new-order',
                  badge: '/favicon.ico',
                  requireInteraction: true,
                });
              }

              return [newRecord, ...prevOrders];
            } else if (eventType === 'UPDATE') {
              
              // Handle order updates - match by id field
              const updatedOrder = newRecord;
              const existingOrder = prevOrders.find(o => o.id === updatedOrder.id);
              
              
              if (existingOrder) {
                const statusChanged = existingOrder.status !== updatedOrder.status;
                
                if (statusChanged) {
                  setOrderToastTitle('📋 Order Updated');
                  setOrderToastMessage(`Order #${updatedOrder.order_number || updatedOrder.id.slice(0,8)} status changed to ${updatedOrder.status}`);
                  setShowOrderToast(true);
                }
              }

              const updatedOrders = prevOrders.map((order) =>
                order.id === updatedOrder.id ? updatedOrder : order
              );
              
              return updatedOrders;
            } else if (eventType === 'DELETE') {
              // Handle order deletions - match by id field
              return prevOrders.filter((order) => order.id !== oldRecord.id);
            }
            return prevOrders;
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
        } else if (status === 'CHANNEL_ERROR') {
        } else if (status === 'TIMED_OUT') {
        }
      });

    orderChannelRef.current = channel;

    return () => {
      if (loadingTimeout) clearTimeout(loadingTimeout);
      if (orderChannelRef.current) {
        supabase.removeChannel(orderChannelRef.current);
        orderChannelRef.current = null;
      }
    };
  }, [currentUser, userRestaurantId]); // Add userRestaurantId to dependencies

  // Reset playOrderSound after it is triggered
  useEffect(() => {
    if (playOrderSound) {
      setTimeout(() => setPlayOrderSound(false), 500);
    }
  }, [playOrderSound]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (errorMsg || successMsg) {
      const timer = setTimeout(() => {
        setErrorMsg('');
        setSuccessMsg('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg, successMsg]);

  // MODIFIED FUNCTION: Enhanced update order status with manual state update
  const updateOrderStatus = async (orderId, status) => {
    let loadingTimeout;
    try {
      setLoading(true);
      
      loadingTimeout = setTimeout(() => {
        setLoading(false);
        setErrorMsg('Update request took too long. Please try again.');
      }, 10000);
      
      // Update order status and get updated order data
      const updatedOrder = await updateOrderStatusService(orderId, status);
      
      // *** FIX: Manually update the orders state ***
      // This ensures the UI updates immediately for the current user.
      // The real-time subscription will still handle updates from other users.
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === updatedOrder.id ? updatedOrder : order
        )
      );
      
      // Use updatedOrder for toast and notification
      setOrderToastTitle('✅ Status Updated');
      setOrderToastMessage(
        `Order #${updatedOrder.order_number || updatedOrder.id.slice(0,8)} marked as ${status}`
      );
      setShowOrderToast(true);
      setOrderSoundType('success');
      setPlayOrderSound(true);
      
      // Create notification for customer (handle separately)
      try {
        if (updatedOrder?.user_id) {
          let notificationType;
          switch (status) {
            case 'confirmed':
              notificationType = 'order_accepted';
              break;
            case 'preparing':
              notificationType = 'order_preparing';
              break;
            case 'ready':
              notificationType = 'order_ready';
              break;
            case 'rejected':
              notificationType = 'order_rejected';
              break;
            case 'completed':
              notificationType = 'order_ready';
              break;
            default:
              notificationType = 'order_received';
          }

          await supabase
            .from('notifications')
            .insert({
              order_id: updatedOrder.order_number || updatedOrder.id,
              title: `Order ${status}`,
              message: `Your order #${updatedOrder.order_number} has been ${status}`,
              user_id: updatedOrder.user_id,
              type: notificationType,
              read: false,
              metadata: { order_status: status }
            });
        }
      } catch (notifError) {
      }

    } catch (error) {
      setErrorMsg('Failed to update order status: ' + (error.message || error));
      setOrderSoundType('error');
      setPlayOrderSound(true);
    } finally {
      clearTimeout(loadingTimeout);
      setLoading(false);
    }
  };

  const handleRequestNotification = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
        if (permission === 'granted') {
          new Notification('Admin Dashboard Ready!', {
            body: 'You will receive notifications for new orders.',
            icon: '/favicon.ico',
            tag: 'welcome'
          });
        }
      });
    }
  };

  useEffect(() => {
    let timer;
    if (loading) {
      timer = setTimeout(() => setShowLoadingOverlay(true), 700);
    } else {
      setShowLoadingOverlay(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  const handleCreateOrder = async () => {
    setIsLoading(true);
    try {
      // Replace this with your actual order creation logic
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createOrderData),
      });

      if (response.ok) {
        setShowCreateOrderModal(false);
        setCreateOrderData({
          customer_name: '',
          customer_phone: '',
          customer_email: '',
          table_number: '',
          items: [],
          notes: '',
          address: '',
          total: 0
        });
        setSuccessMsg('Order created successfully!');
      } else {
        setErrorMsg('Failed to create order. Please try again.');
      }
    } catch (error) {
      setErrorMsg('Failed to create order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const addItemToOrder = () => {
    setCreateOrderData(prev => ({ ...prev, items: [...prev.items, { name: '', quantity: 1, price: 0 }] }));
  };

  const removeItemFromOrder = (index) => {
    const newItems = createOrderData.items.filter((_, i) => i !== index);
    setCreateOrderData(prev => ({ ...prev, items: newItems }));
  };

  const updateOrderItem = (index, field, value) => {
    setCreateOrderData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    // Optionally, you can return null or a redirect here, since navigate('/login') will handle it.
    return null;
  }

  // Add error handling for restaurant context
  if (restaurantLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading restaurant data...</p>
        </div>
      </div>
    );
  }

  if (restaurantError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Error</h3>
          <p className="text-gray-600 mb-4">{restaurantError}</p>
          <button 
            onClick={() => navigate('/home')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Error Messages */}
      {errorMsg && (
        <div className="fixed top-4 right-4 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-md flex items-center max-w-md">
          <span className="text-xl mr-3">❌</span>
          <div className="flex-1">
            <strong className="block">Error</strong>
            <span className="text-sm">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="ml-4 text-red-700 hover:text-red-900">
            <X size={18} />
          </button>
        </div>
      )}
      
      {/* Keep basic success messages for non-order related actions */}
      {successMsg && !showOrderToast && (
        <div className="fixed top-4 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-md flex items-center max-w-md">
          <span className="text-xl mr-3">✅</span>
          <div className="flex-1">
            <strong className="block">Success</strong>
            <span className="text-sm">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="ml-4 text-green-700 hover:text-green-900">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Enhanced Order Notification Toast */}
      <NotificationToast
        show={showOrderToast}
        message={orderToastMessage}
        title={orderToastTitle}
        type="order"
        onClose={() => setShowOrderToast(false)}
        duration={6000} // Show for 6 seconds
      />

      <ManagerNotificationsToast />
  
      <NotificationSound play={playOrderSound} soundType={orderSoundType} />

      {showLoadingOverlay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-5 rounded-lg shadow-lg flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-orange-500 border-t-transparent"></div>
            <span>Processing...</span>
            {/* Emergency escape button */}
            <button 
              onClick={() => setLoading(false)}
              className="ml-4 text-xs text-gray-500 underline hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {notificationPermission === 'default' && (
        <div className="fixed top-20 right-4 z-50 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded shadow-md flex items-center max-w-md">
          <span className="text-xl mr-3">🔔</span>
          <div className="flex-1">
            <strong className="block">Enable Notifications</strong>
            <span className="text-sm">Click to allow browser notifications for new orders.</span>
          </div>
          <button
            onClick={handleRequestNotification}
            className="ml-4 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Allow
          </button>
        </div>
      )}

      <div className="flex h-screen">
        {/* Sidebar Component */}
        <Sidebar 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          menuItems={menuItems}
          handleLogout={() => setShowLogoutPopup(true)}
          currentUser={currentUser}
          restaurantName={restaurant?.name}
          userRole={contextUserRole}
        />

        {/* Mobile Navigation */}
        <MobileNav 
          showMobileNav={showMobileNav}
          setShowMobileNav={setShowMobileNav}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          menuItems={menuItems}
          handleLogout={() => setShowLogoutPopup(true)}
          currentUser={currentUser}
          restaurantName={restaurant?.name}
          userRole={contextUserRole}
        />
        <LogoutPopup 
          isOpen={showLogoutPopup}
          onClose={() => setShowLogoutPopup(false)}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main Content Header */}
          <div className="bg-white shadow-sm z-10 p-4 md:p-6">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              {/* Back Button - Top Left */}
              <div className="flex items-center">
                <button
                  onClick={() => navigate(-1)}
                  className="mr-4 p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                  aria-label="Go back"
                >
                  <ArrowLeft size={22} />
                </button>
                <h2 className="text-xl md:text-2xl font-semibold text-gray-800">
                  {menuItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
                </h2>
              </div>

              {/* Restaurant Selector for Admin Users */}
              {contextIsAdmin() && (
                <div className="hidden md:block relative restaurant-selector">
                  <button
                    onClick={() => setShowRestaurantSelector(!showRestaurantSelector)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <Building2 size={18} className="text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {restaurant?.name || 'Select Restaurant'}
                    </span>
                    <ChevronDown size={16} className="text-gray-500" />
                  </button>

                  {/* Restaurant Dropdown */}
                  {showRestaurantSelector && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                      <div className="p-2">
                        <div className="text-xs font-medium text-gray-500 px-3 py-1 border-b border-gray-100">
                          Select Restaurant
                        </div>
                        {loadingRestaurants ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent"></div>
                            <span className="ml-2 text-sm text-gray-500">Loading...</span>
                          </div>
                        ) : allRestaurants.length === 0 ? (
                          <div className="text-center py-4 text-sm text-gray-500">
                            No restaurants available
                          </div>
                        ) : (
                          allRestaurants.map((rest) => (
                            <button
                              key={rest.id}
                              onClick={() => handleRestaurantSelect(rest.id)}
                              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                rest.id === userRestaurantId
                                  ? 'bg-orange-100 text-orange-700 font-medium'
                                  : 'hover:bg-gray-50 text-gray-700'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="truncate">{rest.name}</span>
                                {rest.id === userRestaurantId && (
                                  <span className="text-orange-600">✓</span>
                                )}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="hidden md:block">
                <div className="relative text-gray-600">
                  <input 
                    type="search" 
                    name="search" 
                    placeholder="Search..." 
                    className="bg-gray-100 h-10 px-5 pr-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <span className="absolute right-0 top-0 mt-3 mr-4">
                    <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M12.9 14.32a8 8 0 1 1 1.41-1.41l5.35 5.33-1.42 1.42-5.33-5.34zM8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z"></path>
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Body */}
          <div className="flex-1 overflow-y-auto pt-4 md:pt-0">
            <div className="px-4 py-6 md:p-6 max-w-7xl mx-auto">
              {/* Mobile Search */}
              <div className="md:hidden mb-4">
                {/* Mobile Restaurant Selector for Admin Users */}
                {contextIsAdmin() && (
                  <div className="mb-4 restaurant-selector">
                    <button
                      onClick={() => setShowRestaurantSelector(!showRestaurantSelector)}
                      className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 size={18} className="text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">
                          {restaurant?.name || 'Select Restaurant'}
                        </span>
                      </div>
                      <ChevronDown size={16} className="text-gray-500" />
                    </button>

                    {/* Mobile Restaurant Dropdown */}
                    {showRestaurantSelector && (
                      <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <div className="p-2">
                          <div className="text-xs font-medium text-gray-500 px-3 py-1 border-b border-gray-100">
                            Select Restaurant
                          </div>
                          {loadingRestaurants ? (
                            <div className="flex items-center justify-center py-4">
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent"></div>
                              <span className="ml-2 text-sm text-gray-500">Loading...</span>
                            </div>
                          ) : allRestaurants.length === 0 ? (
                            <div className="text-center py-4 text-sm text-gray-500">
                              No restaurants available
                            </div>
                          ) : (
                            allRestaurants.map((rest) => (
                              <button
                                key={rest.id}
                                onClick={() => handleRestaurantSelect(rest.id)}
                                className={`w-full text-left px-3 py-3 rounded-md text-sm transition-colors ${
                                  rest.id === userRestaurantId
                                    ? 'bg-orange-100 text-orange-700 font-medium'
                                    : 'hover:bg-gray-50 text-gray-700'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="truncate">{rest.name}</span>
                                  {rest.id === userRestaurantId && (
                                    <span className="text-orange-600">✓</span>
                                  )}
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="relative text-gray-600">
                  <input 
                    type="search" 
                    name="search" 
                    placeholder="Search..." 
                    className="bg-gray-100 w-full h-10 px-5 pr-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <span className="absolute right-0 top-0 mt-3 mr-4">
                    <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M12.9 14.32a8 8 0 1 1 1.41-1.41l5.35 5.33-1.42 1.42-5.33-5.34zM8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z"></path>
                    </svg>
                  </span>
                </div>
              </div>

              {/* Content Components */}
              {activeTab === 'dashboard' && (
                <div className="px-4 py-6 md:p-6">
                  <DashboardOverview 
                    orders={orders}
                    foodItems={foodItems}
                    updateOrderStatus={updateOrderStatus}
                    setActiveTab={setActiveTab}
                  />
                </div>
              )}

              {activeTab === 'menu' && (
                <div className="h-full">
                  <MenuManagement 
                    foodItems={foodItems}
                    fetchFoodItems={fetchFoodItems}
                    setLoading={setLoading}
                    setErrorMsg={setErrorMsg}
                    setSuccessMsg={setSuccessMsg}
                    searchTerm={searchTerm}
                  />
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="px-4 py-6 md:p-6">
                  <OrderManagement 
                    orders={orders}
                    updateOrderStatus={updateOrderStatus}
                    searchTerm={searchTerm}
                  />
                </div>
              )}

              {activeTab === 'inventory' && (
                <div className="px-4 py-6 md:p-6">
                  <InventoryManagement 
                    setLoading={setLoading}
                    setErrorMsg={setErrorMsg}
                    setSuccessMsg={setSuccessMsg}
                  />
                </div>
              )}

              {activeTab === 'users' && (
                <div className="px-4 py-6 md:p-6">
                  <UserManagement />
                </div>
              )}
              
              {activeTab === 'offers' && (
                <div className="px-4 py-6 md:p-6">
                  <OffersManagement 
                    setLoading={setLoading}
                    setErrorMsg={setErrorMsg}
                    setSuccessMsg={setSuccessMsg}
                  />
                </div>
              )}
              
              {activeTab === 'qr' && (
                <div className="px-4 py-6 md:p-6">
                  <QRManagement 
                    setLoading={setLoading}
                    setErrorMsg={setErrorMsg}
                    setSuccessMsg={setSuccessMsg}
                  />
                </div>
              )}
              
              {activeTab === 'analytics' && (contextUserRole === 'manager' || contextUserRole === 'admin' || restaurant.ai_enabled==true || contextIsAdmin()) && (
                <div className="px-4 py-6 md:p-6">
                  {restaurant.ai_enabled ? (
                    <AIAnalyticsChat restaurantId={restaurant.id} />
                  ) : (
                    <div className="p-4 mb-8 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-yellow-800 font-medium">
                        AI Analytics is disabled for this restaurant.
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'settings' && (
                <div className="px-4 py-6 md:p-6">
                  <SettingsManagement 
                    currentUser={currentUser}
                  />
                </div>
              )}
              
              {activeTab === 'activity-logs' && (
                <div className="px-4 py-6 md:p-6">
                  <InventoryActivityLogs 
                    setLoading={setLoading} 
                    setErrorMsg={setErrorMsg} 
                    setSuccessMsg={setSuccessMsg} 
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Order Modal */}
      {showCreateOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              onClick={() => setShowCreateOrderModal(false)}
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-semibold mb-4">Create New Order</h3>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleCreateOrder();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded p-2"
                  value={createOrderData.customer_name}
                  onChange={e => setCreateOrderData(prev => ({ ...prev, customer_name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded p-2"
                  value={createOrderData.customer_phone}
                  onChange={e => setCreateOrderData(prev => ({ ...prev, customer_phone: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full border border-gray-300 rounded p-2"
                  value={createOrderData.customer_email}
                  onChange={e => setCreateOrderData(prev => ({ ...prev, customer_email: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Table Number</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded p-2"
                  value={createOrderData.table_number}
                  onChange={e => setCreateOrderData(prev => ({ ...prev, table_number: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order Items *</label>
                {createOrderData.items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Item name"
                      className="flex-1 border border-gray-300 rounded p-2"
                      value={item.name}
                      onChange={e => updateOrderItem(idx, 'name', e.target.value)}
                      required
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      className="w-16 border border-gray-300 rounded p-2"
                      value={item.quantity}
                      min={1}
                      onChange={e => updateOrderItem(idx, 'quantity', e.target.value)}
                      required
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      className="w-24 border border-gray-300 rounded p-2"
                      value={item.price}
                      min={0}
                      step="0.01"
                      onChange={e => updateOrderItem(idx, 'price', e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => removeItemFromOrder(idx)}
                      title="Remove item"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm flex items-center"
                  onClick={addItemToOrder}
                >
                  <Plus size={14} className="mr-1" />
                  Add Item
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  className="w-full border border-gray-300 rounded p-2"
                  value={createOrderData.notes}
                  onChange={e => setCreateOrderData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded p-2"
                  value={createOrderData.address}
                  onChange={e => setCreateOrderData(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
              <div className="flex justify-between items-center mt-4">
                <span className="font-semibold text-lg">
                  Total: ₹{createOrderData.total.toFixed(2)}
                </span>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating...' : 'Create Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard;