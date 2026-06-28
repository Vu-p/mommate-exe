import { expect, test } from '@playwright/test';
import { loadE2EEnv } from './helpers/env';
import { expectRouteLoads, safeClick } from './helpers/ui';

const env = loadE2EEnv();

test.describe('production carer flows', () => {
  test('@smoke approved carer profile loads', async ({ page }) => {
    await expectRouteLoads(page, env.USER_APP_URL, '/carer/profile');
    await expect(page).toHaveURL(/\/carer\/profile/);
    await expect(page.getByText(/chuyên gia đã xác thực/i)).toBeVisible();
  });

  test('@smoke application overview and job pages load without resubmission', async ({ page }) => {
    await expectRouteLoads(page, env.USER_APP_URL, '/carer/apply');
    await expect(page).toHaveURL(/\/carer\/(apply|profile)/);
    await expectRouteLoads(page, env.USER_APP_URL, '/carer/apply/job');
    await expect(page).toHaveURL(/\/carer\/apply\/job/);
    await expect(page.locator('button.btn-submit-app')).toBeVisible();
  });

  test('job application required-field validation is represented without submitting', async ({ page }) => {
    await page.goto(`${env.USER_APP_URL}/carer/apply/job`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('textarea')).toBeVisible();
    await expect(page.locator('.service-pill').first()).toBeVisible();
    await expect(page.locator('button.btn-submit-app')).toBeEnabled();
  });

  test('@smoke carer bookings loads', async ({ page }) => {
    await expectRouteLoads(page, env.USER_APP_URL, '/carer/bookings');
    await expect(page).toHaveURL(/\/carer\/bookings/);
  });

  test('carer booking detail opens when an E2E booking exists', async ({ page }) => {
    await page.goto(`${env.USER_APP_URL}/carer/bookings`, { waitUntil: 'domcontentloaded' });
    const detail = page.getByRole('button', { name: /xem chi tiết|nhật ký chăm sóc/i }).first();
    test.skip(!(await detail.count()), 'No E2E booking is assigned to the carer');
    await safeClick(detail);
    await expect(page).toHaveURL(/\/carer\/bookings\/[^/?]+/);
  });

  test('@smoke contract page and unsigned signature area load', async ({ page }) => {
    await expectRouteLoads(page, env.USER_APP_URL, '/carer/contract');
    await expect(page).toHaveURL(/\/carer\/contract/);
    await expect(page.locator('body')).toContainText(/hợp đồng|chữ ký|ký/i);
  });
});
