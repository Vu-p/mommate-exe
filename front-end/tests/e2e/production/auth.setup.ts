import fs from 'node:fs';
import path from 'node:path';
import { test as setup } from '@playwright/test';
import { loginAsAdmin, loginAsCarer, loginAsUser } from './helpers/auth';

const authDir = path.resolve(process.cwd(), '../playwright/.auth');

setup.beforeAll(() => {
  fs.mkdirSync(authDir, { recursive: true });
});

setup('authenticate dedicated production user', async ({ page }) => {
  await loginAsUser(page);
  await page.context().storageState({ path: path.join(authDir, 'user.json') });
});

setup('authenticate dedicated production carer', async ({ page }) => {
  await loginAsCarer(page);
  await page.context().storageState({ path: path.join(authDir, 'carer.json') });
});

setup('authenticate dedicated production admin', async ({ page }) => {
  await loginAsAdmin(page);
  await page.context().storageState({ path: path.join(authDir, 'admin.json') });
});
