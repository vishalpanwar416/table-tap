import * as Sentry from '@sentry/nextjs';

/**
 * Sentry Client Configuration for Next.js Landing Page
 * 
 * Setup Instructions:
 * 1. Create a Sentry account at https://sentry.io
 * 2. Create a new Next.js project
 * 3. Copy the DSN from project settings
 * 4. Add NEXT_PUBLIC_SENTRY_DSN to your .env.local file
 */

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development';

if (SENTRY_DSN) {
    Sentry.init({
        dsn: SENTRY_DSN,
        environment: SENTRY_ENVIRONMENT,

        // Adjust this value in production, or use tracesSampler for greater control
        tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,

        // Setting this option to true will print useful information to the console while you're setting up Sentry.
        debug: false,

        replaysOnErrorSampleRate: 1.0,

        // This sets the sample rate to be 10%. You may want this to be 100% while
        // in development and sample at a lower rate in production
        replaysSessionSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 0.5,

        // You can remove this option if you're not planning to use the Sentry Session Replay feature:
        integrations: [
            new Sentry.Replay({
                // Additional Replay configuration goes in here, for example:
                maskAllText: true,
                blockAllMedia: true,
            }),
        ],

        beforeSend(event, hint) {
            // Filter out development events unless debugging
            if (SENTRY_ENVIRONMENT === 'development' && !process.env.NEXT_PUBLIC_SENTRY_DEBUG) {
                console.log('Sentry Event (dev mode):', event);
                return null;
            }
            return event;
        },

        ignoreErrors: [
            'ResizeObserver loop limit exceeded',
            'Non-Error promise rejection captured',
            'NetworkError',
            'Failed to fetch',
        ],
    });

    console.log(`Sentry initialized for ${SENTRY_ENVIRONMENT} environment (Landing Page)`);
} else {
    console.warn('Sentry DSN not found. Error tracking is disabled for landing page.');
}
