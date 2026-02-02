# Table Tap App – Routing (Subdomain vs Path-Based)

## Overview

| Environment | URL pattern | Pathname seen by app |
|-------------|-------------|----------------------|
| **Production (subdomains)** | app.table-tap.in, restaurant.table-tap.in, admin.table-tap.in | Root-relative: `/`, `/login`, `/dashboard`, `/panel` |
| **Development (localhost)** | localhost:3000, localhost:3000/restaurant/*, localhost:3000/admin/* | Path-prefixed: `/login` (customer), `/restaurant/login`, `/admin/login` |

## How it works

### App.js (top level)

- **Production:** Chooses app by subdomain (`getSubdomain()`). Pathname is always root-relative (`/login`, `/home`, etc.).
- **Development:** Chooses app by path:
  - `/auth-callback` → AuthCallback
  - `/restaurant/*` → RestaurantApp
  - `/admin/*` → AdminApp
  - `/*` → CustomerApp

### CustomerApp (app / default subdomain)

- **Production:** app.table-tap.in → pathname `/`, `/login`, `/home`, etc.
- **Development:** localhost:3000/login → pathname `/login` (no prefix).
- Uses **index** for root so only `/` matches Opening; **path="/login/*"** etc. so `/login` and `/login/` both match.
- **FallbackRedirect:** If the catch-all `*` matches an auth path (e.g. `/login/`), it renders the correct page instead of redirecting to `/`.

### RestaurantApp (restaurant subdomain)

- **Production:** restaurant.table-tap.in → pathname `/`, `/login`, `/dashboard`.
- **Development:** localhost:3000/restaurant/login → browser pathname is `/restaurant/login`; **effective location** passed to `<Routes>` strips `/restaurant`, so pathname used for matching is `/login`.
- **BasePathProvider** with segment `/restaurant`: in dev, `useBasePathNavigate()` prepends `/restaurant` so `navigate('/')` goes to `/restaurant`.
- **RestaurantFallbackRedirect:** Same idea as CustomerApp – auth paths never redirect to `/`; they render the right page.
- **RestaurantLoginPage** uses `useBasePathNavigate()` and `navigate('/')` so dashboard works in both prod and dev.

### AdminApp (admin subdomain)

- **Production:** admin.table-tap.in → pathname `/`, `/login`, `/panel`.
- **Development:** localhost:3000/admin/login → effective location pathname is `/login`.
- **BasePathProvider** with segment `/admin`; **useEffectiveLocation('/admin')** and **AdminFallbackRedirect** work like RestaurantApp.

## Auth callback

- **Production:** Use `/auth-callback` on the same subdomain (e.g. restaurant.table-tap.in/auth-callback). App.js treats `/auth-callback`, `/restaurant/auth-callback`, and `/admin/auth-callback` the same and renders AuthCallback.
- **Development:** Use `/auth-callback`, `/restaurant/auth-callback`, or `/admin/auth-callback` so the correct app receives the callback.

## Key files

- `App.js` – Top-level routing (subdomain vs path-based).
- `subdomainRouter.js` – `getSubdomain()`, `isDevelopment()`, `getBasePath()`.
- `BasePathContext.jsx` – `useEffectiveLocation()`, `useBasePathNavigate()`, `BasePathProvider`.
- `CustomerApp.jsx` – index + path/* + FallbackRedirect.
- `RestaurantApp.jsx` – effective location + BasePathProvider + fallback.
- `AdminApp.jsx` – same pattern as RestaurantApp.

## Dev: internal links in restaurant/admin

For correct behavior in dev, components under RestaurantApp or AdminApp should use **useBasePathNavigate()** (and optionally a base-path-aware Link) so navigations stay under `/restaurant` or `/admin`. RestaurantLoginPage already uses this.
