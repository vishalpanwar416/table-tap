-- Supabase RLS baseline for Table-Tap-QR
-- Applies multi-tenant protections to core tables:
-- - restaurants
-- - restaurant_staff
-- - orders
-- - profiles
--
-- Notes:
-- - Run in Supabase SQL editor (or via CLI db push) with a privileged role.
-- - Adjust UUID types if your ids are not uuid.
-- - If a table/column name differs in your schema, edit accordingly.

begin;

-- -----------------------------
-- Helper functions
-- -----------------------------

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.profile_role = 'admin'
  );
$$;

create or replace function public.current_restaurant_id()
returns uuid
language sql
stable
as $$
  select rs.restaurant_id
  from public.restaurant_staff rs
  where rs.user_id = auth.uid()
    and rs.connected = true
  limit 1;
$$;

create or replace function public.can_manage_restaurant(rid uuid)
returns boolean
language sql
stable
as $$
  select
    public.is_platform_admin()
    or exists (
      select 1
      from public.restaurant_staff rs
      where rs.user_id = auth.uid()
        and rs.connected = true
        and rs.restaurant_id = rid
        and rs.staff_role in ('manager','captain')
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.profile_role in ('manager','captain')
    );
$$;

-- -----------------------------
-- restaurants
-- -----------------------------

alter table public.restaurants enable row level security;

drop policy if exists restaurants_admin_read_all on public.restaurants;
create policy restaurants_admin_read_all
on public.restaurants for select
using (public.is_platform_admin());

drop policy if exists restaurants_staff_read_own on public.restaurants;
create policy restaurants_staff_read_own
on public.restaurants for select
using (id = public.current_restaurant_id());

drop policy if exists restaurants_manage_update on public.restaurants;
create policy restaurants_manage_update
on public.restaurants for update
using (public.can_manage_restaurant(id))
with check (public.can_manage_restaurant(id));

-- Optional: only admins can insert restaurants (platform action)
drop policy if exists restaurants_admin_insert on public.restaurants;
create policy restaurants_admin_insert
on public.restaurants for insert
with check (public.is_platform_admin());

-- -----------------------------
-- restaurant_staff
-- -----------------------------

alter table public.restaurant_staff enable row level security;

drop policy if exists staff_admin_read_all on public.restaurant_staff;
create policy staff_admin_read_all
on public.restaurant_staff for select
using (public.is_platform_admin());

drop policy if exists staff_read_own_restaurant on public.restaurant_staff;
create policy staff_read_own_restaurant
on public.restaurant_staff for select
using (restaurant_id = public.current_restaurant_id());

drop policy if exists staff_manage_insert on public.restaurant_staff;
create policy staff_manage_insert
on public.restaurant_staff for insert
with check (public.can_manage_restaurant(restaurant_id));

drop policy if exists staff_manage_update on public.restaurant_staff;
create policy staff_manage_update
on public.restaurant_staff for update
using (public.can_manage_restaurant(restaurant_id))
with check (public.can_manage_restaurant(restaurant_id));

drop policy if exists staff_manage_delete on public.restaurant_staff;
create policy staff_manage_delete
on public.restaurant_staff for delete
using (public.can_manage_restaurant(restaurant_id));

-- -----------------------------
-- orders
-- -----------------------------

alter table public.orders enable row level security;

drop policy if exists orders_admin_read_all on public.orders;
create policy orders_admin_read_all
on public.orders for select
using (public.is_platform_admin());

drop policy if exists orders_restaurant_read_own on public.orders;
create policy orders_restaurant_read_own
on public.orders for select
using (restaurant_id = public.current_restaurant_id());

-- Allow users to read their own orders (CRITICAL for My Orders page)
drop policy if exists orders_user_read_own on public.orders;
create policy orders_user_read_own
on public.orders for select
using (user_id = auth.uid());

-- Baseline: authenticated users can insert orders.
-- If you support guest/anonymous ordering, move inserts to an Edge Function using service_role
-- (or create dedicated anon policies with careful constraints).
drop policy if exists orders_insert_authenticated on public.orders;
create policy orders_insert_authenticated
on public.orders for insert
with check (auth.uid() is not null);

drop policy if exists orders_update_by_restaurant_staff on public.orders;
create policy orders_update_by_restaurant_staff
on public.orders for update
using (restaurant_id = public.current_restaurant_id())
with check (restaurant_id = public.current_restaurant_id());

-- Optional hardening: prevent non-admins from changing payment_status directly.
create or replace function public.block_payment_status_update()
returns trigger
language plpgsql
as $$
begin
  if (new.payment_status is distinct from old.payment_status)
     and not public.is_platform_admin() then
    raise exception 'Not allowed to change payment_status';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_block_payment_status_update on public.orders;
create trigger trg_block_payment_status_update
before update on public.orders
for each row
execute function public.block_payment_status_update();

-- -----------------------------
-- profiles
-- -----------------------------

alter table public.profiles enable row level security;

drop policy if exists profiles_read_own on public.profiles;
create policy profiles_read_own
on public.profiles for select
using (id = auth.uid());

-- Allow users to insert their own profile (needed for signup)
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
on public.profiles for insert
with check (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists profiles_admin_read_all on public.profiles;
create policy profiles_admin_read_all
on public.profiles for select
using (public.is_platform_admin());

-- -----------------------------
-- Storage: avatars bucket
-- -----------------------------

-- Drop old policies
drop policy if exists "Users can read their own avatar" on storage.objects;
drop policy if exists "Users can upload their avatar" on storage.objects;

-- 1. Anyone can read the default avatar (no auth required)
drop policy if exists avatars_read_default on storage.objects;
create policy avatars_read_default
on storage.objects for select
using (bucket_id = 'avatars' and name = 'default.jpg');

-- 2. Authenticated users can read all avatars (public profile photos)
drop policy if exists avatars_read_all on storage.objects;
create policy avatars_read_all
on storage.objects for select
using (bucket_id = 'avatars' and auth.role() = 'authenticated');

-- 3. Users can upload to their own folder only (profile-photos/{user_id}/*)
drop policy if exists avatars_insert_own on storage.objects;
create policy avatars_insert_own
on storage.objects for insert
with check (
  bucket_id = 'avatars' 
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = 'profile-photos'
  and (storage.foldername(name))[2] = auth.uid()::text
);

-- 4. Users can update their own photos only
drop policy if exists avatars_update_own on storage.objects;
create policy avatars_update_own
on storage.objects for update
using (
  bucket_id = 'avatars'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = 'profile-photos'
  and (storage.foldername(name))[2] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = 'profile-photos'
  and (storage.foldername(name))[2] = auth.uid()::text
);

-- 5. Users can delete their own photos only
drop policy if exists avatars_delete_own on storage.objects;
create policy avatars_delete_own
on storage.objects for delete
using (
  bucket_id = 'avatars'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = 'profile-photos'
  and (storage.foldername(name))[2] = auth.uid()::text
);

commit;

