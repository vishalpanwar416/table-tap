/**
 * @table-tap core — headless functionality contract.
 *
 * This is the ONLY surface a theme is allowed to import for functionality.
 * It exposes data + actions (hooks, providers, services) and NEVER any JSX/UI.
 * Themes (src/themes/*) build their own presentation on top of these.
 *
 * Keep this barrel stable: once two themes consume an export, renaming or
 * removing it is a breaking change that must update every theme in the same PR.
 *
 * NOTE: files are re-exported from their current locations. Physical relocation
 * into a src/core tree (or a packages/core workspace under Vite) can happen later
 * without changing a single theme import, because themes only ever see this path.
 */

// --- Tenant + theme resolution -------------------------------------------------
export {
  RestaurantProvider,
  useRestaurant,
  DEFAULT_THEME_ID,
} from '../modules/restaurant/pages/RestaurantSelection/RestaurantContext';

// --- Auth ----------------------------------------------------------------------
export { AuthProvider, useAuth } from '../modules/shared/config/AuthContext';

// --- Notifications -------------------------------------------------------------
export {
  NotificationProvider,
  useNotifications,
} from '../modules/shared/context/NotificationContext';

// --- Menu / food catalog -------------------------------------------------------
export { FoodDataProvider, useFoodData } from '../modules/shared/context/FoodDataContext';
export {
  categories,
  BESTSELLER_TAGS,
  RECOMMENDED_TAGS,
  fetchFoodItems,
  fetchBestSellerItems,
  fetchRecommendedItems,
  fetchMaincaroselData,
  hasTag,
} from '../modules/customer/api/foodData';

// --- Cart ----------------------------------------------------------------------
export { CartProvider, useCart } from '../modules/shared/config/CartContent';

// --- Likes ---------------------------------------------------------------------
export { LikesProvider, useLikes } from '../modules/shared/config/LikesContent';

// --- Orders --------------------------------------------------------------------
export { OrderProvider, useOrders } from '../modules/shared/context/OrderContext';
export { LiveOrderProvider, useLiveOrder } from '../modules/shared/context/LiveOrderContext';

// --- Payments (Razorpay) -------------------------------------------------------
export {
  processOrderWithPayment,
  calculateOrderTotals,
  formatCurrency,
  isPaymentCompleted,
  getPaymentStatusColor,
  getPaymentMethodDisplayName,
  checkPendingFailedOrders,
} from '../modules/customer/api/paymentService';

// --- Offers / promos -----------------------------------------------------------
export {
  getCarouselOffers,
  getRestaurantOffers,
  getRestaurantOffersByCategory,
} from '../modules/customer/api/offerService';

// --- Data client ---------------------------------------------------------------
export { supabase } from '../modules/shared/supabase';
