import { expect, test } from '@playwright/test';
import { loadE2EEnv } from './helpers/env';
import { expectRouteLoads, findFirstVisibleCard, safeClick, skipIfMissingRecord } from './helpers/ui';

const env = loadE2EEnv();

test.describe('production user flows', () => {
  test('@smoke dedicated user session opens account profile', async ({ page }) => {
    await expectRouteLoads(page, env.USER_APP_URL, '/account/profile');
    await expect(page).toHaveURL(/\/account\/profile/);
    await expect(page.locator('main, .account-profile-page, .profile-page').first()).toBeVisible();
  });

  test('change-password page loads without changing password', async ({ page }) => {
    await expectRouteLoads(page, env.USER_APP_URL, '/change-password');
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('services and a visible service detail remain navigable', async ({ page }) => {
    await page.goto(`${env.USER_APP_URL}/services`, { waitUntil: 'domcontentloaded' });
    const card = skipIfMissingRecord(
      await findFirstVisibleCard(page, ['.service-card', '.premium-service-card', '[class*="service-card"]']),
      'No service card is available in production',
    );
    const link = card.locator('a[href^="/services/"]').first();
    if (await link.count()) await safeClick(link);
    else await safeClick(card.getByRole('button', { name: /chi tiết|xem/i }).first());
    await expect(page).toHaveURL(/\/services\/[^/?]+/);
  });

  test('carers and a visible carer detail remain navigable', async ({ page }) => {
    await page.goto(`${env.USER_APP_URL}/carers`, { waitUntil: 'domcontentloaded' });
    const card = skipIfMissingRecord(
      await findFirstVisibleCard(page, ['.carer-card', '.caregiver-card', '[class*="carer-card"]']),
      'No verified carer card is available in production',
    );
    const link = card.locator('a[href^="/carers/"]').first();
    if (await link.count()) await safeClick(link);
    else await safeClick(card.getByRole('button', { name: /hồ sơ|chi tiết|xem/i }).first());
    await expect(page).toHaveURL(/\/carers\/[^/?]+/);
  });

  test('@smoke booking page opens and exposes non-mutating validation', async ({ page }) => {
    await expectRouteLoads(page, env.USER_APP_URL, '/booking');
    const form = page.locator('form').first();
    await expect(form).toBeVisible();
    const requiredFields = form.locator('input[required], select[required], textarea[required]');
    if (await requiredFields.count()) {
      const valid = await form.evaluate((element: HTMLFormElement) => element.checkValidity());
      expect(valid).toBe(false);
    } else {
      await expect(form.getByRole('button', { name: /đặt|tiếp tục|xác nhận/i }).first()).toBeVisible();
    }
  });

  test('@smoke account request list loads', async ({ page }) => {
    await expectRouteLoads(page, env.USER_APP_URL, '/account/request');
    await expect(page).toHaveURL(/\/account\/request/);
  });

  test('existing E2E booking detail opens when present', async ({ page }) => {
    await page.goto(`${env.USER_APP_URL}/account/request`, { waitUntil: 'domcontentloaded' });
    const detail = page.locator('a[href^="/account/request/"], button.request-detail-button').first();
    test.skip(!(await detail.count()), 'No E2E-owned booking is currently visible to the user');
    await safeClick(detail);
    await expect(page).toHaveURL(/\/account\/request\/[^/?]+/);
  });

  test('payment page is inspected only when a safe payment link exists', async ({ page }) => {
    await page.goto(`${env.USER_APP_URL}/account/request`, { waitUntil: 'domcontentloaded' });
    const payment = page.getByRole('button', { name: /thanh toán ngay/i }).first();
    test.skip(!(await payment.count()), 'No E2E booking is waiting for payment');
    await safeClick(payment);
    await expect(page).toHaveURL(/\/payment/);
    await expect(page.getByRole('button', { name: /thanh toán|pay/i }).first()).toBeVisible();
  });

  test('review page is inspected only when an E2E completed booking exists', async ({ page }) => {
    await page.goto(`${env.USER_APP_URL}/account/request`, { waitUntil: 'domcontentloaded' });
    const review = page.getByRole('button', { name: /đánh giá/i }).first();
    test.skip(!(await review.count()), 'No E2E completed booking is available for review');
    await safeClick(review);
    await expect(page).toHaveURL(/\/review/);
    await expect(page.getByRole('button', { name: /gửi đánh giá/i })).toBeVisible();
  });

  test('incident report validates context without submitting', async ({ page }) => {
    await page.goto(`${env.USER_APP_URL}/incidents/new`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/booking|đặt lịch|sự cố|không hợp lệ/i);
  });

  test('messages opens only for an existing E2E conversation', async ({ page }) => {
    await page.goto(`${env.USER_APP_URL}/account/request`, { waitUntil: 'domcontentloaded' });
    const messages = page.getByRole('button', { name: /nhắn tin|tin nhắn/i }).first();
    test.skip(!(await messages.count()), 'No E2E conversation is currently available');
    await safeClick(messages);
    await expect(page).toHaveURL(/\/messages\/[^/?]+/);
  });
});
