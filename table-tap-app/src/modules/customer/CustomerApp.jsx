import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { CartProvider } from '../shared/config/CartContent';
import { LikesProvider } from '../shared/config/LikesContent';
import { FoodDataProvider } from '../shared/context/FoodDataContext';
import { RestaurantProvider } from '../restaurant/pages/RestaurantSelection/RestaurantContext';
import RestaurantSelectionWrapper from '../restaurant/pages/RestaurantSelection/RestaurantSelectionWrapper';

// Opening loads eagerly so "/" never shows a black loading screen
import Opening from '../shared/components/pages/opening';
// Lazy load other pages for better performance
const OnboardingScreen = lazy(() => import('../shared/components/pages/onboardingScreen'));
const LoginPage = lazy(() => import('../shared/components/auth/LoginPage'));
const SignupPage = lazy(() => import('../shared/components/auth/SignupPage'));
const CompleteProfile = lazy(() => import('../shared/components/auth/CompleteProfile'));
const ForgotPassword = lazy(() => import('../shared/components/auth/ForgotPassward'));
const ResetPassword = lazy(() => import('../shared/components/auth/ResetPassword'));
const AuthCallback = lazy(() => import('../shared/components/auth/AuthCallback'));
const RestaurantSelectionPage = lazy(() => import('../restaurant/pages/RestaurantSelection/RestaurantSelectionPage'));

// Customer pages
const Homepage = lazy(() => import('./pages/HomePage/Homepage'));
const BestSellerPage = lazy(() => import('./pages/BestSellerPage'));
const LikedItemsPage = lazy(() => import('./pages/LikedItemsPage'));
const MyOrders = lazy(() => import('./pages/MyOrders'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const OrderTracking = lazy(() => import('./pages/OrderTracking'));
const OrderConfirmationPage = lazy(() => import('./pages/OrderConfirmationPage'));
const ContactUsPage = lazy(() => import('./pages/ContactUsPage'));
const HelpFAQPage = lazy(() => import('./pages/HelpFAQPage'));

// Use unified loading component
import LoadingScreen from '../shared/components/LoadingScreen';
const LoadingSpinner = () => <LoadingScreen message="Loading..." />;

/** Auth paths that must never be redirected to /. Fallback only sends unknown paths to /. */
const AUTH_PATHS = ['/login', '/signup', '/complete-profile', '/forgot-password', '/reset-password', '/auth-callback', '/restaurant-selection', '/onboarding'];

const FallbackRedirect = () => {
    const location = useLocation();
    const pathname = location.pathname.replace(/\/$/, '') || '/'; // normalize trailing slash
    const isAuthPath = AUTH_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
    if (isAuthPath) {
        // If * matched an auth path (e.g. /login/), render the right page so login always shows
        if (pathname === '/login' || pathname.startsWith('/login')) return <LoginPage />;
        if (pathname === '/signup' || pathname.startsWith('/signup')) return <SignupPage />;
        if (pathname === '/onboarding' || pathname.startsWith('/onboarding')) return <OnboardingScreen />;
        if (pathname === '/complete-profile' || pathname.startsWith('/complete-profile')) return <CompleteProfile />;
        if (pathname === '/forgot-password' || pathname.startsWith('/forgot-password')) return <ForgotPassword />;
        if (pathname === '/reset-password' || pathname.startsWith('/reset-password')) return <ResetPassword />;
        if (pathname === '/auth-callback' || pathname.startsWith('/auth-callback')) return <AuthCallback />;
        if (pathname === '/restaurant-selection' || pathname.startsWith('/restaurant-selection')) return <RestaurantSelectionPage />;
        return <Navigate to={pathname} replace />;
    }
    return <Navigate to="/" replace />;
};

/**
 * Customer App Module
 * Handles all customer-facing routes and functionality
 */
const CustomerApp = () => {
    return (
        <RestaurantProvider>
            <CartProvider>
                <LikesProvider>
                    <FoodDataProvider>
                        <Suspense fallback={<LoadingSpinner />}>
                            <Routes>
                                {/* Root: use index so only exact "/" matches, not /login */}
                                <Route index element={<Opening />} />
                                <Route path="/onboarding" element={<OnboardingScreen />} />
                                <Route path="/login/*" element={<LoginPage />} />
                                <Route path="/signup/*" element={<SignupPage />} />
                                <Route path="/complete-profile/*" element={<CompleteProfile />} />
                                <Route path="/forgot-password/*" element={<ForgotPassword />} />
                                <Route path="/reset-password/*" element={<ResetPassword />} />
                                <Route path="/auth-callback/*" element={<AuthCallback />} />
                                <Route path="/restaurant-selection" element={<RestaurantSelectionPage />} />
                                <Route path="/restaurant-selection/*" element={<RestaurantSelectionPage />} />

                                {/* Protected Customer Routes */}
                                <Route path="/home" element={
                                    <RestaurantSelectionWrapper>
                                        <Homepage />
                                    </RestaurantSelectionWrapper>
                                } />
                                <Route path="/best-sellers" element={
                                    <RestaurantSelectionWrapper>
                                        <BestSellerPage />
                                    </RestaurantSelectionWrapper>
                                } />
                                <Route path="/liked-items" element={
                                    <RestaurantSelectionWrapper>
                                        <LikedItemsPage />
                                    </RestaurantSelectionWrapper>
                                } />
                                <Route path="/my-orders" element={
                                    <RestaurantSelectionWrapper>
                                        <MyOrders />
                                    </RestaurantSelectionWrapper>
                                } />
                                <Route path="/order-confirmation" element={
                                    <RestaurantSelectionWrapper>
                                        <OrderConfirmation />
                                    </RestaurantSelectionWrapper>
                                } />
                                <Route path="/payment" element={
                                    <RestaurantSelectionWrapper>
                                        <PaymentPage />
                                    </RestaurantSelectionWrapper>
                                } />
                                <Route path="/profile" element={
                                    <RestaurantSelectionWrapper>
                                        <ProfilePage />
                                    </RestaurantSelectionWrapper>
                                } />
                                <Route path="/order-tracking" element={
                                    <RestaurantSelectionWrapper>
                                        <OrderTracking />
                                    </RestaurantSelectionWrapper>
                                } />
                                <Route path="/order-confirmation-page" element={
                                    <RestaurantSelectionWrapper>
                                        <OrderConfirmationPage />
                                    </RestaurantSelectionWrapper>
                                } />
                                <Route path="/contact" element={
                                    <RestaurantSelectionWrapper>
                                        <ContactUsPage />
                                    </RestaurantSelectionWrapper>
                                } />
                                <Route path="/help" element={
                                    <RestaurantSelectionWrapper>
                                        <HelpFAQPage />
                                    </RestaurantSelectionWrapper>
                                } />

                                {/* Fallback: never redirect /login etc. to / — show login if we landed on /login */}
                                <Route path="*" element={<FallbackRedirect />} />
                            </Routes>
                        </Suspense>
                    </FoodDataProvider>
                </LikesProvider>
            </CartProvider>
        </RestaurantProvider>
    );
};

export default CustomerApp;
