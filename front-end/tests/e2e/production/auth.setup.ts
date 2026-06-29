import fs from 'node:fs';
import path from 'node:path';
import { test as setup } from '@playwright/test';
import { loginAsAdmin, loginAsCarer, loginAsUser } from './helpers/auth';

const authDir = path.resolve(process.cwd(), '../playwright/.auth');
const AUTH_SETUP_TEST_TIMEOUT_MS = 90_000;

setup.setTimeout(AUTH_SETUP_TEST_TIMEOUT_MS);

setup.beforeAll(() => {
  fs.mkdirSync(authDir, { recursive: true });
});

setup('authenticate dedicated production user', async ({ page }) => {
  await loginAsUser(page);
  await page.context().storageState({ path: path.join(authDir, 'production-user.json') });
});

setup('authenticate dedicated production carer', async ({ page }) => {
  await loginAsCarer(page);
  await page.context().storageState({ path: path.join(authDir, 'production-carer.json') });
});

setup('authenticate dedicated production admin', async ({ page }) => {
  await loginAsAdmin(page);
  await page.context().storageState({ path: path.join(authDir, 'production-admin.json') });
});
