import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

// Functionality comes only from core — never reach into modules/* for logic.
import { useAuth } from '../../core';

// Presentation building blocks this theme composes.
import RestaurantSelectionWrapper from '../../modules/restaurant/pages/RestaurantSelection/RestaurantSelectionWrapper';
import { hasValidRestaurantSelection } from '../../modules/shared/utils/restaurantCheck';
import Opening from '../../modules/shared/pages/opening';
import { authService } from '../../modules/shared/api/authService';
import LoadingScreen from '../../modules/shared/components/LoadingScreen';
import { isCustomerAppOrigin } from '../../modules/shared/utils/subdomainRouter';

/** On "/": show Opening (splash) only when not logged in; if logged in, redirect to /home or /restaurant-selection. */
function OpeningOrRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const pathname = (location.pathname || '/').replace(/\/$/, '') || '/';
  const search = location.search || '';

  // Only run redirect on customer app root (not admin/restaurant subdomain)
  const isCustomerOrigin = () => {
    if (typeof window === 'undefined') return true;
    return isCustomerAppOrigin();
  };

  React.useEffect(() => {
    if (!authLoading && user && pathname === '/' && isCustomerOrigin()) {
      const checkRoleAndRedirect = async () => {
        try {
          // Check if profile exists just to ensure valid session,
          // but DO NOT redirect based on role if we are on customer app.
          await authService.getProfile(user.id);

          const to = hasValidRestaurantSelection() ? '/home' : '/restaurant-selection';
          navigate(to + search, { replace: true });
        } catch (err) {
          console.error('Role check failed:', err);
          navigate('/restaurant-selection' + search, { replace: true });
        }
      };
      checkRoleAndRedirect();
    }
  }, [user, authLoading, pathname, navigate, search]);

  if (pathname !== '/') return <Opening />;
  if (!isCustomerOrigin()) return <Opening />;
  if (authLoading || (user && pathname === '/')) return <Opening />;

  return <Opening />;
}

// Lazy load pages for better performance
const OnboardingScreen = lazy(() => import('../../modules/shared/pages/onboardingScreen'));
const LoginPage = lazy(() => import('../../modules/shared/components/auth/LoginPage'));
const SignupPage = lazy(() => import('../../modules/shared/components/auth/SignupPage'));
const CompleteProfile = lazy(() => import('../../modules/shared/components/auth/CompleteProfile'));
const ForgotPassword = lazy(() => import('../../modules/shared/components/auth/ForgotPassward'));
const ResetPassword = lazy(() => import('../../modules/shared/components/auth/ResetPassword'));
const AuthCallback = lazy(() => import('../../modules/shared/components/auth/AuthCallback'));
const RestaurantSelectionPage = lazy(
  () => import('../../modules/restaurant/pages/RestaurantSelection/RestaurantSelectionPage'),
);

// Customer pages
const Homepage = lazy(() => import('../../modules/customer/pages/HomePage/Homepage'));
const BestSellerPage = lazy(() => import('../../modules/customer/pages/BestSellerPage'));
const LikedItemsPage = lazy(() => import('../../modules/customer/pages/LikedItemsPage'));
const MyOrders = lazy(() => import('../../modules/customer/pages/MyOrders'));
const OrderConfirmation = lazy(() => import('../../modules/customer/pages/OrderConfirmation'));
const PaymentPage = lazy(() => import('../../modules/customer/pages/PaymentPage'));
const ProfilePage = lazy(() => import('../../modules/customer/pages/ProfilePage'));
const OrderTracking = lazy(() => import('../../modules/customer/pages/OrderTracking'));
const OrderConfirmationPage = lazy(
  () => import('../../modules/customer/pages/OrderConfirmationPage'),
);
const ContactUsPage = lazy(() => import('../../modules/customer/pages/ContactUsPage'));
const HelpFAQPage = lazy(() => import('../../modules/customer/pages/HelpFAQPage'));
const TermsOfService = lazy(() => import('../../modules/shared/components/legal/TermsOfService'));
const PrivacyPolicy = lazy(() => import('../../modules/shared/components/legal/PrivacyPolicy'));
const RequireAuth = lazy(() => import('../../modules/shared/components/auth/RequireAuth'));
const NotFoundPage = lazy(() => import('../../modules/shared/components/NotFoundPage'));
const LoadingSpinner = () => <LoadingScreen message="Loading..." />;

/** Auth paths that must never be redirected to /. Fallback only sends unknown paths to /. */
const AUTH_PATHS = [
  '/login',
  '/signup',
  '/complete-profile',
  '/forgot-password',
  '/reset-password',
  '/auth-callback',
  '/restaurant-selection',
  '/onboarding',
  '/terms',
  '/privacy',
];

const FallbackRedirect = ({ NotFound }) => {
  const location = useLocation();
  const pathname = location.pathname.replace(/\/$/, '') || '/'; // normalize trailing slash
  const isAuthPath = AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
  if (isAuthPath) {
    // If * matched an auth path (e.g. /login/), render the right page so login always shows
    if (pathname === '/login' || pathname.startsWith('/login')) return <LoginPage />;
    if (pathname === '/signup' || pathname.startsWith('/signup')) return <SignupPage />;
    if (pathname === '/onboarding' || pathname.startsWith('/onboarding'))
      return <OnboardingScreen />;
    if (pathname === '/complete-profile' || pathname.startsWith('/complete-profile'))
      return <CompleteProfile />;
    if (pathname === '/forgot-password' || pathname.startsWith('/forgot-password'))
      return <ForgotPassword />;
    if (pathname === '/reset-password' || pathname.startsWith('/reset-password'))
      return <ResetPassword />;
    if (pathname === '/auth-callback' || pathname.startsWith('/auth-callback'))
      return <AuthCallback />;
    if (pathname === '/restaurant-selection' || pathname.startsWith('/restaurant-selection'))
      return <RestaurantSelectionPage />;
    if (pathname === '/terms' || pathname.startsWith('/terms')) return <TermsOfService />;
    if (pathname === '/privacy' || pathname.startsWith('/privacy')) return <PrivacyPolicy />;
    return <Navigate to={pathname} replace />;
  }
  // Unknown path — show 404 instead of silently redirecting to /
  if (NotFound) return <NotFound />;
  return <Navigate to="/" replace />;
};

/**
 * Theme A — the default customer-facing frontend.
 *
 * Renders only presentation + routing. All functionality (cart, orders, menu,
 * payments, auth, restaurant/theme resolution) is provided by the core shell in
 * CustomerApp, consumed here through `src/core` hooks.
 */
const ThemeA = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Root: use index so only exact "/" matches, not /login */}
        <Route index element={<OpeningOrRedirect />} />
        <Route path="/onboarding" element={<OnboardingScreen />} />
        <Route path="/login/*" element={<LoginPage />} />
        <Route path="/signup/*" element={<SignupPage />} />
        <Route path="/complete-profile/*" element={<CompleteProfile />} />
        <Route path="/forgot-password/*" element={<ForgotPassword />} />
        <Route path="/reset-password/*" element={<ResetPassword />} />
        <Route path="/auth-callback/*" element={<AuthCallback />} />
        <Route path="/restaurant-selection" element={<RestaurantSelectionPage />} />
        <Route path="/restaurant-selection/*" element={<RestaurantSelectionPage />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />

        {/* Protected Customer Routes */}
        <Route
          path="/home"
          element={
            <RestaurantSelectionWrapper>
              <Homepage />
            </RestaurantSelectionWrapper>
          }
        />
        <Route
          path="/best-sellers"
          element={
            <RestaurantSelectionWrapper>
              <BestSellerPage />
            </RestaurantSelectionWrapper>
          }
        />
        <Route
          path="/liked-items"
          element={
            <RestaurantSelectionWrapper>
              <LikedItemsPage />
            </RestaurantSelectionWrapper>
          }
        />
        <Route
          path="/my-orders"
          element={
            <RequireAuth>
              <RestaurantSelectionWrapper>
                <MyOrders />
              </RestaurantSelectionWrapper>
            </RequireAuth>
          }
        />
        <Route
          path="/order-confirmation"
          element={
            <RestaurantSelectionWrapper>
              <OrderConfirmation />
            </RestaurantSelectionWrapper>
          }
        />
        <Route
          path="/payment"
          element={
            <RestaurantSelectionWrapper>
              <PaymentPage />
            </RestaurantSelectionWrapper>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <RestaurantSelectionWrapper>
                <ProfilePage />
              </RestaurantSelectionWrapper>
            </RequireAuth>
          }
        />
        <Route
          path="/order-tracking"
          element={
            <RestaurantSelectionWrapper>
              <OrderTracking />
            </RestaurantSelectionWrapper>
          }
        />
        <Route
          path="/order-confirmation-page"
          element={
            <RestaurantSelectionWrapper>
              <OrderConfirmationPage />
            </RestaurantSelectionWrapper>
          }
        />
        <Route
          path="/contact"
          element={
            <RestaurantSelectionWrapper>
              <ContactUsPage />
            </RestaurantSelectionWrapper>
          }
        />
        <Route
          path="/help"
          element={
            <RestaurantSelectionWrapper>
              <HelpFAQPage />
            </RestaurantSelectionWrapper>
          }
        />

        {/* Fallback: never redirect /login etc. to / — show login if we landed on /login */}
        <Route path="*" element={<FallbackRedirect NotFound={NotFoundPage} />} />
      </Routes>
    </Suspense>
  );
};

export default ThemeA;
