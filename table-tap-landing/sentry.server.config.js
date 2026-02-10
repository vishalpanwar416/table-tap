import * as Sentry from '@sentry/nextjs';

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

        beforeSend(event, hint) {
            // Filter out development events
            if (SENTRY_ENVIRONMENT === 'development' && !process.env.NEXT_PUBLIC_SENTRY_DEBUG) {
                return null;
            }
            return event;
        },
    });

    console.log(`Sentry initialized for ${SENTRY_ENVIRONMENT} environment (Server)`);
}
