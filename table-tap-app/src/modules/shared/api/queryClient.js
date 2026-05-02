import * as Sentry from '@sentry/react';

const isAbortError = (err) => {
  if (!err) return false;
  if (err.name === 'AbortError') return true;
  const msg = err.message || '';
  return msg.includes('aborted') || msg.includes('signal is aborted');
};

const isTransientError = (err) => {
  if (!err) return false;
  const msg = err.message || '';
  if (err.status >= 500 && err.status < 600) return true;
  return (
    msg.includes('Failed to fetch') ||
    msg.includes('NetworkError') ||
    msg.includes('Load failed') ||
    msg.includes('network request failed')
  );
};

/**
 * Wrap a Supabase query with Sentry breadcrumbs, retries on transient failures,
 * and consistent AbortError handling.
 *
 * @param {string} name - Human label for telemetry (e.g. "fetchOrders")
 * @param {() => Promise<{data, error}>} run - Thunk that executes the query
 * @param {object} [options]
 * @param {number} [options.retries=2] - Retries on transient failures
 * @param {number} [options.retryDelay=300] - Base delay in ms (exponential backoff)
 * @param {object} [options.context] - Extra context to log (e.g. { restaurantId })
 * @returns {Promise<any>} - Resolves with `data`, throws on error
 */
export const runQuery = async (name, run, options = {}) => {
  const { retries = 2, retryDelay = 300, context = {} } = options;
  const startedAt = Date.now();

  Sentry.addBreadcrumb({
    category: 'supabase',
    message: name,
    level: 'info',
    data: context,
  });

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await run();
      if (result?.error) throw result.error;
      const durationMs = Date.now() - startedAt;
      if (durationMs > 3000) {
        Sentry.addBreadcrumb({
          category: 'supabase.slow',
          message: `${name} took ${durationMs}ms`,
          level: 'warning',
          data: { ...context, durationMs },
        });
      }
      return result?.data;
    } catch (err) {
      lastError = err;

      if (isAbortError(err)) throw err;

      if (attempt < retries && isTransientError(err)) {
        await new Promise((r) => setTimeout(r, retryDelay * Math.pow(2, attempt)));
        continue;
      }

      Sentry.captureException(err, {
        tags: { query: name },
        extra: { ...context, attempt },
      });
      throw err;
    }
  }
  throw lastError;
};

/**
 * Lightweight wrapper for non-query async work (uploads, RPC, edge functions)
 * that benefits from breadcrumbs + Sentry capture but no automatic retry.
 */
export const runOperation = async (name, run, context = {}) => {
  Sentry.addBreadcrumb({
    category: 'operation',
    message: name,
    level: 'info',
    data: context,
  });
  try {
    return await run();
  } catch (err) {
    if (isAbortError(err)) throw err;
    Sentry.captureException(err, {
      tags: { operation: name },
      extra: context,
    });
    throw err;
  }
};
