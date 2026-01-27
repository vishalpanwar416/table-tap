import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from '../shared/config/CartContent';
import { LikesProvider } from '../shared/config/LikesContent';
import { FoodDataProvider } from '../shared/context/FoodDataContext';
import { RestaurantProvider } from '../restaurant/pages/RestaurantSelection/RestaurantContext';
import RestaurantSelectionWrapper from '../restaurant/pages/RestaurantSelection/RestaurantSelectionWrapper';

// Lazy load pages for better performance
const Opening = lazy(() => import('../shared/components/pages/opening'));
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

// Loading component
const LoadingSpinner = () => (
    <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="text-center text-white">
            <div className="w-12 h-12 border-4 border-gray-700 border-t-[#2A9D8F] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading...</p>
        </div>
    </div>
);

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
                                {/* Auth & Onboarding */}
                                <Route path="/" element={<Opening />} />
                                <Route path="/onboarding" element={<OnboardingScreen />} />
                                <Route path="/login" element={<LoginPage />} />
                                <Route path="/signup" element={<SignupPage />} />
                                <Route path="/complete-profile" element={<CompleteProfile />} />
                                <Route path="/forgot-password" element={<ForgotPassword />} />
                                <Route path="/reset-password" element={<ResetPassword />} />
                                <Route path="/auth-callback" element={<AuthCallback />} />
                                <Route path="/restaurant-selection" element={<RestaurantSelectionPage />} />

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

                                {/* Fallback */}
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </Suspense>
                    </FoodDataProvider>
                </LikesProvider>
            </CartProvider>
        </RestaurantProvider>
    );
};

export default CustomerApp;
