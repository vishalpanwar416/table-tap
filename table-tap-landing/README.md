# Table Tap Landing Page 🌐

This is the high-performance, customer-facing landing page for **Table Tap**, built with **Next.js 15** and **App Router**.

## 🚀 Key Features
- **Dynamic Content**: Hero sections, social links, and logos are fetched from Supabase `system_settings`.
- **Live Pricing**: Subscription plans and billing cycles are synchronized directly from the database.
- **Micro-Animations**: Uses Framer Motion for a premium, interactive feel.
- **Performance Optimized**: Achieves near-perfect Lighthouse scores with Next.js image optimization and CSS minification.
- **Glassmorphism UI**: A modern design language tailored for the hospitality industry.

## 🛠️ Environment Variables
For the browser to access Supabase, you **must** use the `NEXT_PUBLIC_` prefix:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 💻 Development
```bash
# Run locally
npm run dev
```

## 🏗️ Deployment
This project is optimized for **Vercel**. 
1. Push your changes to branch `main` or `dev`.
2. Ensure `NEXT_PUBLIC_` environment variables are set in the Vercel Dashboard.
3. Vercel will automatically build and deploy the application.

---
Part of the [Table Tap Monorepo](../README.md).
