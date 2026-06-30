import { expect, test } from '@playwright/test';
import { loadE2EEnv } from './helpers/env';
import { expectRouteLoads, safeClick } from './helpers/ui';

const env = loadE2EEnv();

test.describe('production admin read-only flows', () => {
  test('@smoke /admin redirects to dashboard', async ({ page }) => {
    await page.goto(`${env.ADMIN_APP_URL}/admin`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/admin\/dashboard\/?$/);
    await expect(page.locator('.admin-layout')).toBeVisible();
  });

  test('@smoke dashboard loads', async ({ page }) => {
    await expectRouteLoads(page, env.ADMIN_APP_URL, '/admin/dashboard');
    await expect(page.locator('.admin-layout')).toBeVisible();
  });

  for (const route of [
    '/admin/services',
    '/admin/carers',
    '/admin/bookings',
    '/admin/users',
    '/admin/reviews',
    '/admin/incidents',
    '/admin/revenue',
    '/admin/reconciliation',
    '/admin/workflows',
    '/admin/ga4',
  ]) {
    test(`read-only admin page ${route} loads`, async ({ page }) => {
      await expectRouteLoads(page, env.ADMIN_APP_URL, route);
      await expect(page.locator('.admin-layout')).toBeVisible();
    });
  }

  test('admin booking detail opens from a visible row when available', async ({ page }) => {
    await page.goto(`${env.ADMIN_APP_URL}/admin/bookings`, { waitUntil: 'domcontentloaded' });
    const detailLink = page.locator('a[href^="/admin/bookings/"], button').filter({ hasText: /chi tiết|xem/i }).first();
    test.skip(!(await detailLink.count()), 'No booking row is currently available for read-only inspection');
    await safeClick(detailLink);
    await expect(page).toHaveURL(/\/admin\/bookings\/[^/?]+/);
  });

  test('admin messages checks an existing conversation only', async ({ page }) => {
    await page.goto(`${env.ADMIN_APP_URL}/admin/incidents`, { waitUntil: 'domcontentloaded' });
    const messages = page.getByRole('button', { name: /tham gia|tin nhắn|trao đổi/i }).first();
    test.skip(!(await messages.count()), 'No production E2E incident conversation exists');
    await safeClick(messages);
    await expect(page).toHaveURL(/\/admin\/messages\/[^/?]+/);
    await expect(page.locator('body')).toContainText(/tin nhắn|trao đổi|conversation/i);
  });
});
