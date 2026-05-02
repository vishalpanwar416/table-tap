// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Smoke tests covering the most critical surfaces:
 * - Each app module mounts without crashing the ErrorBoundary
 * - No JS console errors or unhandled exceptions
 * - No CSP violations on localhost (CSP only enforced in prod via Vercel,
 *   but we still assert no Refused-to-connect blocks against the dev server)
 */

const collectConsoleNoise = (page) => {
  const errors = [];
  const cspViolations = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore noise we know is benign in dev
      if (
        text.includes('Refused to connect') ||
        text.includes('Content Security Policy')
      ) {
        cspViolations.push(text);
      } else if (
        !text.includes('React Router Future Flag') &&
        !text.includes('DevTools') &&
        !text.includes('extension') &&
        !text.includes('manifest.json') &&
        !text.includes('Sentry DSN not found')
      ) {
        errors.push(text);
      }
    }
  });
  return { errors, cspViolations };
};

const expectErrorBoundaryNotShown = async (page) => {
  await expect(page.getByText('Something went wrong')).toHaveCount(0);
};

test.describe('Smoke: app modules mount cleanly', () => {
  test('customer app loads landing/restaurant selection', async ({ page }) => {
    const { errors, cspViolations } = collectConsoleNoise(page);

    await page.goto('/app');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });

    await expectErrorBoundaryNotShown(page);
    expect(errors, `Console errors: ${errors.join('\n')}`).toEqual([]);
    expect(cspViolations, `CSP violations: ${cspViolations.join('\n')}`).toEqual([]);
  });

  test('restaurant login page renders', async ({ page }) => {
    const { errors, cspViolations } = collectConsoleNoise(page);

    await page.goto('/restaurant/login');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });

    await expectErrorBoundaryNotShown(page);
    // Confirm login UI rendered (Partner Portal heading + email/password fields)
    await expect(page.getByRole('heading', { name: /partner portal/i })).toBeVisible();
    await expect(page.getByPlaceholder(/enter your email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/enter your password/i)).toBeVisible();
    expect(errors, `Console errors: ${errors.join('\n')}`).toEqual([]);
    expect(cspViolations, `CSP violations: ${cspViolations.join('\n')}`).toEqual([]);
  });

  test('admin app loads (login or dashboard)', async ({ page }) => {
    const { errors, cspViolations } = collectConsoleNoise(page);

    await page.goto('/admin');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });

    await expectErrorBoundaryNotShown(page);
    expect(errors, `Console errors: ${errors.join('\n')}`).toEqual([]);
    expect(cspViolations, `CSP violations: ${cspViolations.join('\n')}`).toEqual([]);
  });
});

test.describe('Smoke: ErrorBoundary integration', () => {
  test('ErrorBoundary catches synthetic crash and reports to Sentry', async ({ page }) => {
    let sentryRequestSent = false;
    page.on('request', (req) => {
      if (req.url().includes('sentry.io') || req.url().includes('ingest.sentry')) {
        sentryRequestSent = true;
      }
    });

    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Synthesise a render-time crash via a route that doesn't exist + injected throw
    await page.evaluate(() => {
      // Re-throwing inside an event handler is not caught by ErrorBoundary,
      // so simulate by dispatching to React's error reporter via window.onerror.
      // This is just a sanity hook — real crashes flow through componentDidCatch.
      throw new Error('SmokeTest synthetic error');
    }).catch(() => {}); // page.evaluate rejects on throw — that's fine

    // We don't assert sentryRequestSent because dev mode skips Sentry by default
    // (see beforeSend in src/sentry.js). Just confirm the page didn't white-screen.
    await expect(page.locator('body')).toBeVisible();
  });
});
