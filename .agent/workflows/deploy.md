---
description: Deploy the application to production
---

# Deploy Application Workflow

This workflow guides you through deploying the Table-Tap application to production on Vercel.

## Prerequisites
- [ ] All tests passing (`npm test`)
- [ ] Code reviewed and approved
- [ ] Changes merged to `main` branch
- [ ] Environment variables configured in Vercel

## Steps

### 1. Run Tests Locally
```bash
cd table-tap-app
npm test -- --watchAll=false
```

**Expected**: All tests should pass

### 2. Build Locally (Optional - for verification)
```bash
# Build the app
npm run build

# Build the landing page
cd ../table-tap-landing
npm run build
```

**Expected**: Build completes without errors

### 3. Commit and Push Changes
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

### 4. Verify Vercel Deployment

**For App** (app.table-tap.in):
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select `table-tap-app` project
3. Check deployment status
4. Wait for "Ready" status

**For Landing** (table-tap.in):
1. Select `table-tap-landing` project
2. Check deployment status
3. Wait for "Ready" status

### 5. Verify Production

**Test App**:
```bash
# Visit production URLs
open https://app.table-tap.in
open https://restaurant.table-tap.in
open https://admin.table-tap.in
```

**Test Landing**:
```bash
open https://table-tap.in
```

### 6. Check Sentry for Errors

1. Go to [Sentry Dashboard](https://sentry.io)
2. Check for new errors in last 5 minutes
3. Investigate any critical issues

### 7. Monitor Performance

1. Check Vercel Analytics
2. Check Supabase Dashboard for database performance
3. Monitor error rates in Sentry

## Rollback Procedure (if needed)

If deployment has critical issues:

1. Go to Vercel Dashboard
2. Select the project
3. Click on previous successful deployment
4. Click "Promote to Production"
5. Investigate and fix issues locally
6. Redeploy when ready

## Post-Deployment Checklist

- [ ] All pages load correctly
- [ ] Authentication works
- [ ] Payment processing works
- [ ] No critical errors in Sentry
- [ ] Database connections stable
- [ ] Edge Functions responding

## Notes

- Vercel automatically deploys on push to `main`
- Preview deployments created for PRs
- Environment variables managed in Vercel dashboard
- SSL certificates auto-renewed
