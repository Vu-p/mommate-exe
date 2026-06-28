import { expect, test } from '@playwright/test';
import { loadE2EEnv } from './helpers/env';
import { guardMutation } from './helpers/safety';
import { expectRouteLoads, findFirstVisibleCard, skipIfMissingRecord } from './helpers/ui';

const env = loadE2EEnv();

test.describe('production cross-role journey', () => {
  test('@smoke guest discovery and authenticated booking-form journey', async ({ browser }) => {
    const guestContext = await browser.newContext();
    const guestPage = await guestContext.newPage();
    await expectRouteLoads(guestPage, env.USER_APP_URL, '/services');
    skipIfMissingRecord(
      await findFirstVisibleCard(guestPage, ['.service-card', '.premium-service-card', '[class*="service-card"]']),
      'No production service is available for the journey',
    );
    await expectRouteLoads(guestPage, env.USER_APP_URL, '/carers');
    skipIfMissingRecord(
      await findFirstVisibleCard(guestPage, ['.carer-card', '.caregiver-card', '[class*="carer-card"]']),
      'No verified production carer is available for the journey',
    );
    await guestContext.close();

    const userContext = await browser.newContext({ storageState: '../playwright/.auth/user.json' });
    const userPage = await userContext.newPage();
    await expectRouteLoads(userPage, env.USER_APP_URL, '/booking');
    await expect(userPage.locator('form')).toBeVisible();
    await userContext.close();
  });

  test('@destructive booking creation remains blocked without a safe cleanup contract', async () => {
    test.skip(!guardMutation(env), 'E2E_RUN_DESTRUCTIVE=false or cleanup is disabled');
    test.skip(true, 'Production booking creation has no proven safe delete/cleanup endpoint and remains manual QA');
  });

  test('@destructive payment, review, incident, and message mutations remain guarded', async () => {
    test.skip(!guardMutation(env, { payment: true }), 'Payment mutation requires destructive and payment test modes');
    test.skip(true, 'External-provider and customer-notification side effects remain manual QA');
  });
});
