/**
 * Subdomain Router Utility
 * Detects the current subdomain and returns the appropriate app type
 */

/**
 * Get the current subdomain from window.location
 * @returns {'landing' | 'app' | 'restaurant' | 'admin'} The app type based on subdomain
 */
export const getSubdomain = () => {
    const hostname = window.location.hostname;

    // Handle localhost development (use query param or default to landing)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // For development, check URL path or query param
        const params = new URLSearchParams(window.location.search);
        const devSubdomain = params.get('subdomain');
        if (devSubdomain) return devSubdomain;

        // Check if path starts with module name for dev convenience
        const pathname = window.location.pathname;
        if (pathname.startsWith('/app')) return 'app';
        if (pathname.startsWith('/restaurant')) return 'restaurant';
        if (pathname.startsWith('/admin')) return 'admin';

        // Default to app for localhost (to keep current behavior)
        return 'app';
    }

    // Production subdomain detection
    // Production subdomain detection - robust check for Vercel domains
    // e.g. table-tap-restaurant.vercel.app, admin.tabletap.com

    if (hostname.includes('admin')) {
        return 'admin';
    }

    if (hostname.includes('restaurant') || hostname.includes('manager')) {
        return 'restaurant';
    }

    if (hostname.includes('app')) {
        return 'app';
    }

    // Default to app
    return 'app';

    // Main domain (tabletap.com) now goes to customer app or handled by external proxy
    return 'app';
};

/**
 * Get the base path for the current subdomain
 * Used for routing configuration
 */
export const getBasePath = () => {
    const subdomain = getSubdomain();

    // On localhost, we use path-based routing for development
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

    // In production with subdomains, base path is always root
    return '';
};

/**
 * Check if current environment is development
 */
export const isDevelopment = () => {
    const hostname = window.location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1';
};

/**
 * Get the appropriate URL for navigation between subdomains
 * @param {string} targetSubdomain - The subdomain to navigate to
 * @param {string} path - The path within that subdomain
 */
export const getSubdomainUrl = (targetSubdomain, path = '/') => {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    // Development mode - use path-based routing
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

    // Production - use actual subdomains
    const parts = hostname.split('.');
    // Remove existing subdomain if present
    const baseDomain = parts.length >= 3 ? parts.slice(1).join('.') : hostname;

    if (targetSubdomain === 'landing') {
        // Point to landing page (assuming it's the root domain)
        return `${protocol}//${baseDomain}${path}`;
    }

    return `${protocol}//${targetSubdomain}.${baseDomain}${path}`;
};

export default {
    getSubdomain,
    getBasePath,
    isDevelopment,
    getSubdomainUrl
};
