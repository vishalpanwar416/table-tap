## Apply RLS policies (security hardening)

This repo includes a baseline Supabase Row Level Security (RLS) setup in:

- `supabase/rls_policies.sql`

### How to apply

1. Open your Supabase project dashboard → **SQL Editor**
2. Paste the contents of `supabase/rls_policies.sql`
3. Run it

### Important notes

- These policies assume:
  - `profiles.id = auth.uid()`
  - `profiles.profile_role` includes `admin | manager | captain | waiter | chef | cashier`
  - `restaurant_staff` includes `user_id`, `restaurant_id`, `staff_role`, `connected`
  - `orders.restaurant_id` exists
- If your column types differ (e.g., restaurant ids aren’t `uuid`), update the helper function signatures.

### Best-practice guidance (recommended)

- **Guest/anonymous ordering**:
  - The “most secure” approach is: **do not allow anonymous direct inserts into `orders`**.
  - Instead, create an **Edge Function** (e.g. `create-order`) that:
    - validates required fields (restaurant id/table number/items totals)
    - rate limits (or adds CAPTCHA) to reduce abuse
    - inserts the order using `service_role` (bypasses RLS safely)
  - If you keep anonymous direct inserts, you must accept higher abuse risk (spam orders).

- **Payments**:
  - The included trigger blocks non-admins changing `payment_status`.
  - Best practice is to move all “paid/captured” transitions to a server path (webhook/edge function),
    and keep the client restricted to “pending” creation only.

