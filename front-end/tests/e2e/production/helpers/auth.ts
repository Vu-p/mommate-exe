import { expect, type Page, type Response } from '@playwright/test';
import { loadE2EEnv, type E2EEnv } from './env';

type RoleCredentials = {
  role: 'user' | 'carer' | 'admin';
  appKind: 'user' | 'admin';
  appUrl: string;
  email: string;
  password: string;
  expectedPath: string | RegExp;
};

type LoginCategory =
  | 'invalid-credentials'
  | 'unauthorized'
  | 'role-rejected'
  | 'inactive-account'
  | 'network-error'
  | 'cors-error'
  | 'timeout-waiting-for-redirect'
  | 'ui-validation-blocked-submit'
  | 'temporary-server-error'
  | 'unknown';

type LoginAttempt = {
  success: boolean;
  transient: boolean;
  status?: number;
  category: LoginCategory;
  pathname: string;
  storagePresent: boolean;
  cookiePresent: boolean;
};

const loginErrorSelector = '.auth-message.error-message, .form-alert, [role="alert"]';
const maxRetries = 2;
export const AUTH_NAV_MAX_ATTEMPTS = 3;
export const AUTH_NAV_ATTEMPT_TIMEOUT_MS = 12_000;
export const AUTH_NAV_BACKOFF_MS = [1_000, 2_000] as const;

type NavigationCategory = 'navigation-timeout' | 'blank-page' | 'network' | 'temporary-server-error' | 'unknown';
type PreflightCategory = 'reachable' | 'client-error' | 'server-error' | 'unreachable';

const navigationCategory = (error: unknown): NavigationCategory => {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  if (message.includes('timeout')) return 'navigation-timeout';
  if (message.includes('net::') || message.includes('network') || message.includes('connection')) return 'network';
  return 'unknown';
};

const preflightLogin = async (page: Page, appUrl: string): Promise<PreflightCategory> => {
  try {
    const response = await page.request.get(`${appUrl}/login`, {
      failOnStatusCode: false,
      timeout: 8_000,
    });
    if (response.status() >= 500) return 'server-error';
    if (response.status() >= 400) return 'client-error';
    return 'reachable';
  } catch {
    return 'unreachable';
  }
};

const inspectNavigationState = async (page: Page) => {
  if (page.isClosed()) {
    return { loginForm: false, appRoot: false, dashboard: false, profile: false, blank: true };
  }
  const [loginForm, appRoot, dashboard, profile, blank] = await Promise.all([
    page.locator('.login-form, input[type="email"]').first().isVisible().catch(() => false),
    page.locator('#root > *').first().isVisible().catch(() => false),
    page.locator('.admin-layout').isVisible().catch(() => false),
    page.locator('.user-dropdown-toggle').isVisible().catch(() => false),
    page.evaluate(() => {
      const root = document.querySelector('#root');
      return document.body.innerText.trim() === '' && (!root || root.childElementCount === 0);
    }).catch(() => true),
  ]);
  return { loginForm, appRoot, dashboard, profile, blank };
};

const waitForNavigationState = async (page: Page, timeoutMs: number) => {
  const deadline = Date.now() + Math.max(0, timeoutMs);
  let state = await inspectNavigationState(page);
  while (!state.loginForm && !state.dashboard && !state.profile && Date.now() < deadline) {
    await page.waitForTimeout(200);
    state = await inspectNavigationState(page);
  }
  return state;
};

const gotoLoginWithRetry = async (page: Page, credentials: RoleCredentials) => {
  let finalCategory: NavigationCategory = 'unknown';
  let loginFormVisible = false;
  let dashboardVisible = false;
  let appRootVisible = false;
  let pageBlank = false;
  let finalPathname = '/';
  let attempts = 0;
  const strategy = 'commit+selector';
  const preflight = await preflightLogin(page, credentials.appUrl);

  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  for (let attempt = 1; attempt <= AUTH_NAV_MAX_ATTEMPTS; attempt += 1) {
    attempts = attempt;
    await page.context().clearCookies();
    let responseStatus: number | undefined;
    const attemptStartedAt = Date.now();
    try {
      const response = await page.goto(`${credentials.appUrl}/login`, {
        waitUntil: 'commit',
        timeout: Math.min(8_000, AUTH_NAV_ATTEMPT_TIMEOUT_MS),
      });
      responseStatus = response?.status();
      finalCategory = responseStatus && responseStatus >= 500 ? 'temporary-server-error' : 'unknown';
    } catch (error) {
      finalCategory = navigationCategory(error);
    }

    if (!page.isClosed()) {
      finalPathname = new URL(page.url()).pathname;
      const remaining = AUTH_NAV_ATTEMPT_TIMEOUT_MS - (Date.now() - attemptStartedAt);
      let state = await waitForNavigationState(page, Math.min(3_000, Math.max(0, remaining)));
      if (state.blank && Date.now() - attemptStartedAt < AUTH_NAV_ATTEMPT_TIMEOUT_MS - 1_000) {
        const reloadBudget = Math.min(5_000, AUTH_NAV_ATTEMPT_TIMEOUT_MS - (Date.now() - attemptStartedAt));
        await page.reload({ waitUntil: 'commit', timeout: reloadBudget }).catch(() => undefined);
      }
      if (!state.loginForm && !state.dashboard && !state.profile) {
        state = await waitForNavigationState(
          page,
          Math.max(0, AUTH_NAV_ATTEMPT_TIMEOUT_MS - (Date.now() - attemptStartedAt)),
        );
      }
      loginFormVisible = state.loginForm;
      dashboardVisible = state.dashboard || state.profile;
      appRootVisible = state.appRoot;
      pageBlank = state.blank;
      if (pageBlank) finalCategory = 'blank-page';
    }

    if (loginFormVisible) return;
    if (responseStatus && responseStatus < 500 && dashboardVisible) {
      const existingStorage = await page.evaluate(() => Boolean(localStorage.getItem('userInfo'))).catch(() => false);
      const existingCookies = (await page.context().cookies().catch(() => [])).length > 0;
      if (existingStorage || existingCookies) return;
    }
    if (attempt < AUTH_NAV_MAX_ATTEMPTS && !page.isClosed()) {
      await page.goto('about:blank', { waitUntil: 'commit', timeout: 5_000 }).catch(() => undefined);
      await page.waitForTimeout(AUTH_NAV_BACKOFF_MS[attempt - 1]);
    }
  }

  throw new Error([
    'Sanitized navigation failure',
    `role=${credentials.role}`,
    `app=${credentials.appKind}`,
    'path=/login',
    `attempts=${attempts}`,
    `attemptTimeoutMs=${AUTH_NAV_ATTEMPT_TIMEOUT_MS}`,
    `strategy=${strategy}`,
    `preflight=${preflight}`,
    `category=${finalCategory}`,
    `pathname=${finalPathname}`,
    `loginForm=${loginFormVisible ? 'present' : 'missing'}`,
    `appRoot=${appRootVisible ? 'present' : 'missing'}`,
    `blank=${pageBlank ? 'present' : 'missing'}`,
    `dashboard=${dashboardVisible ? 'present' : 'missing'}`,
  ].join(' '));
};

const cleanAuthState = async (page: Page, credentials: RoleCredentials) => {
  await page.context().clearCookies();
  await gotoLoginWithRetry(page, credentials);
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
};

const categorizeLoginFailure = async (
  page: Page,
  response: Response | null,
  errorVisible: boolean,
): Promise<LoginCategory> => {
  if (!response) return 'network-error';
  const status = response.status();
  const errorText = errorVisible
    ? ((await page.locator(loginErrorSelector).first().textContent()) || '').toLowerCase()
    : '';
  if (status >= 500) return 'temporary-server-error';
  if (status === 401 || /invalid|incorrect|không đúng|không hợp lệ/.test(errorText)) return 'invalid-credentials';
  if (/suspend|inactive|tạm khóa|vô hiệu/.test(errorText)) return 'inactive-account';
  if (/quyền|role|admin/.test(errorText)) return 'role-rejected';
  if (status === 403) return 'unauthorized';
  if (status === 0) return 'cors-error';
  if (errorVisible) return 'unauthorized';
  return 'timeout-waiting-for-redirect';
};

const runLoginAttempt = async (page: Page, credentials: RoleCredentials): Promise<LoginAttempt> => {
  const form = page.locator('.login-form');
  await expect(form).toBeVisible();
  await form.locator('input[type="email"]').fill(credentials.email);
  await form.locator('input[type="password"]').fill(credentials.password);

  const responsePromise = page.waitForResponse(
    (response) => response.request().method() === 'POST' && new URL(response.url()).pathname.endsWith('/auth/login'),
    { timeout: 20_000 },
  ).catch(() => null);
  await form.locator('button[type="submit"]').click();
  const response = await responsePromise;

  const redirectSucceeded = await page.waitForURL(credentials.expectedPath, { timeout: 15_000 })
    .then(() => true)
    .catch(() => false);
  const errorVisible = await page.locator(loginErrorSelector).first().isVisible();
  const storagePresent = await page.evaluate(() => Boolean(localStorage.getItem('userInfo')));
  const cookiePresent = (await page.context().cookies()).length > 0;

  if (redirectSucceeded && storagePresent) {
    return {
      success: true,
      transient: false,
      status: response?.status(),
      category: 'unknown',
      pathname: new URL(page.url()).pathname,
      storagePresent,
      cookiePresent,
    };
  }

  const category = await categorizeLoginFailure(page, response, errorVisible);
  const transient = !response || response.status() >= 500 || (!errorVisible && category === 'timeout-waiting-for-redirect');
  return {
    success: false,
    transient,
    status: response?.status(),
    category: errorVisible ? category : response ? category : 'network-error',
    pathname: new URL(page.url()).pathname,
    storagePresent,
    cookiePresent,
  };
};

const login = async (page: Page, credentials: RoleCredentials) => {
  let lastAttempt: LoginAttempt | undefined;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    await cleanAuthState(page, credentials);
    lastAttempt = await runLoginAttempt(page, credentials);
    if (lastAttempt.success) return;
    if (!lastAttempt.transient || attempt === maxRetries) break;
    await page.waitForTimeout(750 * (attempt + 1));
  }

  if (!lastAttempt) throw new Error('Login setup failed before an attempt could be recorded');
  throw new Error([
    'Sanitized login failure',
    'endpoint=/auth/login',
    `status=${lastAttempt.status ?? 'missing'}`,
    `category=${lastAttempt.category}`,
    `pathname=${lastAttempt.pathname}`,
    `storage=${lastAttempt.storagePresent ? 'present' : 'missing'}`,
    `cookie=${lastAttempt.cookiePresent ? 'present' : 'missing'}`,
  ].join(' '));
};

export const loginAsUser = async (page: Page, env: E2EEnv = loadE2EEnv()) => {
  await login(page, {
    role: 'user',
    appKind: 'user',
    appUrl: env.USER_APP_URL,
    email: env.E2E_USER_EMAIL,
    password: env.E2E_USER_PASSWORD,
    expectedPath: new RegExp(`^${escapeRegExp(env.USER_APP_URL)}/?$`),
  });
};

export const loginAsCarer = async (page: Page, env: E2EEnv = loadE2EEnv()) => {
  await login(page, {
    role: 'carer',
    appKind: 'user',
    appUrl: env.USER_APP_URL,
    email: env.E2E_CARER_EMAIL,
    password: env.E2E_CARER_PASSWORD,
    expectedPath: new RegExp(`^${escapeRegExp(env.USER_APP_URL)}/?$`),
  });
};

export const loginAsAdmin = async (page: Page, env: E2EEnv = loadE2EEnv()) => {
  await login(page, {
    role: 'admin',
    appKind: 'admin',
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
