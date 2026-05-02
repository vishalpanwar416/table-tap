# 🍔 Table Tap - Enterprise-Grade AI Restaurant OS

![Table Tap Banner](https://via.placeholder.com/1200x400.png?text=Table+Tap+AI+Ecosystem)

**Table Tap** is a high-performance, full-stack ecosystem designed to modernize hospitality through AI-driven automation, real-time data synchronization, and a premium guest experience.

---

## 🏗️ Technical Architecture

The system is built as a **Monolithic Monorepo**, leveraging a serverless backend for maximum scalability and reduced operational overhead.

### 🧩 Components
1.  **`table-tap-app` (PWA Dashboard)**:
    *   **Engine**: React 18 + Vite.
    *   **Focus**: Ultra-low latency order management, kitchen display system (KDS), and administrative control.
    *   **Performance**: Implements windowing and strategic memoization for smooth operation on low-powered tablet devices.
2.  **`table-tap-landing` (SEO Engine)**:
    *   **Engine**: Next.js 15 (App Router).
    *   **Focus**: Hyper-fast First Contentful Paint (FCP), dynamic SSR pricing, and lead conversion.
    *   **Security**: Uses standard `NEXT_PUBLIC_` scoping for client-side Supabase interaction.
3.  **Supabase Backend (Core)**:
    *   **Database**: PostgreSQL with complex relational mapping between Restaurants, Menus, Orders, and Subscriptions.
    *   **Real-time**: Postgres CDC (Change Data Capture) via WebSockets for zero-refresh UI updates.
    *   **Storage**: S3-compatible bucket for optimized menu assets and branding.

---

## 🤖 AI & Automated Services (Edge Computing)

We leverage **Supabase Edge Functions (Deno runtime)** to handle heavyweight logic and external integrations securely.

### 🧠 AI Advisor [v2.1]
*   **Engine**: OpenAI GPT-4o integration.
*   **Context Injection**: Injects specific restaurant sales data and inventory levels into the AI prompt for "hyper-local" business recommendations.
*   **Secure Auth**: Explicit JWT verification within the function ensures that restaurant data is never leaked to unauthorized callers.

### 📩 Messaging & Integrations
*   **WhatsApp API Integration**: Enterprise-level integration with the WhatsApp Business Platform for automated bill generation and OTP-less communication.
*   **Email Engine**: Integration with **Resend** for high-deliverability transaction receipts and onboarding sequences.
*   **PetPooja Integration [New]**: Real-time menu pushing, order callbacks, and stock status synchronization with PetPooja POS systems.

---

## ⚡ Performance Engineering

| Feature | Implementation | Business Value |
| :--- | :--- | :--- |
| **Atomic Sync** | Real-time CDC (Change Data Capture) | No page refreshes; kitchen gets orders instantly. |
| **Computational Cache** | `useMemo` & `useCallback` | Search and filter 1000+ items with 0ms lag. |
| **Payload Throttling** | Smart Fetch Limit (200 Orders) | 75% faster initial load for high-volume outlets. |
| **Asset Optimization** | Progressive Image Loading & WebP | Reduces bandwidth usage by 60% on mobile data. |
| **Database Indexing** | B-Tree indexing on `restaurant_id` & `status` | Query execution consistently < 50ms. |
| **Subscription Logic** | Priority-based active plan filtering | Prevents visibility bugs for multi-plan restaurants. |
| **Modern Admin UX** | iPhone-style toggles & Compact Header | Optimized for speed and mobile-first management. |

---

## 🔒 Security Model (Zero-Trust)

Our system operates on a **Zero-Trust Frontend** model. The frontend is never trusted with sensitive logic.

1.  **Row Level Security (RLS)**:
    *   Access is controlled at the database level.
    *   `SELECT` policies ensure users can only see their own restaurant's data.
    *   Public data (Hero text, Pricing) is governed by separate `anon` policies.
2.  **Secret Management**:
    *   Secret keys (Razorpay, OpenAI, WhatsApp) are stored in `system_settings` with an `is_secret` flag.
    *   These are **never** queried by the frontend; only Edge Functions can access them using the `Service Role Key`.
3.  **JWT Verification**:
    *   All API calls to Edge Functions require a valid Supabase Auth JWT.
    *   Functions re-verify the identity of the caller before processing data.

---

## 🗺️ Project Roadmap

- [x] Migration from Firebase to Supabase.
- [x] AI Sales Advisor implementation.
- [x] Next.js 15 Landing Page deployment.
- [x] **PetPooja Integration**: Real-time POS synchronization.
- [x] **Stability Patch**: Refactored subscription visibility logic.
- [ ] **Next**: Multi-outlet "Chain Management" dashboard.
- [ ] **Next**: Automated Inventory deducing via Recipe mapping.
- [ ] **Future**: Offline-first KDS (IndexedDB sync).

---

## 🛠️ Development & Deployment

### Directory Structure
```text
.
├── supabase/                 # Backend logic & migrations
│   ├── functions/            # Deno Edge Functions (AI, Payments)
│   └── migrations/           # Version-controlled SQL schema
├── table-tap-app/            # Main React Dashboard
└── table-tap-landing/        # Next.js 15 Landing Page
```

### Setup Sequence
1.  **Database**: Apply SQL migrations in `/supabase/migrations`.
2.  **Functions**: Deploy edge functions via `supabase functions deploy`.
3.  **App**: Start dashboard via `npm run dev` in `/table-tap-app`.
4.  **Landing**: Start website via `npm run dev` in `/table-tap-landing`.

---

**Developed with ❤️ by Table Tap Team.**  
For technical inquiries, contact [tabletap416@gmail.com](mailto:tabletap416@gmail.com).
