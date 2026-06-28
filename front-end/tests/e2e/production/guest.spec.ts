import { expect, test } from '@playwright/test';
import { loadE2EEnv } from './helpers/env';
import {
  expectSiteFooterOnce,
  expectNavbarOnce,
  expectNoHorizontalOverflow,
  expectRouteLoads,
  findFirstVisibleCard,
  safeClick,
  skipIfMissingRecord,
} from './helpers/ui';

const env = loadE2EEnv();

test.describe('production guest and public flows', () => {
  test('@smoke landing loads with one navbar and footer', async ({ page }) => {
    await expectRouteLoads(page, env.USER_APP_URL, '/');
    await expectNavbarOnce(page);
    await expectSiteFooterOnce(page);
  });

  test('primary navbar links resolve', async ({ page }) => {
    await page.goto(env.USER_APP_URL, { waitUntil: 'domcontentloaded' });
    const routes = ['/about', '/services', '/carers'];
    for (const route of routes) {
      const link = page.locator(`nav.navbar a[href="${route}"]:visible`).first();
      await safeClick(link);
      await expect(page).toHaveURL(new RegExp(`${route.replace('/', '\\/')}/?(?:\\?.*)?$`));
      await page.goto(env.USER_APP_URL, { waitUntil: 'domcontentloaded' });
    }
  });

  test('@smoke about, services, and carers listings load', async ({ page }) => {
    for (const route of ['/about', '/services', '/carers']) {
      await expectRouteLoads(page, env.USER_APP_URL, route);
      await expectNavbarOnce(page);
      await expectSiteFooterOnce(page);
    }
  });

  test('service search and first available detail are usable', async ({ page }) => {
    await page.goto(`${env.USER_APP_URL}/services`, { waitUntil: 'domcontentloaded' });
    const search = page.locator('input[type="search"], input[placeholder*="dịch vụ" i], input[placeholder*="tìm" i]').first();
    if (await search.isVisible()) {
      await search.fill('chăm sóc');
      await search.press('Enter');
      await expect(page).toHaveURL(/\/services/);
    }
    const card = skipIfMissingRecord(
      await findFirstVisibleCard(page, ['.service-card-premium']),
      'Production currently has no visible service card',
    );
    const detailLink = card.locator('a[href^="/services/"]').first();
    if (await detailLink.count()) {
      await safeClick(detailLink);
    } else {
      const detailButton = card.getByRole('button', { name: /chi tiết|xem/i }).first();
      await safeClick(detailButton);
    }
    await expect(page).toHaveURL(/\/services\/[^/?]+/);
  });

  test('carer search and first available detail are usable', async ({ page }) => {
    await page.goto(`${env.USER_APP_URL}/carers`, { waitUntil: 'domcontentloaded' });
    const search = page.locator('input[type="search"], input[placeholder*="người" i], input[placeholder*="tìm" i]').first();
    if (await search.isVisible()) {
      await search.fill('E2E');
      await search.press('Enter');
      await search.clear();
    }
    const card = skipIfMissingRecord(
      await findFirstVisibleCard(page, ['.carer-list-item']),
      'Production currently has no visible verified carer card',
    );
    const detailLink = card.locator('a[href^="/carers/"]').first();
    if (await detailLink.count()) {
      await safeClick(detailLink);
    } else {
      await safeClick(card.getByRole('button', { name: /hồ sơ|chi tiết|xem/i }).first());
    }
    await expect(page).toHaveURL(/\/carers\/[^/?]+/);
  });

  test('@smoke login and signup pages load', async ({ page }) => {
    for (const route of ['/login', '/signup', '/auth']) {
      await expectRouteLoads(page, env.USER_APP_URL, route);
      await expect(page.locator('form')).toBeVisible();
    }
  });

  test('@smoke invalid admin login preserves the original error', async ({ page }) => {
    let refreshRequests = 0;
    page.on('request', (request) => {
      if (request.url().includes('/auth/refresh')) refreshRequests += 1;
    });
    await page.goto(`${env.ADMIN_APP_URL}/login`, { waitUntil: 'domcontentloaded' });
    const form = page.locator('.login-form');
    await form.locator('input[type="email"]').fill('e2e.invalid.login@example.invalid');
    await form.locator('input[type="password"]').fill('E2E_Invalid_Login_Only_9!');
    await form.locator('button[type="submit"]').click();
    const message = form.locator('.auth-message.error-message');
    await expect(message).toBeVisible();
    await expect(message).not.toContainText(/refresh token missing/i);
    expect(refreshRequests).toBe(0);
  });

  test('public information pages load', async ({ page }) => {
    for (const route of ['/privacy', '/terms', '/help', '/contact', '/careers', '/faq', '/guide']) {
      await expectRouteLoads(page, env.USER_APP_URL, route);
      await expectSiteFooterOnce(page);
    }
  });

  test('unknown public route renders NotFound', async ({ page }) => {
    await page.goto(`${env.USER_APP_URL}/e2e-route-that-does-not-exist`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/e2e-route-that-does-not-exist/);
    await expect(page.locator('body')).toContainText(/404|không tìm thấy|not found/i);
  });

  for (const viewport of [
    { name: 'desktop', width: 1280, height: 900 },
    { name: 'mobile', width: 390, height: 844 },
  ]) {
    test(`landing has no horizontal overflow on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(env.USER_APP_URL, { waitUntil: 'domcontentloaded' });
      await expectNoHorizontalOverflow(page);
    });
  }
});
