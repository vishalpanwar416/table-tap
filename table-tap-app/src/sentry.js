import * as Sentry from "@sentry/react";


/**
 * Initialize Sentry for error tracking and performance monitoring
 * 
 * Setup Instructions:
 * 1. Create a Sentry account at https://sentry.io
 * 2. Create a new React project
 * 3. Copy the DSN from project settings
 * 4. Add REACT_APP_SENTRY_DSN to your .env file
 * 5. Add REACT_APP_SENTRY_ENVIRONMENT (development/staging/production)
 */

const initSentry = () => {
    const dsn = process.env.REACT_APP_SENTRY_DSN;
    const environment = process.env.REACT_APP_SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development';

    // Only initialize if DSN is provided
    if (!dsn) {
        console.warn('Sentry DSN not found. Error tracking is disabled.');
        return;
    }

    Sentry.init({
        dsn,
        environment,

        // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
        // We recommend adjusting this value in production
        tracesSampleRate: environment === 'production' ? 0.1 : 1.0,

        // Integrations
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration(),
        ],

        // Release tracking
        release: process.env.REACT_APP_VERSION || 'unknown',

        // Filter out certain errors
        beforeSend(event, hint) {
            // Filter out browser extension errors
            if (event.exception) {
                const exceptionValue = event.exception.values?.[0]?.value || '';
                if (
                    exceptionValue.includes('chrome-extension://') ||
                    exceptionValue.includes('moz-extension://') ||
                    exceptionValue.includes('safari-extension://')
                ) {
                    return null;
                }
            }

            // Don't send events in development unless explicitly enabled
            if (environment === 'development' && !process.env.REACT_APP_SENTRY_DEBUG) {
                console.log('Sentry Event (dev mode):', event);
                return null;
            }

            return event;
        },

        // Ignore certain errors
        ignoreErrors: [
            // Random plugins/extensions
            'top.GLOBALS',
            // See: http://blog.errorception.com/2012/03/tale-of-unfindable-js-error.html
            'originalCreateNotification',
            'canvas.contentDocument',
            'MyApp_RemoveAllHighlights',
            // Facebook borked
            'fb_xd_fragment',
            // ISP "optimizing" proxy - `Cache-Control: no-transform` seems to reduce this. (thanks @acdha)
            'bmi_SafeAddOnload',
            'EBCallBackMessageReceived',
            // See http://toolbar.conduit.com/Developer/HtmlAndGadget/Methods/JSInjection.aspx
            'conduitPage',
            // Network errors
            'NetworkError',
            'Failed to fetch',
            'Load failed',
            // ResizeObserver errors (benign)
            'ResizeObserver loop limit exceeded',
        ],

        // Deny URLs - don't send errors from these sources
        denyUrls: [
            // Browser extensions
            /extensions\//i,
            /^chrome:\/\//i,
            /^chrome-extension:\/\//i,
            /^moz-extension:\/\//i,
        ],
    });

    console.log(`Sentry initialized for ${environment} environment`);
};

export default initSentry;

// Helper function to manually capture errors
export const captureError = (error, context = {}) => {
    Sentry.captureException(error, {
        extra: context,
    });
};

// Helper function to set user context
export const setUserContext = (user) => {
    if (user) {
        Sentry.setUser({
            id: user.id,
            email: user.email,
            username: user.full_name,
        });
    } else {
        Sentry.setUser(null);
    }
};

// Helper function to add breadcrumb
export const addBreadcrumb = (message, category = 'custom', level = 'info') => {
    Sentry.addBreadcrumb({
        message,
        category,
        level,
        timestamp: Date.now() / 1000,
    });
};
