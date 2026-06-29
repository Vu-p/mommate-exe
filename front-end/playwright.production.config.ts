import { defineConfig, devices } from '@playwright/test';
import { loadE2EEnv } from './tests/e2e/production/helpers/env';

const env = loadE2EEnv();
const authDir = '../playwright/.auth';

export default defineConfig({
  testDir: './tests/e2e/production',
  testMatch: /.*\.(setup|spec)\.ts/,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  outputDir: '../test-results/production',
  reporter: [
    ['list'],
    ['html', { outputFolder: '../playwright-report/production', open: 'never' }],
  ],
  use: {
    baseURL: env.USER_APP_URL,
    viewport: { width: 1280, height: 900 },
    colorScheme: 'light',
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'production-setup-user',
      testMatch: /auth\.setup\.ts/,
      grep: /dedicated production user/,
    },
    {
      name: 'production-setup-carer',
      testMatch: /auth\.setup\.ts/,
      grep: /dedicated production carer/,
    },
    {
      name: 'production-setup-admin',
      testMatch: /auth\.setup\.ts/,
      grep: /dedicated production admin/,
    },
    {
      name: 'production-guest',
      testMatch: /guest\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'production-user',
      testMatch: /user\.spec\.ts/,
      dependencies: ['production-setup-user'],
      use: { storageState: `${authDir}/production-user.json` },
    },
    {
      name: 'production-carer',
      testMatch: /carer\.spec\.ts/,
      dependencies: ['production-setup-carer'],
      use: { storageState: `${authDir}/production-carer.json` },
    },
    {
      name: 'production-admin',
      testMatch: /admin\.spec\.ts/,
      dependencies: ['production-setup-admin'],
      use: { storageState: `${authDir}/production-admin.json` },
    },
    {
      name: 'production-journey',
      testMatch: /full-journey\.spec\.ts/,
      dependencies: ['production-setup-user'],
      use: { storageState: `${authDir}/production-user.json` },
    },
  ],
});
