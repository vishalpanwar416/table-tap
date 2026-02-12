# TableTap QR - Version 1.0.0 Feature Documentation

## Overview
TableTap QR is a comprehensive restaurant management system that streamlines operations through a customer-facing digital menu app and a powerful backend dashboard for restaurant staff and owners. This document outlines the complete feature set available in Version 1.0.0.

---

## 📱 Customer Application
The customer-facing progressive web app (PWA) designed for seamless ordering.

### Menu & Ordering
- **Smart Digital Menu**: Browse categorized food items with high-quality images and descriptions.
- **Dynamic Search & Filtering**: Real-time search for dishes and filtering by category or dietary preferences.
- **Detailed Item View**: View ingredients, customization options, and special tags (e.g., Bestseller, Spicy).
- **Cart Management**: Add/remove items, adjust quantities, and view real-time order totals.
- **Direct Ordering**: Place orders directly from the table without waiting for staff.
- **Favorites**: "Like" items to save them to a personal "Liked Items" list for quick access.

### User Account & Personalization
- **Secure Authentication**: User signup/login with email and password.
- **User Profile**: Manage personal details and view order history.
- **Address Management**: Save delivery addresses for future orders (if delivery is enabled).

### Payments & Checkout
- **Multiple Payment Methods**: Integration with Razorpay for secure payments (UPI, Credit/Debit Cards, Netbanking).
- **Pay at Restaurant**: Option to pay via cash or card at the counter.
- **Applied Offers**: view and apply active restaurant discounts automatically.

### Engagement
- **Real-time Notifications**: Receive updates on order status (Confirmed, Preparing, Ready).
- **Landing Page**: Promotional landing page showcasing app features and pricing plans.

---

## 👨‍🍳 Restaurant Management Dashboard
A robust control panel for restaurant staff to manage daily operations.

### Operations Management
- **Live Order Dashboard**: Real-time view of incoming orders with audio and visual notifications.
- **Order Processing**: Workflow management (Accept, Prepare, Serve, Complete, Reject) with status updates sent to customers.
- **Table Management (Floor Plan)**: Visual floor plan editor to manage table arrangements and track table status (Occupied, Free, Reserved).
- **QR Code Management**: Generate and manage unique QR codes for each table.

### Menu & Inventory
- **Menu Builder**: Create and edit categories, food items, prices, and descriptions.
- **Inventory Management**: Track stock levels for ingredients or menu items (Stock In/Out).
- **Dynamic Pricing**: Toggle items availability and update prices instantly.
- **Offers & Promotions**: Create and manage special offers and discounts.

### Staff & Roles
- **Role-Based Access Control (RBAC)**: Distinct interfaces and permissions for different staff roles:
    - **Manager**: Full access to all dashboard features.
    - **Captain**: Manage orders and floor plan.
    - **Chef**: Kitchen Display System (KDS) for viewing preparation tasks.
    - **Waiter**: Order taking and table service.
    - **Cashier**: Payment processing and billing.
- **Staff Management**: Add, remove, and update staff profiles and roles.

### Analytics & Reports
- **Dashboard Overview**: Key performance metrics (Total Orders, Revenue, Popular Items).
- **Sales Reports**: Detailed breakdown of sales by day, week, or month.
- **Activity Logs**: Audit trails of staff actions for accountability.
- **AI Analytics**: (Beta) Insights into ordering trends and customer preferences.

### Integration
- **Aggregator Management**: Manage integration keys for third-party food delivery platforms (Zomato, Swiggy).

---

## 🏢 Owner Console
A centralized dashboard for multi-location restaurant owners.

- **Multi-Restaurant Overview**: Monitor performance across all owned restaurant branches from a single screen.
- **Consolidated Billing**: View and manage subscription plans and billing for all restaurant locations.
- **Business Insights**: Aggregate analytics to compare performance between different branches.

---

## ⚙️ Super Admin Panel
Administrative interface for the platform operators (SaaS Management).

- **Restaurant Onboarding**: Register and set up new restaurants on the platform.
- **Subscription Management**: Manage restaurant subscription plans and billing cycles.
- **System Settings**: Configure global platform settings and feature flags.
- **Lead Inquiries**: Track and manage leads from the landing page.

---

## 💻 Technical Highlights
- **Real-time Synchronization**: Powered by Supabase Realtime for instant updates across all devices.
- **Progressive Web App (PWA)**: Installable on mobile devices with offline capabilities.
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop screens.
- **Secure Cloud Infrastructure**: Data hosted securely on the cloud with robust backup and security measures.
- **SEO Optimized**: Server-side rendering (SSR) best practices for better search engine visibility.

---

## Version History
**v1.0.0 (Current Release)**
- Initial production release with core ordering and management features.
- Completed integration of Payment Gateway (Razorpay).
- Finalized multi-role dashboard access.
- Launched customer landing page.
