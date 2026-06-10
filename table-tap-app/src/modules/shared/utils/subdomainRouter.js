/**
 * Subdomain Router Utility
 * Detects the current subdomain and returns the appropriate app type.
 *
 * Handles both production and staging:
 *   Production:  app.table-tap.in, restaurant.table-tap.in, admin.table-tap.in
 *   Staging:     staging.app.table-tap.in, staging.restaurant.table-tap.in, etc.
 */

// App-type keywords in order of priority
const APP_KEYWORDS = ['admin', 'owner', 'restaurant', 'manager', 'app'];

/**
 * Strip deployment prefixes (staging, preview) so portal checks work on
 * staging.admin.table-tap.in the same as admin.table-tap.in.
 */
export const stripDeploymentPrefix = (hostname) => {
  return (hostname || '').toLowerCase().replace(/^(staging|preview)\./i, '');
};

export const isAdminHost = (
  hostname = typeof window !== 'undefined' ? window.location.hostname : '',
) => {
  return stripDeploymentPrefix(hostname).startsWith('admin.');
};

export const isRestaurantPortalHost = (
  hostname = typeof window !== 'undefined' ? window.location.hostname : '',
) => {
  const h = stripDeploymentPrefix(hostname);
  return h.startsWith('restaurant.') || h.startsWith('manager.') || h.startsWith('owner.');
};

/** True on admin.* or restaurant/manager/owner.* hosts (prod or staging). */
export const isPortalHost = (hostname) => {
  return isAdminHost(hostname) || isRestaurantPortalHost(hostname);
};

/** Customer app origin — not a staff/admin portal subdomain. */
export const isCustomerAppOrigin = (
  hostname = typeof window !== 'undefined' ? window.location.hostname : '',
) => {
  return !isPortalHost(hostname);
};

/**
 * Extracts the logical app type from a hostname regardless of staging prefix.
 * e.g. "staging.app.table-tap.in" → "app"
 *      "restaurant.table-tap.in"  → "restaurant"
 */
const resolveAppType = (hostname) => {
  const parts = hostname.toLowerCase().split('.');
  // Walk subdomain parts (everything before the root domain) left→right
  // and return the first recognised app-type keyword.
  for (const part of parts) {
    if (part === 'admin') return 'admin';
    if (part === 'owner') return 'owner';
    if (part === 'restaurant' || part === 'manager') return 'restaurant';
    if (part === 'app') return 'app';
    // Skip non-keyword prefixes like "staging", "preview", etc.
  }
  // Fallback: substring match (catches Vercel preview URLs)
  if (hostname.includes('admin')) return 'admin';
  if (hostname.includes('owner')) return 'owner';
  if (hostname.includes('restaurant') || hostname.includes('manager')) return 'restaurant';
  if (hostname.includes('app')) return 'app';
  return 'app';
};

/**
 * Get the current subdomain from window.location
 * @returns {'landing' | 'app' | 'restaurant' | 'admin' | 'owner'} The app type based on subdomain
 */
export const getSubdomain = () => {
  const hostname = window.location.hostname;

  // Localhost dev — use path or query param
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const params = new URLSearchParams(window.location.search);
    const devSubdomain = params.get('subdomain');
    if (devSubdomain) return devSubdomain;

    const pathname = window.location.pathname;
    if (pathname.startsWith('/app')) return 'app';
    if (pathname.startsWith('/restaurant')) return 'restaurant';
    if (pathname.startsWith('/admin')) return 'admin';

    return 'app';
  }

  return resolveAppType(hostname);
};

/**
 * Get the base path for the current subdomain (localhost only)
 */
export const getBasePath = () => {
  const subdomain = getSubdomain();

  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    switch (subdomain) {
      case 'app':
        return '/app';
      case 'restaurant':
        return '/restaurant';
      case 'admin':
        return '/admin';
      default:
        return '';
    }
  }

  return '';
};

/**
 * Check if current environment is development or staging.
 * Staging is treated as production for routing but as non-prod for
 * features like source maps.
 */
export const isDevelopment = () => {
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('vercel.app');
};

/**
 * Returns true when on a staging deployment (staging.*.table-tap.in)
 */
export const isStaging = () => {
  const hostname = window.location.hostname;
  return hostname.startsWith('staging.') && hostname.endsWith('table-tap.in');
};

/**
 * Get the appropriate URL for cross-subdomain navigation.
 * Preserves any staging prefix so links between apps work on staging too.
 *
 * e.g. on staging.app.table-tap.in:
 *   getSubdomainUrl('restaurant') → https://staging.restaurant.table-tap.in/
 *
 * @param {string} targetSubdomain - The app type to navigate to ('app', 'restaurant', 'admin', 'owner')
 * @param {string} path - The path within that subdomain
 */
export const getSubdomainUrl = (targetSubdomain, path = '/') => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;

  // Development — use path-based routing
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const port = window.location.port ? `:${window.location.port}` : '';
    switch (targetSubdomain) {
      case 'app':
        return `${protocol}//${hostname}${port}/app${path}`;
      case 'restaurant':
        return `${protocol}//${hostname}${port}/restaurant${path}`;
      case 'admin':
        return `${protocol}//${hostname}${port}/admin${path}`;
      default:
        return `${protocol}//${hostname}${port}${path}`;
    }
  }

  // Production/staging — derive the root domain and any staging prefix
  const parts = hostname.split('.');

  // Find root domain: last two parts that contain the actual domain name
  // e.g. ['staging','app','table-tap','in'] → rootDomain = 'table-tap.in'
  // e.g. ['app','table-tap','in']           → rootDomain = 'table-tap.in'
  const knownAppParts = new Set([
    'staging',
    'preview',
    'app',
    'restaurant',
    'admin',
    'owner',
    'manager',
  ]);
  const rootParts = [];
  let passedAppPart = false;
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i].toLowerCase();
    if (!passedAppPart && !knownAppParts.has(p)) {
      rootParts.unshift(parts[i]);
    } else {
      passedAppPart = true;
      // Once we hit an app-type or prefix, stop collecting root parts
      break;
    }
  }
  // Fallback: use last 2 parts as root domain
  const rootDomain = rootParts.length >= 2 ? rootParts.join('.') : parts.slice(-2).join('.');

  // Detect staging prefix (e.g. "staging")
  const stagingPrefix = isStaging() ? `${parts[0]}.` : '';

  if (targetSubdomain === 'landing') {
    return `${protocol}//${stagingPrefix}${rootDomain}${path}`;
  }

  return `${protocol}//${stagingPrefix}${targetSubdomain}.${rootDomain}${path}`;
};

export default {
  getSubdomain,
  getBasePath,
  isDevelopment,
  isStaging,
  getSubdomainUrl,
  stripDeploymentPrefix,
  isAdminHost,
  isRestaurantPortalHost,
  isPortalHost,
  isCustomerAppOrigin,
};
