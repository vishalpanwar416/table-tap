# 📊 Table-Tap Infrastructure - Quick Reference

## 🎯 System Overview
**Type:** Enterprise SaaS Restaurant Management Platform  
**Architecture:** Monolithic Monorepo with Serverless Backend  
**Maturity Score:** 7.1/10 (Production-Ready)

---

## 📦 Applications

### 1. Landing Page (`table-tap-landing`)
- **Tech:** Next.js 16.1.5 + React 19.2.3
- **Domain:** `table-tap.in`
- **Purpose:** Marketing, SEO, Lead Generation
- **Deployment:** Vercel

### 2. Main App (`table-tap-app`)
- **Tech:** React 18.2.0 + Create React App
- **Domains:** 
  - `app.table-tap.in` (Customer)
  - `restaurant.table-tap.in` (Restaurant Dashboard)
  - `admin.table-tap.in` (Admin Panel)
- **Purpose:** Multi-tenant restaurant operations
- **Deployment:** Vercel

---

## 🗄️ Database (Supabase PostgreSQL)

### Core Tables (9)
1. **profiles** - User accounts & roles
2. **restaurants** - Restaurant master data
3. **subscriptions** - Active subscription plans
4. **subscription_history** - Billing audit trail
5. **restaurant_staff** - Staff-restaurant mapping
6. **food_items** - Menu items
7. **orders** - Customer orders
8. **invoices** - Auto-generated invoices
9. **system_settings** - App configuration

### Security
- ✅ Row Level Security (RLS) on all tables
- ✅ Multi-tenant data isolation
- ✅ Zero-trust security model
- ✅ JWT verification on Edge Functions

---

## ⚡ Edge Functions (9)

1. **ai-advisor** - OpenAI GPT-4o business insights
2. **create-user** - User creation with profile setup
3. **delete-user** - User deletion with cleanup
4. **get-payment-config** - Razorpay configuration
5. **payment-alert** - Payment notifications
6. **process-refund** - Razorpay refund processing
7. **send-email** - Resend email integration
8. **send-whatsapp** - WhatsApp Business API
9. **verify-payment** - Razorpay payment verification

---

## 🔌 Third-Party Integrations

| Service | Purpose | Storage |
|---------|---------|---------|
| **Razorpay** | Payment processing | Keys in DB |
| **Resend** | Email delivery | API key in DB |
| **WhatsApp Business** | Messaging | Credentials in DB |
| **OpenAI GPT-4o** | AI insights | API key in DB |
| **Google OAuth** | Authentication | Supabase config |
| **Google Maps API** | Location services, directions | API key in DB (`google_maps_key`) |

---

## 🚀 Deployment

### Vercel Projects
- **Landing:** Root dir `table-tap-landing`
- **App:** Root dir `table-tap-app`

### DNS Setup
All subdomains → CNAME → `cname.vercel-dns.com`

### SSL
Automatic via Vercel

---

## 📊 Tech Stack Summary

### Frontend
- React 18.2.0 / 19.2.3
- Next.js 16.1.5
- TailwindCSS 4.x
- Framer Motion 12.x
- React Query 5.83.0
- Recharts 2.15.3

### Backend
- Supabase (PostgreSQL 15.x)
- Deno Edge Functions
- Real-time CDC
- S3-compatible Storage

### Tools
- Create React App 5.0.1
- Webpack Bundle Analyzer
- Concurrently
- ESLint

---

## 🎯 Module Structure

```
table-tap-app/src/modules/
├── customer/     (47 files) - Customer ordering
├── restaurant/   (50 files) - Restaurant dashboard
├── admin/        (44 files) - Platform admin
├── owner/        (5 files)  - Multi-outlet management
└── shared/       (84 files) - Common utilities
```

---

## ⚡ Performance Features

✅ Code splitting & lazy loading  
✅ React Query caching  
✅ React Window virtualization  
✅ Database indexing (B-Tree)  
✅ Real-time CDC sync  
✅ Asset optimization (WebP)  
✅ Memoization (useMemo/useCallback)

---

## 🔒 Security Features

✅ Row Level Security (RLS)  
✅ Multi-tenant isolation  
✅ Zero-trust frontend  
✅ JWT verification  
✅ Secret management in DB  
✅ HTTP security headers  
✅ Payment status protection  
✅ Google OAuth integration

---

## 📈 Scalability

### Strengths
- Serverless auto-scaling
- Multi-tenant architecture
- CDN delivery (Vercel)
- Real-time WebSockets
- Stateless frontend

### Considerations
- Single Supabase instance
- JSONB query performance
- Real-time connection limits
- Edge Function cold starts

---

## 🚨 Priority Recommendations

### Immediate (High Priority)
1. ⚠️ Add monitoring (Sentry, LogRocket)
2. ⚠️ Implement comprehensive testing
3. ⚠️ Document backup/restore procedures
4. ⚠️ Add rate limiting to Edge Functions
5. ⚠️ Conduct security audit

### Medium-Term
6. Add caching layer (Redis)
7. Database optimization (read replicas)
8. Enhanced security (WAF, DDoS protection)
9. API documentation (OpenAPI)

### Long-Term
10. Consider microservices (if needed)
11. Multi-region deployment
12. Advanced analytics (data warehouse)

---

## 📊 Maturity Scores

| Category | Score |
|----------|-------|
| Architecture | 9/10 |
| Security | 9/10 |
| Scalability | 7/10 |
| Performance | 8/10 |
| Monitoring | 4/10 |
| Testing | 3/10 |
| Documentation | 7/10 |
| DevOps | 7/10 |
| Disaster Recovery | 5/10 |

**Overall: 7.1/10** - Production-Ready

---

## 🔗 Key Files

- `README.md` - Project overview
- `INFRASTRUCTURE_ANALYSIS.md` - Detailed analysis (this report)
- `VERCEL_DOMAINS.md` - Domain setup guide
- `supabase/COMPLETE_SETUP.sql` - Complete database schema
- `supabase/SETUP_GUIDE.md` - Backend setup instructions
- `package.json` - Monorepo scripts

---

## 🎓 Best Practices Observed

✅ Monorepo structure  
✅ Clear module boundaries  
✅ Serverless-first approach  
✅ Infrastructure as code  
✅ Automated deployments  
✅ Environment variable management  
✅ Security headers configured  
✅ Real-time updates via CDC

---

## 📞 Contact

**Email:** tabletap416@gmail.com  
**Project:** Table-Tap QR Restaurant Management System

---

*Last Updated: February 11, 2026*
