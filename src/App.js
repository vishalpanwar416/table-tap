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
import PrfilePage from '../src/Pages/customer/ProfilePage';
import AdminDashboard from '../src/Pages/admin/adminDashboard';
import CompleteProfile from '../src/Pages/auth/CompleteProfile';
import AuthWrapper from '../src/config/AuthWrapper';
import ForgotPassword from '../src/Pages/auth/ForgotPassward';
import ResetPassword from '../src/Pages/auth/ResetPassword';
import OrderConfirmationPage from  '../src/Pages/customer/OrderConfirmationPage'
import QRGeneratorPage from '../src/Pages/QR';
import { OrderProvider } from './context/OrderContext';
import { AuthProvider } from './config/AuthContext';
import OrderTracking from '../src/Pages/customer/OrderTracking';
import { AdminNotificationProvider } from './context/AdminNotificationContext';
import { RestaurantProvider } from './context/RestaurantContext';

const App = () => {
  return (
    <AuthProvider>
      <RestaurantProvider>
      <CartProvider>
        <LikesProvider>
          <OrderProvider>
            <Routes>
              <Route path="/" element={<Opening />} />
              <Route path="/skip1" element={<OnboardingScreen />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<AuthWrapper publicOnly><ForgotPassword/></AuthWrapper>} />
              <Route path="/reset-password" element={<AuthWrapper publicOnly><ResetPassword /></AuthWrapper>} />
              <Route 
                path="/home" 
                element={<Homepage />} 
              />
              <Route path="/test" element={<div className="text-white">Test route working!</div>} />
              <Route path="/best-sellers" element={<BestSellerPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/complete-profile" element={<CompleteProfile />} />
              <Route path="/liked-items" element={<LikedItemsPage />} />
              <Route 
                path="/admindashboard" 
                element={
                  <AuthWrapper>
                    <AdminNotificationProvider>
                      <AdminDashboard />
                    </AdminNotificationProvider>
                  </AuthWrapper>
                }
              />
              <Route path="/profile" element={<PrfilePage />} />
              <Route 
                path="/my-orders" 
                element={
                  <AuthWrapper>
                    <MyOrders />
                  </AuthWrapper>
                }
              />
              <Route path="/order-confirmation" element={<OrderConfirmation />} />
              <Route path="/payment" element={<PaymentPage />} />
              <Route path="/order-success" element={<OrderConfirmationPage />} />
              {/* Add the missing route for order tracking */}
              <Route 
                  path="/order-tracking/:id" 
                  element={
                  <AuthWrapper>
                    <OrderTracking />
                  </AuthWrapper>
                }
              />
              <Route path="/qr" element={<QRGeneratorPage />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </OrderProvider>
        </LikesProvider>
      </CartProvider>
      </RestaurantProvider>
    </AuthProvider>
  );
};

export default App;