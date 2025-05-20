import React from 'react';
<<<<<<< HEAD
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Opening from './customer/Pages/Opening/opening';
import Homepaget from './customer/Pages/HomePage/HomePaget';
import BestSellerPage from './customer/Pages/BestSellerPage';
import LoginPage from './customer/Pages/LoginPage';
import { CartProvider } from './customer/components/CartContent';
import "@fontsource/league-spartan";
import OnboardingScreen from './customer/Pages/Opening/onboardingScreen';
import SignupPage from './customer/Pages/SignupPage';
import { LikesProvider } from './customer/components/LikesContent';
import LikedItemsPage from './customer/Pages/LikedItemsPage';
import AdminPage from './customer/Pages/AdminPage';
import MyOrders from './customer/Pages/MyOrders';
import OrderConfirmation from './customer/Pages/OrderConfirmation';
import PaymentPage from './customer/Pages/PaymentPage';
const App = () => {
  return (
    <CartProvider>
    <LikesProvider>
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<Opening />} />
          <Route path="/skip1" element={<OnboardingScreen />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/home" element={<Homepaget />} />
          <Route path="/best-sellers" element={<BestSellerPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/liked-items" element={<LikedItemsPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/Myorder" element={<MyOrders/>}/>
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
    </LikesProvider>
    </CartProvider>
=======
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
                element={
                  <AuthWrapper>
                    <Homepage/>
                  </AuthWrapper>
                } 
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
>>>>>>> 9c8bca8baaeafffc07b4d6e70921de234e163488
  );
};

export default App;