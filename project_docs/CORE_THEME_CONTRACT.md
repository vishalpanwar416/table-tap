# `@table-tap/core` — Headless Contract for Themeable Customer App

> Functionality lives in `core` and is written once. Each theme is a complete from-scratch
> customer frontend that consumes `core` via the hooks below. A restaurant's `theme_id`
> decides which theme bundle is lazy-loaded at runtime. Adding a theme = new UI package +
> one registry line. Themes never add a deployment.

**Hard rule:** `core` returns **data and actions only — never JSX**. The day a `core` hook
returns markup or assumes a layout, themes become coupled and the model degrades. Keep the
boundary headless.

---

## 1. The hook surface (the contract every theme codes against)

All signatures below are the *current* public values of your existing providers — so `core`
is an extraction, not a rewrite.

### `useRestaurant()` — tenant + theme resolution
Source today: `modules/restaurant/pages/RestaurantSelection/RestaurantContext.jsx`
```ts
{
  restaurant,            // full restaurant row
  restaurantId,
  tableNumber,
  themeId,               // ← ADD: restaurant.theme_id, surfaced for the loader
  loading,               // true until restaurant + themeId resolved (gate first paint)
  error,
  updateRestaurant, refreshRestaurant,
  setRestaurantAndTable, // (restaurantId, tableNumber)
  clearSession,
}
```
Resolution order (unchanged): `?restaurant=&table=` → localStorage → fetch row.
**Change:** include `theme_id` in the restaurant lookup and expose `themeId`, cached in
localStorage next to `restaurantId`/`tableNumber`, so the right theme loads on first paint
with no flash.

### `useMenu()` — food catalog
Source today: `FoodDataContext.jsx` + `customer/api/foodData.js`
```ts
{
  allFoodItems, bestSellerItems, recommendedItems,
  loading, isRefreshing, error,
  currentRestaurantId,
  // raw fetchers also exported standalone:
  // fetchFoodItems(id), fetchBestSellerItems(id), fetchRecommendedItems(id),
  // fetchMaincaroselData(id), hasTag(item, tags)
}
```
Constants stay in core: `categories`, `BESTSELLER_TAGS`, `RECOMMENDED_TAGS`.

### `useCart()` — cart state
Source today: `shared/config/CartContent.jsx` (already exactly this surface)
```ts
{
  cartItems,
  addToCart, removeItem, updateQuantity, clearCart,
  calculateEffectivePrice,
  getTotalItems, getTotalPrice,
  syncWithServer, mergeCarts,
  isLoading, lastSyncTime, error,
  restaurantId,
}
```

### `useLikes()`
Source today: `shared/config/LikesContent.jsx`
```ts
{ likedItems, likedItemIds, toggleLike, isLiked, clearAllLikes }
```

### `useOrders()`
Source today: `shared/context/OrderContext.jsx`
```ts
{
  userOrders, currentOrder, ordersTotal,
  loading, error,
  placeOrder, updateOrderPayment,
  fetchUserOrders, getOrderDetails,
  subscribeToOrderStatus,   // realtime
  restaurant,
}
```

### `usePayment()` — Razorpay flow
Source today: `customer/api/paymentService.js` (wrap the loose exports into one hook)
```ts
{
  processOrderWithPayment,   // the orchestrator
  calculateOrderTotals,      // (items, discountValue, discountType)
  formatCurrency,            // (amount, 'INR')
  isPaymentCompleted, getPaymentStatusColor, getPaymentMethodDisplayName,
  checkPendingFailedOrders,
}
```

### `useAuth()`
Source today: `shared/config/AuthContext.jsx`
```ts
{ user, loading, refreshUser }   // + signIn/signOut from supabase via core
```

### `useOffers()`  (carousel / promos)
Source today: `customer/api/offerService.js` — expose `getCarouselOffers(restaurantId)`,
`getRestaurantOffers(restaurantId)` as a hook.

---

## 2. File split — what moves where

### → `packages/core` (functionality, no UI)
```
modules/customer/api/foodData.js           (minus the React hooks at bottom — keep fetchers)
modules/customer/api/cartService.js
modules/customer/api/foodService.js
modules/customer/api/enhancedFoodService.js
modules/customer/api/paymentService.js
modules/customer/api/offerService.js
modules/shared/config/CartContent.jsx      (provider + useCart)
modules/shared/config/LikesContent.jsx
modules/shared/context/OrderContext.jsx
modules/shared/context/FoodDataContext.jsx
modules/shared/context/NotificationContext.jsx
modules/shared/config/AuthContext.jsx
modules/restaurant/.../RestaurantContext.jsx
modules/shared/hooks/{useBestSellerData,useLocation,useNotification,
                      useOnlineStatus,usePerformance,useScrollLock,useVirtualScrolling}.js
modules/shared/api/*                         (billService, invoiceService, notification, etc.)
supabase client + offlineStorage
```

### → `packages/themes/theme-a` (presentation = today's customer UI, rebuilt on core)
```
modules/customer/pages/*                    (all the screens)
modules/customer/components/*               (all 30 components)
modules/customer/.../Homepage.jsx
src/styles, theme-specific CSS/assets
```
Theme imports from `@table-tap/core` only — never from another theme.

### Shared-but-presentational (decide per item)
`shared/components/{LoadingScreen, ErrorBoundary, NotFoundPage}` — either duplicate per
theme (if look differs) or keep a tiny `@table-tap/ui-primitives` package for truly
generic shells. Default: let each theme own its loading/empty/error states.

---

## 3. The loader (lives in the customer app shell, not in a theme)

```js
// apps/customer/src/themeRegistry.js
export const THEMES = {
  a: () => import('@table-tap/theme-a'),
  b: () => import('@table-tap/theme-b'),
};

// apps/customer/src/CustomerShell.jsx
function CustomerShell() {
  const { themeId, loading } = useRestaurant();      // from core
  if (loading) return <BootSplash />;                // app-level, theme-agnostic
  const load = THEMES[themeId] ?? THEMES.a;
  const Theme = React.lazy(load);
  return (
    <Suspense fallback={<BootSplash />}>
      <Theme />                                       {/* theme renders its own routes */}
    </Suspense>
  );
}
```
Each theme default-exports its own `<Routes>`/app root. The shell only: resolves restaurant
(via core providers), reads `themeId`, lazy-loads the matching bundle. Bundler emits one
chunk per theme → customer downloads only their restaurant's theme.

---

## 4. Migration order (lowest risk, one deployment throughout)

1. Create `packages/core`; move the api/context files above into it, fix imports. App still
   works as one SPA.
2. Add `theme_id` column to restaurants (default `'a'`); surface `themeId` in `useRestaurant`.
3. Wrap today's customer UI as `packages/themes/theme-a` importing from core. Mount via the
   loader. **Now you have the full mechanism on one deployment.**
4. Build `theme-b` from scratch against core to prove independence.
5. (Separate, later decision) split `apps/*` into their own Vercel projects + Vite + Turbo.

Steps 1–4 need **zero** new deployments. Only step 5 touches Vercel.

---

## 5. Contract stability rule

Once two themes consume a hook, its return shape is an API. Add fields freely; **renaming or
removing** a field is a breaking change that must update every theme in the same PR. Treat
`core`'s exported hook shapes as semver-significant.
