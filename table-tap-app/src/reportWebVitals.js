import * as Sentry from '@sentry/react';

const reportToSentry = ({ name, value, rating, id }) => {
  Sentry.addBreadcrumb({
    category: 'web-vital',
    message: `${name}=${Math.round(value)} (${rating})`,
    level: rating === 'poor' ? 'warning' : 'info',
    data: { name, value, rating, id },
  });

  if (rating === 'poor') {
    Sentry.captureMessage(`Poor ${name}: ${Math.round(value)}`, {
      level: 'warning',
      tags: { vital: name, rating },
      extra: { value, id },
    });
  }
};

const reportWebVitals = (extraReporter) => {
  import('web-vitals')
    .then(({ onCLS, onFCP, onINP, onLCP, onTTFB }) => {
      const handler = (metric) => {
        reportToSentry(metric);
        if (typeof extraReporter === 'function') extraReporter(metric);
      };
      onCLS(handler);
      onFCP(handler);
      onINP(handler);
      onLCP(handler);
      onTTFB(handler);
    })
    .catch(() => {
      /* fail silently — vitals are not load-bearing */
    });
};

export default reportWebVitals;
