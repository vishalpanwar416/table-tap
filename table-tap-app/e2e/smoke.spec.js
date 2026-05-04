const { test, expect } = require('@playwright/test');

test('customer app loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Table Tap|TableTap|table-tap/i);
});

test('restaurant login route resolves', async ({ page }) => {
  const response = await page.goto('/restaurant/login');
  expect(response.status()).toBe(200);
  // Page should mount the React app (root div present)
  await expect(page.locator('#root')).toBeAttached({ timeout: 10000 });
});

test('admin route resolves', async ({ page }) => {
  const response = await page.goto('/admin');
  expect(response.status()).toBe(200);
  await expect(page.locator('#root')).toBeAttached({ timeout: 10000 });
});
