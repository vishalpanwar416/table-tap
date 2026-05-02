import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import Sidebar from '../../components/admin/Sidebar';
import MobileNav from '../../components/admin/MobileNav';
import DashboardOverview from '../../components/admin/DashboardOverviewComponents/DashboardOverview';
import AggregateAnalytics from '../../components/admin/DashboardOverviewComponents/AggregateAnalytics';
import MenuManagement from '../../components/admin/MenuManagementComponent/MenuManagement';
import OrderManagement from '../../components/admin/OrderManagement';
import StaffManagement from '../../components/admin/StaffManagement';
import OffersManagement from '../../components/admin/OffersManagement';
import SettingsManagement from '../../components/admin/RestaurantInformation';
import InventoryManagement from '../../components/admin/InventoryManagement';
import LogoutPopup from '../../../shared/components/auth/auth/LogoutPopup';
import NotificationSound from '../../components/admin/NotificationSound';
import NotificationToast from '../../components/admin/NotificationToast';
// Lazy load AI Analytics (contains heavy Recharts library)
const AIAnalyticsChat = React.lazy(() => import('../../components/admin/AIAnalyticsChat'));
import ManagerNotificationsToast from '../../components/admin/ManagerNotificationsToast';
import QRManagement from '../../components/admin/QRManagement/QRManagement';
import ActivityLogs from '../../components/admin/ActivityLogs';
import AggregatorIntegration from '../../components/admin/AggregatorIntegration';
import { X, ChevronLeft, Package, BarChart3, Sparkles, Plus, Building2, ChevronDown, Clock, Grid, Crown } from 'lucide-react';
// Use Building2 as a fallback for Store icon if it's missing from the version of lucide-react
const StoreIcon = Building2;

import FloorPlanView from '../../components/admin/FloorPlan/FloorPlanView';
import { getAllFoodItems, getRestaurantFoodItems } from '../../../customer/api/foodService';
// Use dynamic import in effects to avoid "Can't find variable: supabase" when chunk loads before shared module
import { updateOrderStatus as updateOrderStatusService } from '../../api/admin/orderService';
import { useAdminRestaurant } from '../../../shared/context/AdminRestaurantContext';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { restaurantId } = useParams();
  const [activeTab, setActiveTabState] = useState('dashboard');
  const tabFromUrlInitialized = useRef(false);

  // Keep URL in sync with active tab and provide a single setter for tab changes
  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    setSearchParams(params => {
      const next = new URLSearchParams(params);
      if (tab && tab !== 'dashboard') next.set('tab', tab);
      else next.delete('tab');
      return next;
    }, { replace: true });
  };
  const [foodItems, setFoodItems] = useState([]);
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
    isAdmin: contextIsAdmin,
    isOwner: contextIsOwner,
    ownedRestaurants,
    setOwnerRestaurant
  } = useAdminRestaurant();

  // State for restaurant selector
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [showRestaurantSelector, setShowRestaurantSelector] = useState(false);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);

  // Menu items shared across components - with role-based filtering
  const getMenuItems = () => {
    // Full access items
    const allItems = [
      { id: 'dashboard', icon: 'LayoutDashboard', label: 'Dashboard' },
      { id: 'floor-plan', icon: 'Map', label: 'Floor Planner' },
      { id: 'menu', icon: 'Utensils', label: 'Menu Management' },
      { id: 'orders', icon: 'ShoppingCart', label: 'Order Management' },
      { id: 'inventory', icon: 'Package', label: 'Inventory Management' },
      { id: 'users', icon: 'Users', label: 'Staff Management' },
      { id: 'offers', icon: 'Tag', label: 'Offers & Promotions' },
      { id: 'qr', icon: 'QrCode', label: 'QR Management' },
      { id: 'settings', icon: 'Settings', label: 'Restaurant Information' },
      { id: 'activity-logs', icon: 'Clock', label: 'Activity Logs' },
    ];

    let filteredItems = [];

    // Owner, Admin, Manager have full access (initially)
    if (['admin', 'manager', 'owner'].includes(contextUserRole) || contextIsAdmin()) {
      filteredItems = [...allItems];

      // Add Multi-Restaurant Overview for owners with multiple restaurants
      if (contextIsOwner() && ownedRestaurants && ownedRestaurants.length > 1) {
        // Insert at the beginning for easy access
        filteredItems.unshift({ id: 'aggregate-analytics', icon: 'Building2', label: 'All Restaurants' });
      }

      // Add AI Analytics and Aggregators only for managers, owners and admins if enabled for the restaurant
      if (restaurant?.ai_enabled) {
        const insertIdx = filteredItems.findIndex(i => i.id === 'qr');
        if (insertIdx !== -1) filteredItems.splice(insertIdx, 0, { id: 'analytics', icon: 'BarChart3', label: 'AI Analytics' });
      }
      if (restaurant?.aggregators_enabled) {
        const insertIdx = filteredItems.findIndex(i => i.id === 'settings');
        if (insertIdx !== -1) filteredItems.splice(insertIdx, 0, { id: 'aggregators', icon: 'ShoppingBag', label: 'Aggregators' });
      }
    } else if (contextUserRole === 'captain') {
      filteredItems = allItems.filter(item =>
        ['dashboard', 'floor-plan', 'menu', 'orders', 'qr'].includes(item.id)
      );
    } else if (contextUserRole === 'chef') {
      filteredItems = allItems.filter(item =>
        ['orders', 'menu', 'inventory'].includes(item.id)
      );
      // Rename for clarity
      const orderItem = filteredItems.find(i => i.id === 'orders');
      if (orderItem) orderItem.label = 'Kitchen Orders';
    } else if (contextUserRole === 'waiter') {
      filteredItems = allItems.filter(item =>
        ['dashboard', 'floor-plan', 'menu', 'orders'].includes(item.id)
      );
    } else if (contextUserRole === 'cashier') {
      filteredItems = allItems.filter(item =>
        ['dashboard', 'orders', 'offers', 'activity-logs'].includes(item.id)
      );
    }

    return filteredItems;
  };

  const menuItems = getMenuItems();

  const [notificationPermission, setNotificationPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );

  // New state for authentication loading
  const [authLoading, setAuthLoading] = useState(true);

  // Sidebar collapse state (desktop). Persisted for better UX.
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('restaurant_sidebar_collapsed') === '1';
    } catch {
      return false;
    }
  });

  // Fetch all restaurants for admin selector
  const fetchAllRestaurants = async () => {
    if (!contextIsAdmin()) return;
    const { supabase } = await import('../../../shared/supabase');
    if (!supabase) return;
    try {
      setLoadingRestaurants(true);
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name, is_active')
        .order('name', { ascending: true });

      if (error) throw error;
      setAllRestaurants(data || []);
    } catch (error) {
      setErrorMsg('Failed to load restaurants');
    } finally {
      setLoadingRestaurants(false);
    }
  };

  // Determine which list to show in selector
  const selectorRestaurants = contextIsAdmin() ? allRestaurants : (contextIsOwner() ? ownedRestaurants : []);
  const showSelector = (contextIsAdmin() || (contextIsOwner() && ownedRestaurants.length > 1));

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
      let success = false;
      if (contextIsAdmin()) {
        success = await setAdminRestaurant(restaurantId);
      } else if (contextIsOwner()) {
        success = await setOwnerRestaurant(restaurantId);
      }

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

  // Check authentication and get user on mount (dynamic import avoids chunk-order "supabase" undefined)
  useEffect(() => {
    let authListener = null;
    let cancelled = false;
    (async () => {
      const { supabase } = await import('../../../shared/supabase');
      if (cancelled || !supabase) return;
      try {
        setAuthLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (cancelled) return;
        if (!user) {
          navigate('/login');
          return;
        }
        setCurrentUser(user);
      } catch (error) {
        if (!cancelled) navigate('/login');
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
      if (cancelled) return;
      const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') navigate('/login');
        else if (session?.user) setCurrentUser(session.user);
      });
      authListener = listener;
    })();
    return () => {
      cancelled = true;
      if (authListener?.subscription) authListener.subscription.unsubscribe();
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
    let cancelled = false;
    (async () => {
      const { supabase } = await import('../../../shared/supabase');
      if (cancelled || !supabase) return;
      try {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('profile_role, avatar_url')
          .eq('id', currentUser.id)
          .single();
        if (cancelled) return;

        if (!error && profileData) {
          const role = profileData.profile_role;
          setUserRole(role);

          // Merge profile fields onto auth user for UI (e.g., sidebar avatar)
          setCurrentUser(prev => ({
            ...(prev || {}),
            avatar_url: profileData.avatar_url ?? prev?.avatar_url ?? null,
          }));

          // Allow manager, admin, captain, owner, chef, waiter, cashier roles to access the dashboard
          setIsManager(role === 'manager');
          setIsAdmin(role === 'admin' || role === 'owner');

          // Allowed roles
          const allowedRoles = ['manager', 'admin', 'captain', 'owner', 'chef', 'waiter', 'cashier'];

          // If user is not in allowed roles, redirect to restaurant login (stay in restaurant app)
          if (!allowedRoles.includes(role)) {
            navigate('/login');
            return;
          }
        }
      } catch (error) {
        if (!cancelled) console.error('Dashboard: failed to load profile', error);
      }
    })();
    return () => { cancelled = true; };
  }, [currentUser, navigate]);

  // Fetch food items with restaurant filter (no global loading overlay to avoid "Processing..." popup on dashboard open)
  const fetchFoodItems = async () => {
    try {
      let data;
      if (userRestaurantId) {
        data = await getRestaurantFoodItems(userRestaurantId);
      } else {
        data = await getAllFoodItems();
      }

      setFoodItems(data || []);
      return data;
    } catch (error) {
      // AbortError is transient (component unmounted or token refresh) — don't surface to user
      if (error?.name === 'AbortError' || error?.message?.includes('aborted')) return [];
      setErrorMsg('Failed to load menu items: ' + (error.message || error));
      return [];
    }
  };

  // Restore active tab from URL on load (e.g. after refresh) so user stays on the same page
  useEffect(() => {
    if (menuItems.length === 0 || tabFromUrlInitialized.current) return;
    const allowedIds = menuItems.map(item => item.id);
    const tabFromUrl = searchParams.get('tab');
    const restaurantFromUrl = searchParams.get('restaurant');

    // Check if we need to force aggregate analytics as landing
    const isOwnerWithMultiple = (contextIsOwner() || contextIsAdmin()) && ownedRestaurants && ownedRestaurants.length > 1;

    // Only land on aggregate if there's no tab specified, NO specific restaurant requested in URL, 
    // and they haven't picked one yet
    const shouldLandOnAggregate = !tabFromUrl && !restaurantFromUrl && isOwnerWithMultiple && !userRestaurantId && allowedIds.includes('aggregate-analytics');

    if (shouldLandOnAggregate) {
      setActiveTab('aggregate-analytics');
    } else if (tabFromUrl && allowedIds.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    } else if (restaurantFromUrl && allowedIds.includes('dashboard')) {
      setActiveTab('dashboard');
    }
    tabFromUrlInitialized.current = true;
  }, [menuItems, searchParams, userRestaurantId, contextIsOwner, ownedRestaurants, contextIsAdmin]);

  // Redirect to first allowed tab if current activeTab is restricted
  useEffect(() => {
    if (menuItems.length > 0) {
      const allowedIds = menuItems.map(item => item.id);
      if (!allowedIds.includes(activeTab)) {
        setActiveTab(allowedIds[0]);
      }
    }
  }, [menuItems, activeTab]);

  // Use in useEffect to fetch food items on component mount
  useEffect(() => {
    if (currentUser) {
      fetchFoodItems();
    }
  }, [currentUser, userRestaurantId]); // Add userRestaurantId to dependencies

  // Realtime subscription for orders (dynamic import avoids chunk-order "supabase" undefined)
  const orderSupabaseRef = useRef(null);
  useEffect(() => {
    if (!currentUser) return;
    orderSupabaseRef.current = null;
    (async () => {
      const { supabase: client } = await import('../../../shared/supabase');
      if (!client) return;
      orderSupabaseRef.current = client;
      if (orderChannelRef.current) {
        client.removeChannel(orderChannelRef.current);
      }
      const channel = client
        .channel('orders-channel-' + (userRestaurantId || 'all'))
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: userRestaurantId ? `restaurant_id=eq.${userRestaurantId}` : undefined
          },
          (payload) => {
            const { eventType, new: newRecord } = payload;
            if (!newRecord) return;
            if (eventType === 'INSERT') {
              setOrderToastTitle('New Order Received! 🔔');
              setOrderToastMessage(`Order #${newRecord.order_number || newRecord.id.slice(0, 8)} - Table ${newRecord.table_number || 'Takeaway'}`);
              setOrderSoundType('new_order');
              setPlayOrderSound(true);
              setShowOrderToast(true);
            }
          }
        )
        .subscribe(() => { });
      orderChannelRef.current = channel;
    })();
    return () => {
      const client = orderSupabaseRef.current;
      if (client && orderChannelRef.current) {
        client.removeChannel(orderChannelRef.current);
      }
      orderChannelRef.current = null;
    };
  }, [currentUser, userRestaurantId]);

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
  const updateOrderStatus = async (orderId, newStatus, cancelReason) => {
    try {
      setIsLoading(true);
      // Pass user info for logging
      const userData = {
        id: currentUser.id,
        user_name: restaurant?.staff?.find(s => s.user_id === currentUser.id)?.full_name ||
          currentUser.user_metadata?.full_name ||
          currentUser.email,
        role: contextUserRole
      };
      const updatedOrder = await updateOrderStatusService(orderId, newStatus, cancelReason, userData);

      // Show success notification
      setOrderToastTitle('✅ Status Updated');
      let toastMsg = `Order #${updatedOrder.order_number || updatedOrder.id.slice(0, 8)} marked as ${newStatus}`;
      const autoEmail = updatedOrder._autoEmailResult;
      if (autoEmail) {
        if (autoEmail.sent && autoEmail.to) {
          toastMsg += `. Acceptance email sent to ${autoEmail.to}`;
        } else if (autoEmail.skippedReason === 'no_customer_email' && ['preparing', 'rejected', 'completed'].includes(newStatus)) {
          toastMsg += `. No auto email: add customer email on the order to receive status emails.`;
        } else if (autoEmail.skippedReason === 'auto_email_disabled' && ['preparing', 'rejected', 'completed'].includes(newStatus)) {
          toastMsg += `. Enable "Auto email billing" in Settings → Online Bill Delivery to send emails.`;
        } else if (autoEmail.skippedReason === 'online_billing_disabled' && ['preparing', 'rejected', 'completed'].includes(newStatus)) {
          toastMsg += `. Enable "Online Bill" in Settings and ensure admin has online billing enabled for this restaurant.`;
        } else if (autoEmail.error) {
          toastMsg += `. Auto email failed: ${autoEmail.error}`;
        }
      }
      setOrderToastMessage(toastMsg);
      setShowOrderToast(true);
      setOrderSoundType('success');
      setPlayOrderSound(true);

      return updatedOrder;
    } catch (error) {
      setErrorMsg('Failed to update order status: ' + (error.message || error));
      setOrderSoundType('error');
      setPlayOrderSound(true);
      throw error;
    } finally {
      setIsLoading(false);
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

  // Import createOrder (add this to imports at top of file, but since I can't edit top easily with this tool, I'll assume it's imported or I'll use a dynamic import if needed, or better, just edit the imports in a separate step? No, I'll add the import in the import section in a separate step first to be safe, then this logic.)
  // Wait, I can't do two steps easily if I want to be atomic.
  // I'll make the header edit first.

  const handleCreateOrder = async () => {
    setIsLoading(true);
    try {
      // Dynamic import to avoid top-level relative path issues if possible, or just standard import. 
      // Since I'm editing the middle, I'll use inline requirement if I could, but ES modules don't support that easily.
      // I will add the import at the top in a separate tool call first.

      // Checking if restaurant ID is available
      const targetRestaurantId = userRestaurantId || (restaurant?.id);

      if (!targetRestaurantId) {
        throw new Error('Restaurant ID is missing. Please select a restaurant.');
      }

      const orderPayload = {
        restaurantId: targetRestaurantId,
        userId: null, // Manual order
        customerName: createOrderData.customer_name || 'Guest',
        customerEmail: createOrderData.customer_email || 'walkin@customer.com',
        customerPhone: createOrderData.customer_phone || '0000000000',
        tableNumber: createOrderData.table_number || 'Walk-in',
        items: createOrderData.items.map(item => ({
          id: item.id || null, // Will be null for manual items
          name: item.name,
          price: parseFloat(item.price),
          quantity: parseInt(item.quantity),
          category: 'Manual',
          image: null
        })),
        total: createOrderData.items.reduce((sum, item) => sum + (parseFloat(item.price) * parseInt(item.quantity)), 0),
        paymentMethod: 'cash',
        paymentStatus: 'pending',
        specialInstructions: createOrderData.notes || ''
      };

      // Import strictly for this function if not at top
      const { createOrder } = await import('../../../customer/api/paymentService');

      const newOrder = await createOrder(orderPayload);

      if (newOrder) {
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
        // Notification is handled by createOrder -> createManagerOrderNotification
      } else {
        setErrorMsg('Failed to create order.');
      }
    } catch (error) {
      console.error('Create order error:', error);
      setErrorMsg('Failed to create order: ' + error.message);
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
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto"></div>
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



      <NotificationSound play={playOrderSound} soundType={orderSoundType} />

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

      <div className="restaurant-dashboard flex h-screen">
        {/* Sidebar Component */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          menuItems={menuItems}
          handleLogout={() => setShowLogoutPopup(true)}
          currentUser={currentUser}
          restaurantName={restaurant?.name}
          restaurantLogoUrl={restaurant?.logo_url}
          userRole={contextUserRole}
          collapsed={isSidebarCollapsed}
          onToggleCollapsed={() => {
            setIsSidebarCollapsed(prev => {
              const next = !prev;
              try {
                localStorage.setItem('restaurant_sidebar_collapsed', next ? '1' : '0');
              } catch {
                // ignore
              }
              return next;
            });
          }}
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
          restaurantLogoUrl={restaurant?.logo_url}
          userRole={contextUserRole}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
        <LogoutPopup
          isOpen={showLogoutPopup}
          onClose={() => setShowLogoutPopup(false)}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden pt-16 md:pt-0">
          {/* Main Content Header */}
          <div className="hidden md:block bg-white shadow-sm z-10 p-4 md:p-6">
            <div className="w-full px-4 md:px-8 flex justify-between items-center">
              {/* Back Button - Top Left */}
              <div className="hidden md:flex items-center">
                <button
                  onClick={() => navigate(-1)}
                  className="mr-4 p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                  aria-label="Go back"
                >
                  <ChevronLeft size={30} />
                </button>
                <h2 className="text-xl md:text-2xl font-semibold text-gray-800">
                  {menuItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
                </h2>
              </div>

              {/* Restaurant Selector for Admin Users and Owners with multiple restaurants */}
              {showSelector && (
                <div className="hidden md:block relative restaurant-selector">
                  <button
                    type="button"
                    onClick={() => setShowRestaurantSelector(!showRestaurantSelector)}
                    className="restaurant-selector-trigger flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white shadow-sm hover:border-primary-300 hover:bg-primary-50/50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  >
                    {contextIsAdmin() ? <Building2 size={18} className="text-gray-600" /> : <Crown size={18} className="text-amber-600" />}
                    <span className="text-sm font-medium text-gray-700">
                      {restaurant?.name || 'Select Restaurant'}
                    </span>
                    <ChevronDown size={16} className="text-gray-500" />
                  </button>

                  {/* Restaurant Dropdown */}
                  {showRestaurantSelector && (
                    <div className="restaurant-selector-dropdown absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                      <div className="p-2">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2 border-b border-gray-100">
                          {contextIsAdmin() ? 'All Restaurants' : 'Your Restaurants'}
                        </div>
                        {loadingRestaurants ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-500 border-t-transparent"></div>
                            <span className="ml-2 text-sm text-gray-500">Loading...</span>
                          </div>
                        ) : selectorRestaurants.length === 0 ? (
                          <div className="text-center py-4 text-sm text-gray-500">
                            No restaurants available
                          </div>
                        ) : (
                          selectorRestaurants.map((rest) => (
                            <button
                              key={rest.id}
                              onClick={() => handleRestaurantSelect(rest.id)}
                              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${rest.id === userRestaurantId
                                ? 'bg-primary-100 text-primary-700'
                                : 'hover:bg-primary-50 text-gray-700'
                                }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="truncate">{rest.name}</span>
                                {rest.id === userRestaurantId && (
                                  <span className="text-primary-600">✓</span>
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

              <div className="hidden md:flex items-center gap-4">
                <ManagerNotificationsToast />
                <div className="relative text-gray-600">
                  <input
                    type="search"
                    name="search"
                    placeholder="Search..."
                    className="bg-gray-100 h-10 px-5 pr-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
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
            <div className={`px-2 ${activeTab === 'analytics' ? 'py-0 h-full' : 'py-6 md:py-8'} md:px-8 w-full mx-auto`}>
              {/* Mobile Search */}
              <div className="md:hidden mb-4">
                {/* Mobile Restaurant Selector for Admin Users and Owners with multiple restaurants */}
                {showSelector && (
                  <div className="mb-4 restaurant-selector">
                    <button
                      type="button"
                      onClick={() => setShowRestaurantSelector(!showRestaurantSelector)}
                      className="restaurant-selector-trigger w-full flex items-center justify-between gap-2 px-3 py-3 rounded-xl border border-gray-200 bg-white shadow-sm hover:border-primary-300 hover:bg-primary-50/50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        {contextIsAdmin() ? <Building2 size={18} className="text-gray-600" /> : <Crown size={18} className="text-amber-600" />}
                        <span className="text-sm font-medium text-gray-700">
                          {restaurant?.name || 'Select Restaurant'}
                        </span>
                      </div>
                      <ChevronDown size={16} className="text-gray-500" />
                    </button>

                    {/* Mobile Restaurant Dropdown */}
                    {showRestaurantSelector && (
                      <div className="restaurant-selector-dropdown mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                        <div className="p-2">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-2 border-b border-gray-100">
                            {contextIsAdmin() ? 'All Restaurants' : 'Your Restaurants'}
                          </div>
                          {loadingRestaurants ? (
                            <div className="flex items-center justify-center py-4">
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-500 border-t-transparent"></div>
                              <span className="ml-2 text-sm text-gray-500">Loading...</span>
                            </div>
                          ) : selectorRestaurants.length === 0 ? (
                            <div className="text-center py-4 text-sm text-gray-500">
                              No restaurants available
                            </div>
                          ) : (
                            selectorRestaurants.map((rest) => (
                              <button
                                key={rest.id}
                                onClick={() => handleRestaurantSelect(rest.id)}
                                className={`w-full text-left px-2 py-3 rounded-lg text-sm font-medium transition-colors ${rest.id === userRestaurantId
                                  ? 'bg-primary-100 text-primary-700'
                                  : 'hover:bg-primary-50 text-gray-700'
                                  }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="truncate">{rest.name}</span>
                                  {rest.id === userRestaurantId && (
                                    <span className="text-primary-600">✓</span>
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


              </div>

              {/* Content Components - Removed redundant padding */}
              {activeTab === 'aggregate-analytics' && (contextIsOwner() || contextIsAdmin()) && ownedRestaurants && ownedRestaurants.length > 1 && (
                <AggregateAnalytics
                  onSelectRestaurant={async (restaurantId) => {
                    let success;
                    if (contextIsAdmin()) {
                      success = await setAdminRestaurant(restaurantId);
                    } else {
                      success = await setOwnerRestaurant(restaurantId);
                    }
                    if (success) {
                      setActiveTab('dashboard');
                      setSuccessMsg('Switched to restaurant dashboard');
                    }
                  }}
                />
              )}

              {activeTab !== 'aggregate-analytics' && !userRestaurantId ? (
                <div className="flex justify-center items-center min-h-[50vh]">
                  <div className="text-center p-8 max-w-md bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <StoreIcon className="text-primary-500" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Select a Restaurant</h3>
                    <p className="text-gray-500 mb-6">You need to select a restaurant from the top menu to view its dashboard.</p>
                    {(contextIsOwner() || contextIsAdmin()) && ownedRestaurants?.length > 1 && (
                      <button
                        onClick={() => setActiveTab('aggregate-analytics')}
                        className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors shadow-sm"
                      >
                        View All Restaurants
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {activeTab === 'dashboard' && (
                    <DashboardOverview
                      foodItems={foodItems}
                      updateOrderStatus={updateOrderStatus}
                      setActiveTab={setActiveTab}
                      restaurant={restaurant}
                      userRole={contextUserRole}
                    />
                  )}

                  {activeTab === 'floor-plan' && (
                    <FloorPlanView
                      searchTerm={searchTerm}
                      onViewOrders={() => setActiveTab('orders')}
                      onCreateOrder={(tableNum) => {
                        setCreateOrderData(prev => ({ ...prev, table_number: tableNum }));
                        setShowCreateOrderModal(true);
                      }}
                    />
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
                    <OrderManagement
                      restaurantId={userRestaurantId}
                      updateOrderStatus={updateOrderStatus}
                      searchTerm={searchTerm}
                    />
                  )}

                  {activeTab === 'inventory' && (
                    <InventoryManagement
                      setLoading={setLoading}
                      setErrorMsg={setErrorMsg}
                      setSuccessMsg={setSuccessMsg}
                      searchTerm={searchTerm}
                    />
                  )}

                  {activeTab === 'users' && (
                    <StaffManagement
                      searchTerm={searchTerm}
                      setSearchTerm={setSearchTerm}
                    />
                  )}

                  {activeTab === 'offers' && (
                    <OffersManagement
                      setLoading={setLoading}
                      setErrorMsg={setErrorMsg}
                      setSuccessMsg={setSuccessMsg}
                    />
                  )}

                  {activeTab === 'qr' && (
                    <QRManagement
                      setLoading={setLoading}
                      setErrorMsg={setErrorMsg}
                      setSuccessMsg={setSuccessMsg}
                      searchTerm={searchTerm}
                    />
                  )}

                  {activeTab === 'analytics' && (contextUserRole === 'manager' || contextUserRole === 'admin' || contextUserRole === 'owner' || restaurant?.ai_enabled == true || contextIsAdmin()) && (
                    <div className="h-full flex flex-col">
                      {restaurant?.ai_enabled ? (
                        <Suspense fallback={
                          <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="h-8 w-8 bg-purple-100 rounded-lg animate-pulse"></div>
                              <div className="h-6 bg-gray-200 rounded w-40 animate-pulse"></div>
                            </div>
                            <div className="space-y-3">
                              <div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse"></div>
                              <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse"></div>
                              <div className="h-32 bg-gray-50 rounded animate-pulse"></div>
                            </div>
                          </div>
                        }>
                          <AIAnalyticsChat restaurantId={restaurant?.id} />
                        </Suspense>
                      ) : (
                        <div className="p-4 mb-8 bg-yellow-50 border border-yellow-200 rounded">
                          <p className="text-yellow-800 font-medium">
                            AI Analytics is disabled for this restaurant.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'aggregators' && restaurant && (
                    <AggregatorIntegration
                      restaurantId={restaurant.id}
                      restaurant={restaurant}
                    />
                  )}

                  {activeTab === 'settings' && (
                    <SettingsManagement
                      currentUser={currentUser}
                    />
                  )}

                  {activeTab === 'activity-logs' && (
                    <ActivityLogs
                      setLoading={setLoading}
                      setErrorMsg={setErrorMsg}
                      setSuccessMsg={setSuccessMsg}
                      searchTerm={searchTerm}
                      setSearchTerm={setSearchTerm}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Order Modal */}
      {
        showCreateOrderModal && (
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
        )
      }
    </div >
  )
}

export default AdminDashboard;
