import { expect, test, type Locator, type Page } from '@playwright/test';

export const expectNoHorizontalOverflow = async (page: Page) => {
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
};

export const safeClick = async (locator: Locator) => {
  await expect(locator).toBeVisible();
  await expect(locator).toBeEnabled();
  await locator.scrollIntoViewIfNeeded();
  await locator.click();
};

export const skipIfMissingRecord = <T>(record: T | null | undefined, reason: string): T => {
  test.skip(!record, reason);
  if (!record) throw new Error(reason);
  return record;
};

export const findFirstVisibleCard = async (page: Page, selectors: string[]) => {
  for (const selector of selectors) {
    const candidates = page.locator(selector);
    for (let index = 0; index < await candidates.count(); index += 1) {
      const candidate = candidates.nth(index);
      if (await candidate.isVisible()) return candidate;
    }
  }
  return null;
};

export const expectSiteFooterOnce = async (page: Page) => {
  await expect(page.locator('footer.site-footer')).toHaveCount(1);
};

export const expectNavbarOnce = async (page: Page) => {
  await expect(page.locator('nav.navbar')).toHaveCount(1);
};

export const expectRouteLoads = async (page: Page, url: string, path: string) => {
  const response = await page.goto(`${url}${path}`, { waitUntil: 'domcontentloaded' });
  expect(response?.status(), `${path} should return a successful document response`).toBeLessThan(400);
  await expect(page.locator('body')).toBeVisible();
};

export type BookingContextResult =
  | { ready: true }
  | { ready: false; reason: string };

export const openBookingFormFromFirstAvailableService = async (
  page: Page,
  userAppUrl: string,
): Promise<BookingContextResult> => {
  await page.goto(`${userAppUrl}/services`, { waitUntil: 'domcontentloaded' });
  const serviceCard = await findFirstVisibleCard(page, ['.service-card-premium']);
  if (!serviceCard) return { ready: false, reason: 'No visible production service card is available' };

  const serviceAction = serviceCard.locator('button.service-card-hitarea');
  if (!(await serviceAction.count())) return { ready: false, reason: 'The visible service card has no safe detail action' };
  await safeClick(serviceAction);
  await expect(page).toHaveURL(/\/services\/[^/?]+/);

  const bookingAction = page.locator('.stitch-booking-card button').first();
  if (!(await bookingAction.count()) || !(await bookingAction.isEnabled())) {
    return { ready: false, reason: 'The selected service has no active verified carer' };
  }
  await safeClick(bookingAction);
  await expect(page).toHaveURL(/\/carers\?[^#]*serviceId=/);

  const carerCard = await findFirstVisibleCard(page, ['.carer-list-item.clickable']);
  if (!carerCard) return { ready: false, reason: 'No visible verified carer offers the selected service' };
  await safeClick(carerCard);
  await expect(page).toHaveURL(/\/booking$/);

  const form = page.locator('form#booking-request-form');
  if (!(await form.isVisible())) return { ready: false, reason: 'Booking context was selected but the form did not render' };
  return { ready: true };
};
