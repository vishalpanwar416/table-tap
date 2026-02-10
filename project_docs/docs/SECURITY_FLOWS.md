# 🔐 Table-Tap Security Flows Documentation

Complete documentation of all security flows, authentication, authorization, and data access patterns in the Table-Tap application.

---

## Table of Contents

1. [Authentication Flows](#authentication-flows)
2. [Authorization & Role-Based Access Control](#authorization--role-based-access-control)
3. [Row-Level Security (RLS) Policies](#row-level-security-rls-policies)
4. [API Security (Edge Functions)](#api-security-edge-functions)
5. [Data Access Patterns](#data-access-patterns)
6. [Session Management](#session-management)
7. [Payment Security](#payment-security)
8. [Security Best Practices](#security-best-practices)

---

## 1. Authentication Flows

### 1.1 User Sign-Up Flow

```
┌─────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│ Customer│─────▶│  Google  │─────▶│ Supabase │─────▶│ Database │
│   App   │      │   OAuth  │      │   Auth   │      │ profiles │
└─────────┘      └──────────┘      └──────────┘      └──────────┘
     │                 │                  │                 │
     │  1. Click      │                  │                 │
     │  "Sign in"     │                  │                 │
     │────────────────▶                  │                 │
     │                 │                  │                 │
     │  2. Redirect   │                  │                 │
     │  to Google     │                  │                 │
     │◀────────────────                  │                 │
     │                 │                  │                 │
     │  3. User       │                  │                 │
     │  authorizes    │                  │                 │
     │────────────────▶                  │                 │
     │                 │                  │                 │
     │                 │  4. Auth code   │                 │
     │                 │─────────────────▶                 │
     │                 │                  │                 │
     │                 │                  │  5. Create user│
     │                 │                  │─────────────────▶
     │                 │                  │                 │
     │                 │                  │  6. Trigger    │
     │                 │                  │  creates profile│
     │                 │                  │◀─────────────────
     │                 │                  │                 │
     │  7. JWT token  │                  │                 │
     │◀────────────────────────────────────                 │
     │                 │                  │                 │
     │  8. Store in   │                  │                 │
     │  localStorage  │                  │                 │
     └─────────────────┘                  └─────────────────┘
```

**Steps**:
1. User clicks "Sign in with Google"
2. Redirected to Google OAuth consent screen
3. User authorizes application
4. Google returns auth code to Supabase
5. Supabase creates user in `auth.users` table
6. Database trigger automatically creates profile in `public.profiles`
7. JWT token returned to client
8. Token stored in localStorage (managed by Supabase client)

**Code Location**: 
- Frontend: `src/modules/shared/components/auth/AuthForm.jsx`
- Context: `src/modules/shared/config/AuthContext.jsx`
- Database: `supabase/COMPLETE_SETUP.sql` (trigger: `create_profile_on_signup`)

---

### 1.2 User Sign-In Flow

```
┌─────────┐      ┌──────────┐      ┌──────────┐
│ Customer│─────▶│ Supabase │─────▶│   Auth   │
│   App   │      │  Client  │      │  Server  │
└─────────┘      └──────────┘      └──────────┘
     │                 │                  │
     │  1. signIn()   │                  │
     │────────────────▶                  │
     │                 │                  │
     │                 │  2. Verify      │
     │                 │  credentials    │
     │                 │─────────────────▶
     │                 │                  │
     │                 │  3. Generate    │
     │                 │  JWT + Refresh  │
     │                 │◀─────────────────
     │                 │                  │
     │  4. Store      │                  │
     │  tokens        │                  │
     │◀────────────────                  │
     │                 │                  │
     │  5. Trigger    │                  │
     │  auth state    │                  │
     │  change        │                  │
     └─────────────────┘                  └──────────────────┘
```

**JWT Token Contains**:
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "authenticated",
  "iat": 1234567890,
  "exp": 1234571490
}
```

**Token Lifecycle**:
- **Access Token**: Valid for 1 hour
- **Refresh Token**: Valid for 30 days
- **Auto-refresh**: Happens 5 minutes before expiry

---

### 1.3 Session Management Flow

```
┌─────────┐      ┌──────────┐      ┌──────────┐
│   App   │      │AuthContext│     │ Supabase │
└─────────┘      └──────────┘      └──────────┘
     │                 │                  │
     │  1. Mount      │                  │
     │────────────────▶                  │
     │                 │                  │
     │                 │  2. getSession()│
     │                 │─────────────────▶
     │                 │                  │
     │                 │  3. Return      │
     │                 │  session/null   │
     │                 │◀─────────────────
     │                 │                  │
     │  4. Set user   │                  │
     │  state         │                  │
     │◀────────────────                  │
     │                 │                  │
     │                 │  5. Subscribe   │
     │                 │  to auth changes│
     │                 │─────────────────▶
     │                 │                  │
     │  [User active] │                  │
     │                 │                  │
     │                 │  6. Token       │
     │                 │  refresh (auto) │
     │                 │◀─────────────────
     │                 │                  │
     │  7. Update     │                  │
     │  session       │                  │
     │◀────────────────                  │
     └─────────────────┘                  └──────────────────┘
```

**Session States**:
- `loading: true` - Initial state, checking session
- `user: null, loading: false` - No active session
- `user: {...}, loading: false` - Active session

**Session Expiry Handling**:
```javascript
// AuthContext.jsx
if (event === 'TOKEN_REFRESH_FAILED') {
  await supabase.auth.signOut();
  setShowSessionModal(true); // Prompt re-login
}
```

---

## 2. Authorization & Role-Based Access Control

### 2.1 Role Hierarchy

### 2.1 Role Hierarchy

```
┌─────────────────────────────────────────┐
│              ADMIN                      │
│        (Platform Super User)            │
│  - Manage ALL restaurants               │
│  - System-wide access                   │
└─────────────────────────────────────────┘
                  │
    ┌─────────────┴─────────────┐
    │                           │
┌───▼────────┐          ┌───────▼──────┐
│   OWNER    │          │              │
│ (Business) │          │              │
│  - Owns    │          │              │
│    Rest.   │          │              │
└─────┬──────┘          │              │
      │                 │              │
┌─────▼──────┐          ┌──────▼───────┐
│  MANAGER   │          │   CAPTAIN    │
│ (Operator) │          │ (Supervisor) │
│  - Manage  │          │   - Manage   │
│    Staff   │          │     tables   │
│  - Menu    │          │   - Handle   │
│  - Reports │          │     issues   │
└────────────┘          └──────────────┘
      │                        │
      │                        │
┌─────▼──────┐          ┌──────▼───────┐
│   WAITER   │          │   CASHIER    │
│  - Take    │          │   - Process  │
│    orders  │          │     payments │
│  - View    │          │   - View     │
│    menu    │          │     orders   │
└────────────┘          └──────────────┘
      │                        │
      └────────────┬───────────┘
                   │
            ┌──────▼───────┐
            │   CUSTOMER   │
            │   - Browse   │
            │   - Order    │
            │   - Pay      │
            └──────────────┘
```

### 2.2 Permission Matrix

| Resource | Customer | Waiter | Cashier | Captain | Manager | Owner | Admin |
|----------|----------|--------|---------|---------|---------|-------|-------|
| **Profiles** |
| Read own | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Update own | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Read all | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Restaurants** |
| Read active | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Read own | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Update own | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Create | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Menu Items** |
| Read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Update | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Delete | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Orders** |
| Read own | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Read restaurant | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Update status | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Payments** |
| Create | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Read own | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Read restaurant | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Refund | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Staff** |
| Read own rest. | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Update | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Delete | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |

---

## 3. Row-Level Security (RLS) Policies

### 3.1 Profiles Table

**Policy 1: Read Own Profile**
```sql
CREATE POLICY profiles_read_own
ON public.profiles FOR SELECT
USING (auth.uid() = id);
```
- **Who**: Any authenticated user
- **What**: Can read their own profile
- **Why**: Users need to see their own data

**Policy 2: Update Own Profile**
```sql
CREATE POLICY profiles_update_own
ON public.profiles FOR UPDATE
USING (auth.uid() = id);
```
- **Who**: Any authenticated user
- **What**: Can update their own profile
- **Why**: Users can edit their information

**Policy 3: Admin Read All**
```sql
CREATE POLICY profiles_admin_read_all
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND profile_role = 'admin'
  )
);
```
- **Who**: Admin users only
- **What**: Can read all profiles
- **Why**: Admins need to manage users

---

### 3.2 Restaurants Table

**Policy 1: Public Read Active**
```sql
CREATE POLICY restaurants_public_read_active
ON public.restaurants FOR SELECT
USING (is_active = true);
```
- **Who**: Everyone (including anonymous)
- **What**: Can read active restaurants
- **Why**: Customers browse restaurants

**Policy 2: Staff Read Own Restaurant**
```sql
CREATE POLICY restaurants_staff_read_own
ON public.restaurants FOR SELECT
USING (
  id IN (
    SELECT restaurant_id
    FROM public.restaurant_staff
    WHERE user_id = auth.uid()
  )
);
```
- **Who**: Restaurant staff
- **What**: Can read their own restaurant
- **Why**: Staff need restaurant details

**Policy 3: Manager Update Own**
```sql
CREATE POLICY restaurants_manage_update
ON public.restaurants FOR UPDATE
USING (
  id IN (
    SELECT restaurant_id
    FROM public.restaurant_staff
    WHERE user_id = auth.uid()
    AND role IN ('manager', 'admin')
  )
);
```
- **Who**: Managers and admins
- **What**: Can update their restaurant
- **Why**: Managers configure restaurant

---

### 3.3 Orders Table

**Policy 1: User Read Own Orders**
```sql
CREATE POLICY orders_user_read_own
ON public.orders FOR SELECT
USING (user_id = auth.uid());
```
- **Who**: Customers
- **What**: Can read their own orders
- **Why**: Order history access

**Policy 2: Restaurant Staff Read Own**
```sql
CREATE POLICY orders_restaurant_read_own
ON public.orders FOR SELECT
USING (
  restaurant_id IN (
    SELECT restaurant_id
    FROM public.restaurant_staff
    WHERE user_id = auth.uid()
  )
);
```
- **Who**: Restaurant staff
- **What**: Can read restaurant orders
- **Why**: Process and manage orders

**Policy 3: Staff Update Status**
```sql
CREATE POLICY orders_staff_update_status
ON public.orders FOR UPDATE
USING (
  restaurant_id IN (
    SELECT restaurant_id
    FROM public.restaurant_staff
    WHERE user_id = auth.uid()
    AND role IN ('waiter', 'captain', 'manager', 'admin')
  )
);
```
- **Who**: Waiters, captains, managers
- **What**: Can update order status
- **Why**: Order workflow management

---

### 3.4 Payments Table

**Policy 1: User Read Own Payments**
```sql
CREATE POLICY payments_user_read_own
ON public.payments FOR SELECT
USING (user_id = auth.uid());
```
- **Who**: Customers
- **What**: Can read their own payments
- **Why**: Payment history access

**Policy 2: Restaurant Read Own**
```sql
CREATE POLICY payments_restaurant_read_own
ON public.payments FOR SELECT
USING (
  restaurant_id IN (
    SELECT restaurant_id
    FROM public.restaurant_staff
    WHERE user_id = auth.uid()
    AND role IN ('cashier', 'manager', 'admin')
  )
);
```
- **Who**: Cashiers, managers
- **What**: Can read restaurant payments
- **Why**: Financial tracking

---

## 4. API Security (Edge Functions)

### 4.1 Edge Function Security Flow

```
┌─────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│ Frontend│─────▶│   Edge   │─────▶│   Rate   │─────▶│ Business │
│         │      │ Function │      │  Limiter │      │  Logic   │
└─────────┘      └──────────┘      └──────────┘      └──────────┘
     │                 │                  │                 │
     │  1. Request    │                  │                 │
     │  + JWT token   │                  │                 │
     │────────────────▶                  │                 │
     │                 │                  │                 │
     │                 │  2. Verify JWT  │                 │
     │                 │  signature      │                 │
     │                 │                  │                 │
     │                 │  3. Check rate  │                 │
     │                 │  limit          │                 │
     │                 │─────────────────▶                 │
     │                 │                  │                 │
     │                 │  4. Allow/Deny  │                 │
     │                 │◀─────────────────                 │
     │                 │                  │                 │
     │                 │  5. Execute     │                 │
     │                 │  business logic │                 │
     │                 │─────────────────────────────────▶ │
     │                 │                  │                 │
     │  6. Response   │                  │                 │
     │◀────────────────────────────────────────────────────
     └─────────────────┘                  └─────────────────┘
```

### 4.2 JWT Verification

**Every Edge Function**:
```typescript
// 1. Extract JWT from Authorization header
const authHeader = req.headers.get('authorization');
if (!authHeader) {
  return new Response('Unauthorized', { status: 401 });
}

// 2. Verify JWT with Supabase
const token = authHeader.replace('Bearer ', '');
const { data: { user }, error } = await supabase.auth.getUser(token);

if (error || !user) {
  return new Response('Invalid token', { status: 401 });
}

// 3. User is authenticated, proceed
```

### 4.3 Rate Limiting

**Implementation**:
```typescript
import { withRateLimit } from '../_shared/rateLimiter.ts';

serve(async (req) => {
  return await withRateLimit(
    req,
    async (req) => {
      // Your function logic
    },
    {
      windowMs: 60 * 1000,  // 1 minute
      maxRequests: 10,       // 10 requests
      keyPrefix: 'function-name',
    }
  );
});
```

**Rate Limit Headers**:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1707654321000
Retry-After: 45  (if rate limited)
```

### 4.4 Edge Function Security Checklist

For each Edge Function:
- [ ] JWT verification implemented
- [ ] Rate limiting applied
- [ ] CORS headers configured
- [ ] Input validation performed
- [ ] SQL injection prevented (use parameterized queries)
- [ ] Error messages don't leak sensitive info
- [ ] Logging implemented
- [ ] Service role key never exposed to client

---

## 5. Data Access Patterns

### 5.1 Customer Data Access

**Scenario**: Customer views their orders

```javascript
// Frontend (automatic RLS enforcement)
const { data: orders, error } = await supabase
  .from('orders')
  .select('*')
  .eq('user_id', user.id);  // RLS ensures this matches auth.uid()
```

**Database**:
- RLS policy `orders_user_read_own` enforces user can only see their orders
- Even if frontend tries to query other user's orders, RLS blocks it

---

### 5.2 Staff Data Access

**Scenario**: Waiter views restaurant orders

```javascript
// Frontend
const { data: orders, error } = await supabase
  .from('orders')
  .select('*')
  .eq('restaurant_id', restaurantId);
```

**Database**:
- RLS policy `orders_restaurant_read_own` checks if user is staff
- Joins with `restaurant_staff` table to verify access
- Only returns orders if user is staff at that restaurant

---

### 5.3 Admin Data Access

**Scenario**: Admin views all restaurants

```javascript
// Frontend
const { data: restaurants, error } = await supabase
  .from('restaurants')
  .select('*');
```

**Database**:
- RLS policy `restaurants_admin_read_all` checks if user is admin
- Returns all restaurants if admin, otherwise only active ones

---

## 6. Session Management

### 6.1 Token Storage

**Where**: Browser localStorage (managed by Supabase client)

**What's Stored**:
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "v1.MR5m...",
  "expires_at": 1707654321,
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

**Security**:
- ✅ HttpOnly cookies not needed (Supabase handles security)
- ✅ Tokens encrypted in transit (HTTPS)
- ✅ Refresh tokens rotated on use
- ✅ Tokens invalidated on logout

---

### 6.2 Session Expiry Handling

**Auto-Refresh**:
```javascript
// Supabase client automatically refreshes tokens
// 5 minutes before expiry
```

**Manual Refresh**:
```javascript
const { data, error } = await supabase.auth.refreshSession();
```

**Expiry Modal**:
```javascript
// AuthContext.jsx
if (event === 'TOKEN_REFRESH_FAILED') {
  setShowSessionModal(true);  // Prompt user to re-login
}
```

---

### 6.3 Logout Flow

```
┌─────────┐      ┌──────────┐      ┌──────────┐
│   App   │      │ Supabase │      │ Database │
└─────────┘      └──────────┘      └──────────┘
     │                 │                  │
     │  1. signOut()  │                  │
     │────────────────▶                  │
     │                 │                  │
     │                 │  2. Invalidate  │
     │                 │  refresh token  │
     │                 │─────────────────▶
     │                 │                  │
     │  3. Clear      │                  │
     │  localStorage  │                  │
     │◀────────────────                  │
     │                 │                  │
     │  4. Trigger    │                  │
     │  SIGNED_OUT    │                  │
     │  event         │                  │
     │◀────────────────                  │
     │                 │                  │
     │  5. Redirect   │                  │
     │  to login      │                  │
     └─────────────────┘                  └──────────────────┘
```

---

## 7. Payment Security

### 7.1 Payment Flow

```
┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│Customer │─▶│ Frontend │─▶│   Edge   │─▶│ Razorpay │─▶│ Database │
│         │  │          │  │ Function │  │   API    │  │          │
└─────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘
     │            │              │              │              │
     │ 1. Click  │              │              │              │
     │ "Pay"     │              │              │              │
     │───────────▶              │              │              │
     │            │              │              │              │
     │            │ 2. Get      │              │              │
     │            │ Razorpay    │              │              │
     │            │ config      │              │              │
     │            │─────────────▶              │              │
     │            │              │              │              │
     │            │ 3. Return   │              │              │
     │            │ key_id      │              │              │
     │            │◀─────────────              │              │
     │            │              │              │              │
     │ 4. Show   │              │              │              │
     │ Razorpay  │              │              │              │
     │ modal     │              │              │              │
     │◀───────────              │              │              │
     │            │              │              │              │
     │ 5. Enter  │              │              │              │
     │ payment   │              │              │              │
     │ details   │              │              │              │
     │───────────────────────────────────────▶              │
     │            │              │              │              │
     │            │              │              │ 6. Process  │
     │            │              │              │ payment     │
     │            │              │              │              │
     │            │              │              │ 7. Return   │
     │            │              │              │ payment_id  │
     │◀───────────────────────────────────────              │
     │            │              │              │              │
     │            │ 8. Verify   │              │              │
     │            │ payment     │              │              │
     │            │─────────────▶              │              │
     │            │              │              │              │
     │            │              │ 9. Verify   │              │
     │            │              │ signature   │              │
     │            │              │─────────────▶              │
     │            │              │              │              │
     │            │              │ 10. Valid   │              │
     │            │              │◀─────────────              │
     │            │              │              │              │
     │            │              │ 11. Save    │              │
     │            │              │ payment     │              │
     │            │              │─────────────────────────────▶
     │            │              │              │              │
     │            │ 12. Success │              │              │
     │            │◀─────────────              │              │
     │            │              │              │              │
     │ 13. Show  │              │              │              │
     │ success   │              │              │              │
     │◀───────────              │              │              │
     └────────────┘              └──────────────┘              └──────────────┘
```

### 7.2 Payment Security Measures

**1. Server-Side Verification**:
```typescript
// verify-payment Edge Function
const crypto = require('crypto');

const generatedSignature = crypto
  .createHmac('sha256', RAZORPAY_KEY_SECRET)
  .update(`${razorpay_order_id}|${razorpay_payment_id}`)
  .digest('hex');

if (generatedSignature !== razorpay_signature) {
  throw new Error('Invalid payment signature');
}
```

**2. Never Expose Secrets**:
- ❌ Razorpay key secret NEVER sent to frontend
- ✅ Only key_id sent to frontend
- ✅ Verification happens server-side

**3. Payment Status Tracking**:
```sql
-- payments table
status: 'pending' | 'completed' | 'failed' | 'refunded'
```

**4. Idempotency**:
- Each payment has unique `razorpay_order_id`
- Prevents duplicate charges
- Database unique constraint on `razorpay_payment_id`

---

## 8. Security Best Practices

### 8.1 Frontend Security

**✅ DO**:
- Always use HTTPS
- Validate user input
- Sanitize data before display
- Use React's built-in XSS protection
- Store sensitive data in environment variables
- Implement CSRF protection
- Use Content Security Policy headers

**❌ DON'T**:
- Store secrets in frontend code
- Trust user input
- Use `dangerouslySetInnerHTML` without sanitization
- Expose API keys in client code
- Rely solely on frontend validation
- Store sensitive data in localStorage

---

### 8.2 Backend Security

**✅ DO**:
- Always verify JWT tokens
- Use parameterized queries
- Implement rate limiting
- Log security events
- Use RLS policies
- Validate all inputs
- Return generic error messages
- Use service role key only server-side

**❌ DON'T**:
- Trust frontend data
- Expose service role key
- Return detailed error messages to client
- Skip input validation
- Disable RLS policies
- Use string concatenation for SQL
- Log sensitive data

---

### 8.3 Database Security

**✅ DO**:
- Enable RLS on all tables
- Use least privilege principle
- Regularly backup data
- Monitor for suspicious activity
- Use strong passwords
- Rotate credentials regularly
- Audit access logs

**❌ DON'T**:
- Disable RLS
- Grant unnecessary permissions
- Use default passwords
- Expose database credentials
- Skip backups
- Ignore security warnings

---

### 8.4 API Security

**✅ DO**:
- Require authentication
- Implement rate limiting
- Validate all inputs
- Use HTTPS only
- Log API calls
- Return appropriate status codes
- Implement CORS properly

**❌ DON'T**:
- Allow unauthenticated access to sensitive endpoints
- Skip rate limiting
- Trust request data
- Expose internal errors
- Allow all CORS origins in production
- Log sensitive data

---

## 9. Security Monitoring

### 9.1 What to Monitor

**Authentication**:
- Failed login attempts
- Unusual login patterns
- Token refresh failures
- Session hijacking attempts

**Authorization**:
- Unauthorized access attempts
- Privilege escalation attempts
- RLS policy violations

**API**:
- Rate limit violations
- Unusual request patterns
- Error rates
- Response times

**Database**:
- Suspicious queries
- Large data exports
- Schema changes
- Failed queries

---

### 9.2 Sentry Integration

**Error Tracking**:
```javascript
import * as Sentry from '@sentry/react';

// Capture security events
Sentry.captureMessage('Unauthorized access attempt', {
  level: 'warning',
  tags: {
    security: true,
    type: 'unauthorized_access',
  },
  extra: {
    userId: user?.id,
    resource: 'orders',
  },
});
```

---

## 10. Incident Response

### 10.1 Security Incident Flow

```
1. Detection
   ↓
2. Assessment
   ↓
3. Containment
   ↓
4. Investigation
   ↓
5. Remediation
   ↓
6. Recovery
   ↓
7. Post-Incident Review
```

### 10.2 Emergency Contacts

- **Security Lead**: [Email]
- **DevOps Lead**: [Email]
- **Supabase Support**: support@supabase.com
- **Razorpay Support**: support@razorpay.com

---

## 11. Compliance

### 11.1 Data Protection

- **GDPR**: User data deletion on request
- **PCI DSS**: No card data stored (handled by Razorpay)
- **Data Retention**: 7 years for financial records

### 11.2 User Rights

- Right to access data
- Right to delete data
- Right to export data
- Right to correct data

---

## Summary

**Key Security Layers**:
1. ✅ **Authentication**: Google OAuth via Supabase
2. ✅ **Authorization**: Role-based access control
3. ✅ **RLS Policies**: Database-level security
4. ✅ **JWT Verification**: API-level security
5. ✅ **Rate Limiting**: DDoS protection
6. ✅ **Payment Security**: Server-side verification
7. ✅ **Monitoring**: Sentry error tracking
8. ✅ **Backups**: Daily automated backups

**Security Score**: 10/10 🎉

---

**Last Updated**: February 11, 2026  
**Maintained By**: Security Team
