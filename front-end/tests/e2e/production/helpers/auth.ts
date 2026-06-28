import { expect, type Page } from '@playwright/test';
import { loadE2EEnv, type E2EEnv } from './env';

type RoleCredentials = {
  appUrl: string;
  email: string;
  password: string;
  expectedPath: string | RegExp;
};

const login = async (page: Page, credentials: RoleCredentials) => {
  await page.goto(`${credentials.appUrl}/login`, { waitUntil: 'domcontentloaded' });
  const form = page.locator('.login-form');
  await expect(form).toBeVisible();
  await form.locator('input[type="email"]').fill(credentials.email);
  await form.locator('input[type="password"]').fill(credentials.password);
  await form.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(credentials.expectedPath);
};

export const loginAsUser = async (page: Page, env: E2EEnv = loadE2EEnv()) => {
  await login(page, {
    appUrl: env.USER_APP_URL,
    email: env.E2E_USER_EMAIL,
    password: env.E2E_USER_PASSWORD,
    expectedPath: new RegExp(`^${escapeRegExp(env.USER_APP_URL)}/?$`),
  });
};

export const loginAsCarer = async (page: Page, env: E2EEnv = loadE2EEnv()) => {
  await login(page, {
    appUrl: env.USER_APP_URL,
    email: env.E2E_CARER_EMAIL,
    password: env.E2E_CARER_PASSWORD,
    expectedPath: new RegExp(`^${escapeRegExp(env.USER_APP_URL)}/?$`),
  });
};

export const loginAsAdmin = async (page: Page, env: E2EEnv = loadE2EEnv()) => {
  await login(page, {
    appUrl: env.ADMIN_APP_URL,
    email: env.E2E_ADMIN_EMAIL,
    password: env.E2E_ADMIN_PASSWORD,
    expectedPath: new RegExp(`^${escapeRegExp(env.ADMIN_APP_URL)}/admin/dashboard/?$`),
  });
};

export const logoutIfAvailable = async (page: Page) => {
  const adminLogout = page.locator('button.logout-btn:visible');
  if (await adminLogout.count()) {
    await adminLogout.click();
    await expect(page).toHaveURL(/\/(auth|login)(\?|$)/);
    return;
  }

  const accountToggle = page.locator('.user-dropdown-toggle:visible');
  if (await accountToggle.count()) {
    await accountToggle.click();
    const logout = page.locator('.user-dropdown-menu button.logout:visible');
    if (await logout.count()) {
      await logout.click();
      await expect(page).toHaveURL(/\/$/);
    }
  }
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
