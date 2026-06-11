# Table-Tap — Bug Report

> Generated 2026-06-07 from a code-level bug hunt across the customer/payment flow, restaurant-admin module, and platform-admin/auth layer. Each finding's `file:line` was verified by reading the code. Tree was clean (no diff); these are latent code bugs, not regressions. No code was changed.

**Summary:** 2 critical · 8 high · 7 medium · 5 low

---

## 🔴 Critical

### 1. Privilege escalation via client-writable metadata in role guards
**Files:** `table-tap-app/src/modules/shared/config/AdminOnlyWrapper.jsx:51` · `OwnerOnlyWrapper.jsx:51`
Both guards grant access if `user.user_metadata?.profile_role === 'admin'/'owner'`, short-circuiting **before** the trusted `profiles` table check. `user_metadata` is client-writable — any authenticated user can run `supabase.auth.updateUser({ data: { profile_role: 'admin' } })` from the browser console and unlock the admin/owner panel. The `profiles` table is the source of truth everywhere else.
**Fix:** Remove the `user_metadata` branch; rely only on the DB-backed `profiles` role. (Note: `app_metadata` is safe; `user_metadata` is not.)

### 2. Payment recovery feature is hard-broken — wrong call signature
**File:** `table-tap-app/src/modules/customer/pages/PaymentPage.jsx:731`
Service signature is `checkPendingFailedOrders(userId, showPaymentRecoveryOptions)` (`paymentService.js:1076`), but it's called as `checkPendingFailedOrders((paymentId) => {...})`. `userId` receives a function (corrupts the `.eq('user_id', ...)` query) and `showPaymentRecoveryOptions` is `undefined` → `TypeError` if any pending failed order is found. The on-load post-payment recovery prompt never works.
**Fix:** Pass `(userId, callback)` in the correct order.

---

## 🟠 High

### 3. Order double-submit / no real idempotency
**File:** `PaymentPage.jsx:178-231`
The only duplicate guard is `lastPaymentIdRef`, set inside `processOrder` (`:251`) and reset to `null` on any failure (`:391`). For `direct`/`upi` paths the payment id is `'DIRECT-'+Date.now()` / `'UPI-'+Date.now()` — a new id every click — so the guard never matches across clicks. The outer `finally` (`:228`) calls `setIsProcessing(false)` synchronously right after `rzp.open()`, re-enabling the button while the Razorpay modal is open → duplicate orders on a fast double-tap.
**Fix:** Use a stable idempotency key tied to the cart/session; keep the button disabled until the flow fully resolves.

### 4. Realtime subscription + redirect timeout leak
**File:** `OrderConfirmation.jsx:39,42,58-78`
`startStatusUpdates(orderId)` returns a cleanup fn (`supabase.removeChannel(channel)`) but it's called as a bare statement and the return value is discarded; the effect's cleanup never removes the channel → a live Supabase channel leaks on every mount/re-run. The 8s redirect `setTimeout` (`:42`) is never cleared, so it fires even after the user navigates away via "Track My Order"/"Order More", forcing them to `/order-tracking`.
**Fix:** Return/await the cleanup from the effect; store and `clearTimeout` the redirect timer in cleanup.

### 5. `customerPhone.replace()` on undefined after a successful charge
**File:** `paymentService.js:223,824`
When email is blank, the guest fallback uses `orderData.customerPhone.replace(/[^0-9]/g,'')` without a null guard. A logged-in user with empty phone metadata reaches checkout with `finalCustomerPhone` undefined (guest phone validation is skipped because `user` is truthy — `PaymentPage.jsx:294`). At `:824` `.replace` throws `Cannot read properties of undefined` — **after** Razorpay has charged → order fails post-payment.
**Fix:** Guard/normalize phone before `.replace`; validate phone for logged-in users too.

### 6. Duplicate realtime subscriptions create duplicate orders
**File:** `OrderManagement.jsx:698-746` & `:1030-1072`
Two separate effects both subscribe to `orders` changes for the same `restaurantId` (a direct `supabase.channel(...)` and `subscribeToAllOrderChanges`). On INSERT both fire `setOrders`; the first handler (`:723`) prepends `[newOrder, ...prev]` with no dedupe → duplicate rows + duplicate React keys. UPDATE/DELETE are processed twice.
**Fix:** Keep one subscription; dedupe by order id on INSERT.

### 7. Error-recovery refetch ignores restaurant scoping (tenant leak)
**File:** `DashboardOverview.jsx:243-250`
In `handleUpdateOrderStatus`'s catch block, the fallback query is `client.from('orders').select('*').order(...)` with **no** `.eq('restaurant_id', ...)` and no `.limit()`. On a failed status update it loads every order across all restaurants into this restaurant's dashboard (data leak + wrong stats).
**Fix:** Scope the fallback query by `restaurant_id` and add a limit.

### 8. Dashboard total undercounts orders
**File:** `DashboardOverview.jsx:158-163`
`setOrderStats({ total: ready + completed, ... })` — `total` excludes `pending` and `preparing`; the recomputed object also drops the `pending` key.
**Fix:** `total` should include all active statuses.

### 9. Editing an offer silently overwrites its saved price
**File:** `OffersManagement.jsx:147-166` (+ `handleEditOffer` ~`:267`)
The `useEffect` on `[selectedItems]` recomputes `formData.price` from the sum of selected item prices and resets `discounted_price` toward `price * 0.9`. `handleEditOffer` sets `selectedItems`, triggering this effect, which clobbers the offer's stored `price`/`discounted_price`. Opening an existing offer to edit the name overwrites its price on save.
**Fix:** Don't recompute price when loading an existing offer (guard the effect on an "editing" flag or initial load).

### 10. "Available restaurants" computed from a paginated subset
**File:** `SubscriptionManagement.jsx:554-559`
`availableRestaurants` filters out restaurants with an active/grace subscription, but `subscriptions` only holds the first page (20 rows, via `getPaginatedSubscriptions`). With >20 subscriptions, restaurants with a sub beyond page 1 wrongly appear assignable. Only the server-side guard in `assignSubscriptionToRestaurant` (`subscriptionService.js:257-268`) prevents the bad write.
**Fix:** Compute availability from a full/distinct query of active subscriptions, not the paginated page.

---

## 🟡 Medium

### 11. Stale closure disables the session-expiry modal
**File:** `AuthContext.jsx:97,125,145`
The effect runs once (`[]` deps); the `onAuthStateChange`/`getSession` closures capture `wasAuthenticated` from the first render (always `false`). So `if (mounted && wasAuthenticated) setShowSessionModal(true)` on `SIGNED_OUT`/`TOKEN_REFRESH_FAILED` reads the stale value → the expiry modal generally never shows.
**Fix:** Track `wasAuthenticated` in a ref.

### 12. `table.tableNumber.toLowerCase()` assumes string
**Files:** `QRManagement.jsx:492` · `FloorPlanView.jsx:262`
Numeric `tableNumber` (possible from manually-edited `restaurant.tables` JSON) makes the search filter throw `.toLowerCase is not a function`, breaking the grid as soon as the user types.
**Fix:** `String(table.tableNumber).toLowerCase()`.

### 13. `order.platform[0]` unguarded
**File:** `AggregatorIntegration.jsx:710`
`{order.platform[0]}` rendered with no null guard; a row with null/undefined `platform` throws and breaks the whole Operations view.
**Fix:** Guard with `order.platform?.[0]`.

### 14. `sort()` mutates state in place
**File:** `BestSellerPage.jsx:636-645`
`filteredAndSortedItems` does `items.sort(...)`; when `searchTerm` is empty, `items` is the `bestSellerItems` state array, so `.sort()` mutates React state directly (and can desync the sessionStorage cache).
**Fix:** Sort a copy: `[...items].sort(...)`.

### 15. Inventory sort/render crashes on null optional fields
**File:** `InventoryManagement.jsx:193-203,912,916,1042,1049`
Sort comparator: `new Date(undefined).getTime()` → `NaN` (unstable order); string branch calls `bValue.toLowerCase()` when `bValue` is null → throws. Render calls `item.cost_per_unit.toFixed(2)` and `new Date(item.expiry_date)` with no guard — a newly added item missing optional fields throws at render.
**Fix:** Null-guard optional fields in both the comparator and the render.

### 16. Cross-session restaurant selection bleed
**File:** `AdminRestaurantContext.jsx:178-186`
The selected restaurant id is persisted to a single shared localStorage key `admin_selected_restaurant`, not namespaced per user. A previous user's selection persists into a new session and is auto-selected if it appears in the new user's list.
**Fix:** Namespace the key per user id.

### 17. `secureStorage.clear()` wipes ALL localStorage; bundled encryption key
**File:** `security.js:15,218-224`
`secureStorage.clear()` calls `localStorage.clear()`, removing Supabase auth tokens and unrelated app state — not just secure-storage entries. Separately, the AES key falls back to a hard-coded `'default-obfuscation-key'` shipped in the bundle, so it provides no real confidentiality.
**Fix:** Clear only namespaced `secureStorage` keys; source the key from env (or drop the false sense of security).

---

## 🟢 Low

### 18. Fixed-discount badge math mismatch
**Files:** `PaymentPage.jsx:1102` · `OrderConfirmation.jsx:812`
Badge renders `₹${item.discountvalue * item.quantity} off`, but the discount is applied per unit with `Math.max(0, price - discountvalue)` (`CartContent.jsx:90`). When the per-unit discount clamps at 0, the badge overstates the discount (e.g. ₹20 item, ₹30 discount, qty 2 → badge "₹60 off" vs actual ₹40).

### 19. 24-hour time shown with am/pm suffix
**File:** `OrderConfirmation.jsx:566`
`formatDate` prints e.g. `15:04 pm` — hour not converted to 12-hour.

### 20. Dead `/api/...` notification endpoints fail silently while telling the user "team notified"
**File:** `PaymentPage.jsx:546-572`
`notifyPaymentOrderMismatch`/`sendOrderFailureNotification` POST to `/api/payment-order-mismatch` and `/api/send-order-failure-notification`, which don't exist in this CRA app (real impl uses `supabase.functions.invoke('payment-alert')`). They always reject; catches only `console.error`, yet the user sees "team has been notified" (`:400`) — which is false.

### 21. Duplicate/divergent subscription functions (legacy, hard-coded prices)
**File:** `admin_service.js:1035-1148`
`updateRestaurantSubscription`, `cancelRestaurantSubscription`, `getSubscriptionStats`, `getUpcomingRenewals` are duplicated here against the legacy `restaurants.ai_enabled`/`is_active` model with hard-coded ₹1999/₹2599 prices and a single-arg `cancelRestaurantSubscription(restaurantId)` — incompatible with the live components that import from `subscriptionService`. Latent billing/correctness foot-gun. Confirm no live importer, then delete.

### 22. Activity logs drop `restaurant_id`
**File:** `admin_service.js:640,866`
`deleteRestaurant`/`deleteStaff` log with `restaurant_id: null`, so restaurant-scoped activity-log filtering (added in recent commits) drops these events. Also `deleteRestaurant` has a duplicated `if (error) throw error;` (`:634-635`) and staff-delete failures are only logged (orphaned staff rows possible — no transaction).

---

## Verified NOT bugs (investigated, ruled out)
- `PaymentPage.calculatePriceDetails` / `OrderConfirmation.calculatePriceDetails` totals are internally self-consistent; `Math.round(finalTotal*100)` correctly converts to paise.
- `assignSubscriptionToRestaurant` guards against duplicate active subs server-side (`subscriptionService.js:257`), mitigating #10 at the data layer.
- `generateInvoice` GST split `amount_paid - amount_paid / 1.18` (`SubscriptionManagement.jsx:648`) is the correct GST-inclusive math (precedence is `amount - (amount/1.18)`).
- `updateRestaurant` strips partner keys for non-admins (`AdminRestaurantContext.jsx:290-296`) — correct.
