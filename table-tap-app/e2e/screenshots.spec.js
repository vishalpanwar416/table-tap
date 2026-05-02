// @ts-check
const { test } = require('@playwright/test');

const SHOTS_DIR = 'e2e/screenshots';

const pages = [
  { path: '/app',                name: '01-customer-landing' },
  { path: '/restaurant/login',   name: '02-restaurant-login' },
  { path: '/admin',              name: '03-admin-login' },
];

test.describe('Visual capture of public pages (post-theme refactor)', () => {
  for (const { path, name } of pages) {
    test(`${name}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
      await page.waitForTimeout(800); // settle animations
      await page.screenshot({ path: `${SHOTS_DIR}/${name}.png`, fullPage: true });
    });
  }
});
