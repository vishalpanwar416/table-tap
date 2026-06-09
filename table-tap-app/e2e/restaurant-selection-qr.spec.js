const { test, expect } = require('@playwright/test');

test.describe('Restaurant selection QR', () => {
  test('shows QR scan button in filter bar', async ({ page }) => {
    await page.goto('/restaurant-selection');
    await expect(page.locator('#root')).toBeAttached({ timeout: 15000 });

    const qrBtn = page.getByRole('button', { name: 'Scan table QR code' }).first();
    await expect(qrBtn).toBeVisible({ timeout: 20000 });
  });

  test('opens QR scanner modal on click', async ({ page }) => {
    await page.goto('/restaurant-selection');
    await expect(page.locator('#root')).toBeAttached({ timeout: 15000 });

    const qrBtn = page.getByRole('button', { name: 'Scan table QR code' }).first();
    await qrBtn.click({ timeout: 20000 });

    await expect(page.getByRole('heading', { name: 'Scan table QR' })).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByText(/Point your camera at the Table-Tap QR|Could not access camera/i),
    ).toBeVisible();
  });

  test('empty state offers Scan Table QR when no restaurants', async ({ page }) => {
    await page.goto('/restaurant-selection');
    await expect(page.locator('#root')).toBeAttached({ timeout: 15000 });

    // Wait for loading skeleton to clear (empty list or populated list)
    await page.waitForFunction(
      () => !document.querySelector('.animate-pulse') || document.body.innerText.includes('No restaurants found'),
      { timeout: 30000 },
    );

    const emptyHeading = page.getByRole('heading', { name: /No restaurants found|No restaurants assigned/ });
    if (await emptyHeading.isVisible().catch(() => false)) {
      await expect(page.getByRole('button', { name: 'Scan Table QR' }).first()).toBeVisible();
      await expect(page.getByText(/Scan the QR code on your table/i)).toBeVisible();
    }
  });

  test('URL restaurant+table params redirect to home', async ({ page }) => {
    const restaurantId = '11111111-1111-1111-1111-111111111111';
    const table = '7';
    await page.goto(`/restaurant-selection?restaurant=${restaurantId}&table=${table}`);
    await expect(page).toHaveURL(/\/home/, { timeout: 15000 });
  });
});
