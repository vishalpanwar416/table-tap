# 🔍 Sentry Setup Guide - Table Tap

## Overview
Sentry provides real-time error tracking and performance monitoring for both the React app and Next.js landing page.

---

## 📋 Prerequisites

1. **Sentry Account**: Create a free account at [sentry.io](https://sentry.io)
2. **Two Sentry Projects**:
   - One for the React App (table-tap-app)
   - One for the Next.js Landing Page (table-tap-landing)

---

## 🚀 Setup Instructions

### Step 1: Create Sentry Projects

1. Log in to [Sentry Dashboard](https://sentry.io)
2. Click **"Create Project"**
3. For **table-tap-app**:
   - Platform: **React**
   - Project name: `table-tap-app`
   - Alert frequency: **On every new issue**
4. For **table-tap-landing**:
   - Platform: **Next.js**
   - Project name: `table-tap-landing`
   - Alert frequency: **On every new issue**

### Step 2: Get Your DSN Keys

After creating each project, copy the **DSN** (Data Source Name) from:
- **Settings** → **Projects** → **[Your Project]** → **Client Keys (DSN)**

Example DSN format:
```
https://abc123def456@o123456.ingest.sentry.io/789012
```

### Step 3: Configure Environment Variables

#### For `table-tap-app`:

Create/update `.env` file:
```bash
# Sentry Configuration
REACT_APP_SENTRY_DSN=https://your-dsn-here@o123456.ingest.sentry.io/789012
REACT_APP_SENTRY_ENVIRONMENT=production
REACT_APP_VERSION=1.0.1

# Optional: Enable Sentry in development
# REACT_APP_SENTRY_DEBUG=true
```

#### For `table-tap-landing`:

Create/update `.env.local` file:
```bash
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn-here@o123456.ingest.sentry.io/789012
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production

# Optional: Enable Sentry in development
# NEXT_PUBLIC_SENTRY_DEBUG=true
```

### Step 4: Configure Vercel Environment Variables

For production deployment, add these to Vercel:

1. Go to **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**

2. For **table-tap-app** project:
   ```
   REACT_APP_SENTRY_DSN = [your-app-dsn]
   REACT_APP_SENTRY_ENVIRONMENT = production
   REACT_APP_VERSION = 1.0.1
   ```

3. For **table-tap-landing** project:
   ```
   NEXT_PUBLIC_SENTRY_DSN = [your-landing-dsn]
   NEXT_PUBLIC_SENTRY_ENVIRONMENT = production
   ```

---

## 🧪 Testing Sentry Integration

### Test in Development

1. Start your app:
   ```bash
   npm run dev
   ```

2. Open browser console and run:
   ```javascript
   throw new Error("Test Sentry Error");
   ```

3. Check Sentry dashboard - you should see the error (if `SENTRY_DEBUG=true`)

### Test in Production

1. Deploy to Vercel
2. Visit your production site
3. Trigger an error (e.g., navigate to non-existent route)
4. Check Sentry dashboard for the error

---

## 📊 Using Sentry in Your Code

### Automatic Error Capture

Sentry automatically captures:
- Unhandled exceptions
- Unhandled promise rejections
- Console errors
- Network errors

### Manual Error Capture

```javascript
import { captureError, addBreadcrumb, setUserContext } from './sentry';

// Capture an error manually
try {
  riskyOperation();
} catch (error) {
  captureError(error, {
    context: 'Payment Processing',
    orderId: '12345',
  });
}

// Add breadcrumbs for debugging
addBreadcrumb('User clicked checkout button', 'user-action');

// Set user context after login
setUserContext({
  id: user.id,
  email: user.email,
  full_name: user.full_name,
});
```

### In React Components

```javascript
import * as Sentry from '@sentry/react';

// Wrap components with error boundary
const MyComponent = () => {
  return (
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <YourComponent />
    </Sentry.ErrorBoundary>
  );
};

// Or use the hook
function MyComponent() {
  const handleClick = () => {
    try {
      // risky operation
    } catch (error) {
      Sentry.captureException(error);
    }
  };
  
  return <button onClick={handleClick}>Click me</button>;
}
```

---

## 🎯 Performance Monitoring

Sentry automatically tracks:
- **Page Load Times**
- **API Response Times**
- **Component Render Times**
- **Navigation Performance**

### Custom Performance Tracking

```javascript
import * as Sentry from '@sentry/react';

// Track custom operations
const transaction = Sentry.startTransaction({
  name: 'Process Order',
  op: 'task',
});

try {
  await processOrder(orderId);
  transaction.setStatus('ok');
} catch (error) {
  transaction.setStatus('internal_error');
  throw error;
} finally {
  transaction.finish();
}
```

---

## 🔧 Configuration Options

### Sample Rates

Adjust in `sentry.js` or `sentry.client.config.js`:

```javascript
// Capture 100% of errors, 10% of performance data in production
tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
```

### Ignored Errors

Already configured to ignore:
- Browser extension errors
- ResizeObserver errors
- Network errors (Failed to fetch)
- Third-party script errors

Add more in `ignoreErrors` array.

---

## 📈 Monitoring Best Practices

### 1. Set Up Alerts

In Sentry Dashboard:
- **Settings** → **Alerts** → **Create Alert Rule**
- Configure for:
  - New issues
  - Issue frequency spikes
  - Performance degradation

### 2. Create Releases

Track which version caused errors:

```bash
# Install Sentry CLI
npm install -g @sentry/cli

# Create release
sentry-cli releases new "table-tap-app@1.0.1"
sentry-cli releases set-commits "table-tap-app@1.0.1" --auto
sentry-cli releases finalize "table-tap-app@1.0.1"
```

### 3. Source Maps

For better stack traces, upload source maps:

```bash
# In package.json build script
"build": "react-scripts build && sentry-cli releases files table-tap-app@$npm_package_version upload-sourcemaps ./build"
```

### 4. User Feedback

Collect user feedback on errors:

```javascript
import * as Sentry from '@sentry/react';

Sentry.showReportDialog({
  eventId: 'event-id-from-error',
  user: {
    email: user.email,
    name: user.full_name,
  },
});
```

---

## 🚨 Troubleshooting

### Errors Not Appearing in Sentry

1. **Check DSN**: Verify environment variable is set correctly
2. **Check Environment**: Development errors are filtered by default
3. **Check Console**: Look for Sentry initialization message
4. **Check Network**: Ensure requests to `sentry.io` aren't blocked

### Too Many Errors

1. **Adjust Sample Rate**: Reduce `tracesSampleRate`
2. **Add to ignoreErrors**: Filter out noise
3. **Set up Filters**: Use `beforeSend` to filter events

### Performance Issues

1. **Reduce Sample Rate**: Lower `tracesSampleRate` to 0.05 or 0.01
2. **Disable in Development**: Set `tracesSampleRate: 0` for dev

---

## 💰 Pricing Considerations

### Free Tier Limits
- **5,000 errors/month**
- **10,000 performance units/month**
- **1 user**

### Recommendations
- Start with free tier
- Monitor usage in Sentry dashboard
- Adjust sample rates if approaching limits
- Upgrade when needed (starts at $26/month)

---

## 📚 Additional Resources

- [Sentry React Docs](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Release Tracking](https://docs.sentry.io/product/releases/)

---

## ✅ Checklist

- [ ] Created Sentry account
- [ ] Created two Sentry projects (App + Landing)
- [ ] Copied DSN keys
- [ ] Added environment variables locally
- [ ] Added environment variables to Vercel
- [ ] Tested error capture in development
- [ ] Tested error capture in production
- [ ] Set up alert rules
- [ ] Configured team notifications
- [ ] Documented for team

---

**Last Updated**: February 11, 2026  
**Contact**: tabletap416@gmail.com
