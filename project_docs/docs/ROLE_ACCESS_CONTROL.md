# Role-Based Access Control (RBAC) - Restaurant Dashboard

This document outlines the access levels and permissions for different user roles within the Restaurant Dashboard of the Table Tap application.

The system supports the following roles: **Admin, Owner, Manager, Captain, Chef, Waiter, and Cashier**.

## 1. Full Access Roles
These roles have comprehensive access to all features, including administrative settings, staff management, and financial analytics.

**Roles:** `Owner`, `Admin`, `Manager`

### Accessible Modules:
*   **Dashboard**: Full overview, revenue metrics, and analytics.
*   **Floor Planner**: Create and manage floor layouts and tables.
*   **Menu Management**: Create, edit, delete categories and food items.
*   **Order Management**: View and manage all orders (Dine-in, Takeaway, Delivery).
*   **Inventory Management**: Track stock levels, ingredients, and suppliers.
*   **Staff Management**: Add, edit, and remove staff members; assign roles.
*   **Offers & Promotions**: Create and manage discount coupons and special offers.
*   **QR Management**: Generate, download, and print QR codes for tables.
*   **Restaurant Information**: Edit restaurant details, branding, logos, and taxes.
*   **Activity Logs**: View audit trails of system actions.
*   **Aggregators**: (If enabled) Manage Swiggy/Zomato integrations.
*   **AI Analytics**: (If enabled) Access advanced AI-driven insights.

> **Note for Owners:** Owners with multiple restaurants gain access to an **"All Restaurants"** view for aggregate analytics.

---

## 2. Restricted Access Roles
These roles have access tailored to their specific operational duties.

### 👮 Captain
**Focus:** Floor operations, table management, flow of service.

| Module | Description |
| :--- | :--- |
| **Dashboard** | View active tables and operational metrics. |
| **Floor Planner** | Manage table status (occupied, reserved, free). |
| **Menu Management** | Mark items active/inactive (86ing items). |
| **Order Management** | Place, modify, and track orders for any table. |
| **QR Management** | Reprint QR codes if needed for a table. |

### 👨‍🍳 Chef
**Focus:** Kitchen operations, order preparation, stock availability.

| Module | Description |
| :--- | :--- |
| **Kitchen Orders** | Specialized view of Order Management focused on pending/preparing items. |
| **Menu Management** | Quickly toggle item availability (Out of Stock). |
| **Inventory Management** | Request stock replenishment, view ingredient levels. |

### 💁 Waiter
**Focus:** Guest service, order taking.

| Module | Description |
| :--- | :--- |
| **Dashboard** | Simple view of assigned tables/orders. |
| **Floor Planner** | View table status. |
| **Menu Management** | View menu items (Read-only or limited availability toggling). |
| **Order Management** | Place and update orders for assigned tables. |

### 💵 Cashier
**Focus:** Payments, billing, reconciliation.

| Module | Description |
| :--- | :--- |
| **Dashboard** | Revenue focused view. |
| **Order Management** | Process payments, print receipts, settle orders. |
| **Offers & Promotions** | Apply active coupons or discounts to bills. |
| **Activity Logs** | View transaction logs for reconciliation. |

---

## 3. Access Matrix Summary

| Feature / Module | Owner/Admin/Manager | Captain | Chef | Waiter | Cashier |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Dashboard** | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Settings (Rest. Info)** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Staff Management** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Floor Planner** | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Menu Management** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Order Management** | ✅ | ✅ | ✅* | ✅ | ✅ |
| **Inventory** | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Offers & Promos** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **QR Management** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Activity Logs** | ✅ | ❌ | ❌ | ❌ | ✅ |

*\*Chef has a specialized "Kitchen Orders" view.*
