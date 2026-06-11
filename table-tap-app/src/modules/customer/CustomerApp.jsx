import React, { Suspense } from 'react';

// Core shell: all functionality providers + tenant/theme resolution.
import {
  RestaurantProvider,
  OrderProvider,
  LiveOrderProvider,
  CartProvider,
  LikesProvider,
  FoodDataProvider,
  useRestaurant,
} from '../../core';
import LoadingScreen from '../shared/components/LoadingScreen';
import { getThemeLoader } from '../../themes/registry';

// Cache the lazy component per themeId so switching themes (or re-renders) doesn't
// recreate the component and remount the whole tree.
const themeCache = {};
function getThemeComponent(themeId) {
  if (!themeCache[themeId]) {
    themeCache[themeId] = React.lazy(getThemeLoader(themeId));
  }
  return themeCache[themeId];
}

/**
 * Reads the resolved theme_id and renders the matching customer frontend.
 * Must live inside RestaurantProvider so useRestaurant() is available.
 */
function ThemeOutlet() {
  const { themeId } = useRestaurant();
  const Theme = getThemeComponent(themeId);
  return (
    <Suspense fallback={<LoadingScreen message="Loading..." />}>
      <Theme />
    </Suspense>
  );
}

/**
 * Customer App — headless shell.
 *
 * Provides every functionality context, then hands off all presentation to the
 * theme selected by the restaurant's theme_id. The shell contains no UI/routes
 * of its own; each theme owns its routes and screens (see src/themes/*).
 */
const CustomerApp = () => {
  return (
    <RestaurantProvider>
      <OrderProvider>
        <CartProvider>
          <LiveOrderProvider>
            <LikesProvider>
              <FoodDataProvider>
                <ThemeOutlet />
              </FoodDataProvider>
            </LikesProvider>
          </LiveOrderProvider>
        </CartProvider>
      </OrderProvider>
    </RestaurantProvider>
  );
};

export default CustomerApp;
