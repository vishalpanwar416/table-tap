import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Opening from '../src/Pages/shared/opening';
import Homepage from './Pages/HomePage/Homepage';
import BestSellerPage from '../src/Pages/customer/BestSellerPage';
import LoginPage from '../src/Pages/auth/LoginPage';
import { CartProvider } from '../src/config/CartContent';
import "@fontsource/league-spartan";
import OnboardingScreen from '../src/Pages/shared/onboardingScreen';
import SignupPage from '../src/Pages/auth/SignupPage';
import { LikesProvider } from '../src/config/LikesContent';
import LikedItemsPage from '../src/Pages/customer/LikedItemsPage';
import MyOrders from '../src/Pages/customer/MyOrders';
import OrderConfirmation from '../src/Pages/customer/OrderConfirmation';
import PaymentPage from '../src/Pages/customer/PaymentPage';
import ProfilePage from '../src/Pages/customer/ProfilePage';
import AdminDashboard from './Pages/RestaurantManagement/adminDashboard';
import CompleteProfile from '../src/Pages/auth/CompleteProfile';
import AuthWrapper from '../src/config/AuthWrapper';
import ForgotPassword from '../src/Pages/auth/ForgotPassward';
import ResetPassword from '../src/Pages/auth/ResetPassword';
import OrderConfirmationPage from  '../src/Pages/customer/OrderConfirmationPage'
import { OrderProvider } from './context/OrderContext';
import { AuthProvider } from './config/AuthContext';
import OrderTracking from '../src/Pages/customer/OrderTracking';
import { ManagerNotificationProvider } from './context/ManagerNotificationContext';
import { RestaurantProvider } from './Pages/Restaurantselection/RestaurantContext';
import AdminPanel from './Pages/AdminPannel/AdminPannel';
import { AdminRestaurantProvider } from './context/AdminRestaurantContext';
import RestaurantSelectionPage from './Pages/Restaurantselection/RestaurantSelectionPage';
import RestaurantSelectionWrapper from './Pages/Restaurantselection/RestaurantSelectionWrapper';
import AuthCallback from './Pages/auth/AuthCallback';
import { NotificationProvider } from './context/NotificationContext';
import InstallPrompt from './components/InstallPrompt';
import { register } from './utils/serviceWorkerRegistration';
import ErrorBoundary from './components/ErrorBoundary';
import { FoodDataProvider } from './context/FoodDataContext';
import ContactUsPage from '../src/Pages/customer/ContactUsPage';
import HelpFAQPage from '../src/Pages/customer/HelpFAQPage';

// Register service worker
register();

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <ManagerNotificationProvider>
            <RestaurantProvider>
              <OrderProvider>
                <AdminRestaurantProvider>
                  <CartProvider>
                    <LikesProvider>
                      <FoodDataProvider>
                        <div className="min-h-screen bg-gray-100">
                          <Routes>
                            <Route path="/" element={<Opening />} />
                            <Route path="/skip1" element={<OnboardingScreen />} />
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/forgot-password" element={<AuthWrapper publicOnly><ForgotPassword/></AuthWrapper>} />
                            <Route path="/reset-password" element={<AuthWrapper publicOnly><ResetPassword /></AuthWrapper>} />
                            <Route path="/signup" element={<SignupPage />} />
                            <Route path="/complete-profile" element={<CompleteProfile />} />
                            <Route path="/auth-callback" element={<AuthCallback />} />
                            <Route path="/restaurant-selection" element={<RestaurantSelectionPage />} />
                            
                            {/* Protected routes that need restaurant selection */}
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
                                <RestaurantSelectionWrapper>
                                  <MyOrders />
                                </RestaurantSelectionWrapper>
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
                                <RestaurantSelectionWrapper>
                                  <ProfilePage />
                                </RestaurantSelectionWrapper>
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
                            
                            {/* Admin routes */}
                            <Route 
                              path="/managerdashboard" 
                              element={
                                <AuthWrapper>
                                  <AdminRestaurantProvider>
                                    <ManagerNotificationProvider>
                                      <AdminDashboard />
                                    </ManagerNotificationProvider>
                                  </AdminRestaurantProvider>
                                </AuthWrapper>
                              }
                            />
                            <Route 
                              path="/Admin-Pannel" 
                              element={
                                <AuthWrapper>
                                  <AdminRestaurantProvider>
                                    <ManagerNotificationProvider>
                                      <AdminPanel />
                                    </ManagerNotificationProvider>
                                  </AdminRestaurantProvider>
                                </AuthWrapper>
                              }
                            />
                            
                            <Route path="/test" element={<div className="text-white">Test route working!</div>} />
                          </Routes>
                          
                          {/* Install Prompt */}
                          <InstallPrompt />
                        </div>
                      </FoodDataProvider>
                    </LikesProvider>
                  </CartProvider>
                </AdminRestaurantProvider>
              </OrderProvider>
            </RestaurantProvider>
          </ManagerNotificationProvider>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;