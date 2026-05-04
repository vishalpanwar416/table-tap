const { test, expect } = require('@playwright/test');

test('customer app loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Table Tap|TableTap|table-tap/i);
});

test('restaurant login page loads', async ({ page }) => {
  await page.goto('/restaurant/login');
  await expect(page.locator('input[type="email"], input[placeholder*="email" i]')).toBeVisible({ timeout: 10000 });
});

test('admin login page loads', async ({ page }) => {
  await page.goto('/admin');
  await expect(page.locator('input[type="email"], input[type="password"]').first()).toBeVisible({ timeout: 10000 });
});
