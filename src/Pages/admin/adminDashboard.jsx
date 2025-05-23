import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/admin/Sidebar';
import MobileNav from '../../components/admin/MobileNav';
import DashboardOverview from '../../components/admin/DashboardOverviewComponents/DashboardOverview';
import MenuManagement from '../../components/admin/MenuManagementComponent/MenuManagement';
import OrderManagement from '../../components/admin/OrderManagement';
import UserManagement from '../../components/admin/UserManagement';
import OffersManagement from '../../components/admin/OffersManagement';
import SettingsManagement from '../../components/admin/Settings';
import LogoutPopup from '../../components/auth/LogoutPopup';
import AdminNotificationsToast from '../../components/admin/AdminNotificationsToast';
import { X, ArrowLeft } from 'lucide-react';
import { getAllFoodItems } from '../../api/foodService';
import { supabase } from '../../supabase';
import { updateOrderStatus as updateOrderStatusService } from '../../api/orderService';
import NotificationSound from '../../components/admin/NotificationSound';
import NotificationToast from '../../components/admin/NotificationToast';
import { useRestaurant } from '../../context/RestaurantContext';

const AdminDashboard = () => {
  const navigate = useNavigate();
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
  const [isAdmin, setIsAdmin] = useState(false);
  const orderChannelRef = useRef(null);
  const [playOrderSound, setPlayOrderSound] = useState(false);
  const [orderSoundType, setOrderSoundType] = useState('order');
  
  // Enhanced notification states
  const [showOrderToast, setShowOrderToast] = useState(false);
  const [orderToastMessage, setOrderToastMessage] = useState('');
  const [orderToastTitle, setOrderToastTitle] = useState('');

  // Menu items shared across components
  const menuItems = [
    { id: 'dashboard', icon: 'LayoutDashboard', label: 'Dashboard' },
    { id: 'menu', icon: 'Utensils', label: 'Menu Management' },
    { id: 'orders', icon: 'ShoppingCart', label: 'Order Management' },
    { id: 'users', icon: 'Users', label: 'User Management' },
    { id: 'offers', icon: 'Tag', label: 'Offers & Promotions' },
    { id: 'settings', icon: 'Settings', label: 'Settings' },
  ];

  const [notificationPermission, setNotificationPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );

  const { restaurant } = useRestaurant();

  // Check authentication and get user on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) {
          navigate('/login');
          return;
        }
        setCurrentUser(user);
      } catch (error) {
        console.error('Auth check failed:', error);
        navigate('/login');
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

    const fetchAdminProfile = async () => {
      try {
        const { data: adminData, error } = await supabase
          .from('profiles')
          .select('full_name,avatar_url')
          .eq('id', currentUser.id)
          .single();

        if (!error && adminData) {
          setIsAdmin(adminData);
        }
      } catch (error) {
        console.error('Error fetching admin profile:', error);
      }
    };
    fetchAdminProfile();
  }, [currentUser]);
        
  // Fetch food items with error handling
  const fetchFoodItems = async () => {
    let loadingTimeout;
    try {
      setLoading(true);
      
      // Set a timeout to force loading to false after 15 seconds, preventing stuck loading states
      loadingTimeout = setTimeout(() => {
        setLoading(false);
        setErrorMsg('Request took too long. Please try again.');
      }, 15000);
      
      const data = await getAllFoodItems();
      setFoodItems(data || []);
      clearTimeout(loadingTimeout);
      return data;
    } catch (error) {
      console.error('Error fetching food items:', error);
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
  }, [currentUser]);

  // Enhanced fetch orders with real-time subscription
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

        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (error) {
        console.error("Error fetching orders:", error);
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

    // Enhanced real-time subscription with better notifications
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
          console.log('Realtime payload:', payload);
          const { eventType, new: newRecord, old: oldRecord } = payload;

          setOrders((prevOrders) => {
            if (eventType === 'INSERT') {
              // Enhanced notification handling for new orders
              let orderTotal = Number(newRecord.total);
              if (isNaN(orderTotal)) orderTotal = 0;
              const customerName = newRecord.customer_name || 'Unknown Customer';
              const orderId = newRecord.order_number || 'N/A';
              
              // Determine sound type based on order value
              const soundType = orderTotal > 50 ? 'urgent' : 'order';
              setOrderSoundType(soundType);
              setPlayOrderSound(true);
              
              // Set enhanced toast notification
              setOrderToastTitle('🔔 New Order Received!');
              setOrderToastMessage(
                `Order #${orderId} from ${customerName} - $${orderTotal.toFixed(2)}`
              );
              setShowOrderToast(true);
              
              // Browser notification (if permission granted)
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('New Order Received!', {
                  body: `Order #${orderId} from ${customerName} - Total: ${orderTotal.toFixed(2)}`,
                  icon: '/favicon.ico',
                  tag: 'new-order',
                  badge: '/favicon.ico',
                  requireInteraction: true, // Keep notification visible until user interacts
                });
              }
              
              return [newRecord, ...prevOrders];
            } else if (eventType === 'UPDATE') {
              // Handle order status updates
              const updatedOrder = newRecord;
              const statusChanged = prevOrders.find(o => o.id === updatedOrder.id)?.status !== updatedOrder.status;
              
              if (statusChanged) {
                setOrderToastTitle('📋 Order Updated');
                setOrderToastMessage(`Order #${updatedOrder.id?.slice(0, 8)} status changed to ${updatedOrder.status}`);
                setShowOrderToast(true);
                setOrderSoundType('success');
                setPlayOrderSound(true);
              }
              
              return prevOrders.map((order) =>
                order.id === newRecord.id ? newRecord : order
              );
            } else if (eventType === 'DELETE') {
              return prevOrders.filter((order) => order.id !== oldRecord.id);
            }
            return prevOrders;
          });
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to order changes');
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
  }, [currentUser]);

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

  // Enhanced update order status with better notifications
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
      
      // Optimistically update local state (now redundant with real-time updates, but keeps UI responsive)
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: updatedOrder.status } : order
        )
      );
      
      // Enhanced success notification
      setOrderToastTitle('✅ Status Updated');
      setOrderToastMessage(`Order #${orderId.slice(0,8)} marked as ${status}`);
      setShowOrderToast(true);
      setOrderSoundType('success');
      setPlayOrderSound(true);
      
      // Create notification for customer (handle separately)
      try {
        const order = orders.find(o => o.id === orderId);
        if (order?.user_id) {
          await supabase
            .from('notifications')
            .insert({
              order_id: orderId,
              title: `Order ${status}`,
              message: `Your order #${orderId.slice(0,8)} has been ${status}`,
              user_id: order.user_id,
              type: `order_${status}`
            });
        }
      } catch (notifError) {
        console.error('Notification error:', notifError);
      }
  
    } catch (error) {
      console.error("Error updating order:", error);
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

  // If we don't have a user yet, show a minimal loading state
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
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

      <AdminNotificationsToast />
      
      {/* Enhanced Notification Sound */}
      <NotificationSound play={playOrderSound} soundType={orderSoundType} />

      {loading && (
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
          currentUser={{...currentUser, ...isAdmin}}
          restaurantName={restaurant?.name}
        />

        {/* Mobile Navigation */}
        <MobileNav 
          showMobileNav={showMobileNav}
          setShowMobileNav={setShowMobileNav}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          menuItems={menuItems}
          handleLogout={() => setShowLogoutPopup(true)}
          currentUser={{...currentUser, ...isAdmin}}
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
                <DashboardOverview 
                  orders={orders}
                  foodItems={foodItems}
                  updateOrderStatus={updateOrderStatus}
                  setActiveTab={setActiveTab}
                />
              )}

              {activeTab === 'menu' && (
                <MenuManagement 
                  foodItems={foodItems}
                  fetchFoodItems={fetchFoodItems}
                  setLoading={setLoading}
                  setErrorMsg={setErrorMsg}
                  setSuccessMsg={setSuccessMsg}
                  searchTerm={searchTerm}
                />
              )}

              {activeTab === 'orders' && (
                <OrderManagement 
                  orders={orders}
                  updateOrderStatus={updateOrderStatus}
                  searchTerm={searchTerm}
                />
              )}

              {activeTab === 'users' && <UserManagement />}
              {activeTab === 'offers' && (
                <OffersManagement 
                  setLoading={setLoading}
                  setErrorMsg={setErrorMsg}
                  setSuccessMsg={setSuccessMsg}
                />
              )}
              {activeTab === 'settings' && (
                <SettingsManagement 
                  currentUser={currentUser}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;