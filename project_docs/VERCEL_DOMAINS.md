# Vercel Domain Setup for Table Tap

This repo has **two Vercel projects**:

| Project        | Root directory      | Purpose              | Domain(s) to add                    |
|----------------|---------------------|----------------------|-------------------------------------|
| **Landing**    | `table-tap-landing` | Marketing site       | `table-tap.in` ✅ (already mapped)  |
| **App**        | `table-tap-app`     | SPA (customer, restaurant, admin) | `app.table-tap.in`, `restaurant.table-tap.in`, `admin.table-tap.in` |

Restaurant and admin are **routes inside the same app**; subdomain routing is done in code (`subdomainRouter.js`). All three subdomains must point to the **same** App project deployment.

---

## Add domains for the App project (app.table-tap.in, restaurant, admin)

1. Open [Vercel Dashboard](https://vercel.com/dashboard).
2. Select the project that deploys **table-tap-app** (Root Directory: `table-tap-app`).
3. Go to **Settings → Domains**.
4. Add each domain:
   - **app.table-tap.in**
   - **restaurant.table-tap.in**
   - **admin.table-tap.in**
5. For each domain, Vercel will show DNS instructions. Add the records at your DNS provider (where `table-tap.in` is managed):

   **Option A – CNAME (recommended)**  
   - **Name:** `app` (for app.table-tap.in), `restaurant`, or `admin`  
   - **Value:** `cname.vercel-dns.com`  
   (Or the exact target Vercel shows for that domain.)

   **Option B – A record**  
   - **Name:** same subdomain  
   - **Value:** `76.76.21.21`

6. Wait for DNS to propagate. Vercel will show “Valid Configuration” when ready.
7. Ensure **SSL** is enabled (Vercel does this by default for domains it serves).

---

## Monorepo: set Root Directory per project

If both projects come from this **same repo**:

- **Landing project:** Root Directory = `table-tap-landing`, domain = `table-tap.in`.
- **App project:** Root Directory = `table-tap-app`, domains = `app.table-tap.in`, `restaurant.table-tap.in`, `admin.table-tap.in`.

In Vercel: **Project → Settings → General → Root Directory** → set and save.

---

## Quick checklist

- [ ] Landing project: Root Directory = `table-tap-landing`, domain = `table-tap.in`.
- [ ] App project: Root Directory = `table-tap-app`.
- [ ] App project domains: `app.table-tap.in`, `restaurant.table-tap.in`, `admin.table-tap.in`.
- [ ] DNS CNAME (or A) for each subdomain pointing to Vercel.
- [ ] All domains show “Valid Configuration” and SSL in Vercel.

After this, **table-tap.in** = landing, **app.table-tap.in** = customer app, **restaurant.table-tap.in** = restaurant dashboard, **admin.table-tap.in** = admin panel.
