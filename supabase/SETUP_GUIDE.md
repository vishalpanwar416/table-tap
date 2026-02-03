# TableTap - Complete Supabase Backend Setup Guide

This guide will help you create a complete replica of the TableTap Supabase backend in a new Supabase project.

## 📋 Prerequisites

- A Supabase account
- A new (or existing) Supabase project
- Access to Supabase SQL Editor
- Your API keys (Razorpay, Resend, etc.)

## 🚀 Quick Setup (5 Minutes)

### Step 1: Create New Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Fill in:
   - **Name**: TableTap (or any name)
   - **Database Password**: Save this securely!
   - **Region**: Choose closest to your users
4. Wait for project to be created (~2 minutes)

### Step 2: Run Complete Setup Script

1. Navigate to **SQL Editor** in your Supabase project
2. Click **"New Query"**
3. Copy the contents of `COMPLETE_SETUP.sql`
4. Paste into the SQL Editor
5. Click **"Run"**
6. Wait for completion (should succeed with no errors)

**✅ Done!** All tables, functions, triggers, and RLS policies are now created.

### Step 3: Create Storage Bucket

The SQL script cannot create storage buckets, so you need to do this manually:

1. Go to **Storage** in your Supabase Dashboard
2. Click **"Create a new bucket"**
3. Name it: `avatars`
4. Make it **Private** (uncheck "Public bucket")
5. Click **"Create bucket"**

The storage policies are already created by the SQL script!

### Step 4: Upload Default Avatar (Optional)

1. In the `avatars` bucket, click **"Upload"**
2. Upload a file named `default.jpg` (this will be the default user avatar)
3. This file is publicly accessible as defined in RLS policies

### Step 5: Update API Keys

Update your API keys in the `system_settings` table:

```sql
-- Update Razorpay keys
UPDATE public.system_settings
SET value = jsonb_set(value, '{key_id}', '"rzp_live_YOUR_KEY_ID"')
WHERE key = 'razorpay_keys';

UPDATE public.system_settings
SET value = jsonb_set(value, '{key_secret}', '"YOUR_KEY_SECRET"')
WHERE key = 'razorpay_keys';

-- Update Resend email
UPDATE public.system_settings
SET value = jsonb_set(value, '{api_key}', '"re_YOUR_RESEND_API_KEY"')
WHERE key = 'resend_config';

UPDATE public.system_settings
SET value = jsonb_set(value, '{from_email}', '"noreply@yourdomain.com"')
WHERE key = 'resend_config';
```

### Step 6: Configure Google OAuth (Frontend Auth)

1. Go to **Authentication** → **Providers**
2. Enable **Google**
3. Add your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
4. Add authorized redirect URLs:
   - `https://your-project.supabase.co/auth/v1/callback`
   - `http://localhost:3000` (for development)

### Step 7: Get Your Supabase Credentials

1. Go to **Project Settings** → **API**
2. Copy these values (you'll need them in your `.env` file):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon/Public Key**: `eyJhbGc...` (long string)

### Step 8: Update Your Local `.env` File

Create/update `.env` in your `table-tap-app` directory:

```bash
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Other configs
REACT_APP_ENVIRONMENT=production
```

## ✅ Verification

Run these queries to verify everything is set up correctly:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Expected tables:
-- - food_items
-- - invoices
-- - orders
-- - profiles
-- - restaurant_staff
-- - restaurants
-- - subscription_history
-- - subscriptions
-- - system_settings

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
-- All should have rowsecurity = true

-- Check functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION';

-- Expected functions:
-- - is_platform_admin
-- - current_restaurant_id
-- - can_manage_restaurant
-- - generate_invoice_number
-- - update_modified_column
-- - block_payment_status_update
-- - create_invoice_on_payment

-- Check storage bucket
SELECT * FROM storage.buckets WHERE name = 'avatars';
```

## 📊 Database Schema Overview

### Core Tables

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `profiles` | User accounts | Extends auth.users, stores roles |
| `restaurants` | Restaurant data | Multi-tenant isolation, active status |
| `subscriptions` | Active plans | SaaS billing, status tracking |
| `subscription_history` | Billing history | Payment records, plan changes |
| `restaurant_staff` | Staff-restaurant link | Role-based access |
| `food_items` | Menu items | Per-restaurant menus |
| `orders` | Customer orders | Payment tracking, order status |
| `invoices` | Generated invoices | Auto-created on payments |
| `system_settings` | App configuration | API keys, landing page content |

### Security Model

**Multi-Tenant RLS Architecture:**
- Each restaurant's data is isolated
- Staff can only see their restaurant's data
- Platform admins can see everything
- Customers can see their own orders
- Public can view active restaurants with valid subscriptions

### Helper Functions

```sql
is_platform_admin()           -- Check if user is admin
current_restaurant_id()        -- Get user's restaurant ID
can_manage_restaurant(rid)     -- Check manage permissions
generate_invoice_number()      -- Auto-generate TT-YYYYMM-XXXXX
```

## 🔧 Common Operations

### Create First Admin User

```sql
-- After signing up via the app, promote a user to admin
UPDATE public.profiles
SET profile_role = 'admin'
WHERE email = 'your-email@example.com';
```

### Create Test Restaurant

```sql
-- Insert test restaurant
INSERT INTO public.restaurants (
    name,
    description,
    cuisine_type,
    address,
    city,
    state,
    contact_email,
    contact_phone,
    is_active
) VALUES (
    'Test Restaurant',
    'A test restaurant for development',
    'Multi-cuisine',
    '123 Test Street',
    'Mumbai',
    'Maharashtra',
    'test@restaurant.com',
    '+91 9876543210',
    true
) RETURNING id;

-- Create active subscription for the restaurant
INSERT INTO public.subscriptions (
    restaurant_id,
    plan_name,
    billing_cycle,
    base_price,
    final_price,
    status,
    start_date,
    end_date
) VALUES (
    'YOUR_RESTAURANT_ID_FROM_ABOVE',
    'professional',
    'monthly',
    999.00,
    999.00,
    'active',
    NOW(),
    NOW() + INTERVAL '30 days'
);
```

### Link Staff to Restaurant

```sql
-- Add a user as restaurant manager
INSERT INTO public.restaurant_staff (
    user_id,
    restaurant_id,
    staff_role,
    connected
) VALUES (
    'USER_UUID_FROM_PROFILES',
    'RESTAURANT_UUID',
    'manager',
    true
);
```

## 🔐 Security Best Practices

### ✅ Already Implemented

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Multi-tenant data isolation
- ✅ Payment status changes locked to admins only
- ✅ Storage access controlled per user
- ✅ Helper functions for permission checks

### ⚠️ Important Notes

1. **API Keys**: Never commit actual API keys to git
2. **Service Role Key**: Keep your service_role key secret (server-side only)
3. **Database Password**: Store securely, needed for direct connections
4. **RLS Testing**: Always test RLS policies with different user roles

## 🧪 Testing Your Setup

### Test 1: Public Access (No Auth)

```sql
-- Should return only active restaurants with valid subscriptions
SET role anon;
SELECT * FROM public.restaurants;
```

### Test 2: Customer Access

```sql
-- Login as customer, should see own orders only
SET role authenticated;
SET request.jwt.claims.sub = 'user-uuid-here';
SELECT * FROM public.orders;
```

### Test 3: Restaurant Staff Access

```sql
-- Should see only their restaurant's data
SET role authenticated;
SET request.jwt.claims.sub = 'staff-user-uuid';
SELECT * FROM public.orders;
SELECT * FROM public.food_items;
```

### Test 4: Admin Access

```sql
-- Should see everything
SET role authenticated;
SET request.jwt.claims.sub = 'admin-user-uuid';
SELECT * FROM public.restaurants;
SELECT * FROM public.orders;
```

## 🆘 Troubleshooting

### Issue: SQL Script Fails

**Solution**: Make sure you're running on a fresh database or that conflicting objects are dropped first.

### Issue: RLS Blocking All Access

**Solution**: Check if user has correct role in profiles table:
```sql
SELECT * FROM public.profiles WHERE id = auth.uid();
```

### Issue: Storage Upload Fails

**Solution**: Verify bucket exists and RLS policies are applied:
```sql
SELECT * FROM storage.buckets;
SELECT * FROM pg_policies WHERE tablename = 'objects';
```

### Issue: Invoice Not Auto-Generated

**Solution**: Check if trigger exists and subscription_history insert has amount_paid > 0:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'trigger_create_invoice_on_payment';
```

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/sql-createtrigger.html)

## 🔄 Migration Management

### Creating New Migrations

When you make schema changes, create a new migration file:

```bash
# Inside /supabase/migrations/
# Format: YYYYMMDD_description.sql

# Example:
touch 20260204_add_ratings_table.sql
```

### Running Migrations Manually

You can run migrations one by one in the SQL Editor, or use Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

## 🎉 Setup Complete!

Your TableTap Supabase backend is now fully configured and ready to use!

**Next Steps:**
1. Update your frontend `.env` with new Supabase credentials
2. Test authentication flow
3. Create your first restaurant
4. Start accepting orders!

For questions or issues, please refer to the project documentation or create an issue on GitHub.

---

**Last Updated**: Feb 2026  
**Version**: 1.0  
**Database Version**: PostgreSQL 15.x via Supabase
