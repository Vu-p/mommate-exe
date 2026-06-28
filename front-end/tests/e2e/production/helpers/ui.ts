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

export const expectFooterOnce = async (page: Page) => {
  await expect(page.locator('footer')).toHaveCount(1);
};

export const expectNavbarOnce = async (page: Page) => {
  await expect(page.locator('nav.navbar')).toHaveCount(1);
};

export const expectRouteLoads = async (page: Page, url: string, path: string) => {
  const response = await page.goto(`${url}${path}`, { waitUntil: 'domcontentloaded' });
  expect(response?.status(), `${path} should return a successful document response`).toBeLessThan(400);
  await expect(page.locator('body')).toBeVisible();
};
