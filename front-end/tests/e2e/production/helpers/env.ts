import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type E2EEnv = {
  USER_APP_URL: string;
  ADMIN_APP_URL: string;
  API_BASE_URL: string;
  E2E_USER_EMAIL: string;
  E2E_USER_PASSWORD: string;
  E2E_CARER_EMAIL: string;
  E2E_CARER_PASSWORD: string;
  E2E_ADMIN_EMAIL: string;
  E2E_ADMIN_PASSWORD: string;
  E2E_ACCOUNT_PREFIX: string;
  E2E_TEST_PHONE: string;
  E2E_TEST_ADDRESS: string;
  E2E_PAYMENT_TEST_MODE: boolean;
  E2E_RUN_DESTRUCTIVE: boolean;
  E2E_CLEANUP: boolean;
};

const requiredKeys = [
  'USER_APP_URL',
  'ADMIN_APP_URL',
  'API_BASE_URL',
  'E2E_USER_EMAIL',
  'E2E_USER_PASSWORD',
  'E2E_CARER_EMAIL',
  'E2E_CARER_PASSWORD',
  'E2E_ADMIN_EMAIL',
  'E2E_ADMIN_PASSWORD',
  'E2E_ACCOUNT_PREFIX',
  'E2E_TEST_PHONE',
  'E2E_TEST_ADDRESS',
  'E2E_PAYMENT_TEST_MODE',
  'E2E_RUN_DESTRUCTIVE',
  'E2E_CLEANUP',
] as const;

type RequiredKey = typeof requiredKeys[number];

const parseEnv = (source: string) => {
  const values: Record<string, string> = {};
  for (const rawLine of source.split(/\r?\n/)) {
    const match = rawLine.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[match[1]] = value;
  }
  return values;
};

const resolveEnvPath = () => {
  const helperDir = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(process.cwd(), '.env.e2e.production.local'),
    path.resolve(process.cwd(), '../.env.e2e.production.local'),
    path.resolve(helperDir, '../../../../../../.env.e2e.production.local'),
  ];
  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) throw new Error('Missing ignored .env.e2e.production.local');
  return found;
};

export const requireEnv = (values: Record<string, string>, key: RequiredKey) => {
  const value = values[key]?.trim();
  if (!value) throw new Error(`Missing required E2E environment key: ${key}`);
  return value;
};

const parseBoolean = (value: string, key: RequiredKey) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`${key} must be true or false`);
};

const normalizeUrl = (value: string, key: RequiredKey) => {
  const url = new URL(value);
  if (url.protocol !== 'https:') throw new Error(`${key} must use HTTPS for production tests`);
  return url.toString().replace(/\/$/, '');
};

let cachedEnv: E2EEnv | undefined;

export const loadE2EEnv = (): E2EEnv => {
  if (cachedEnv) return cachedEnv;
  const fileValues = parseEnv(fs.readFileSync(resolveEnvPath(), 'utf8'));
  const values = { ...fileValues, ...process.env } as Record<string, string>;
  for (const key of requiredKeys) requireEnv(values, key);

  cachedEnv = {
    USER_APP_URL: normalizeUrl(requireEnv(values, 'USER_APP_URL'), 'USER_APP_URL'),
    ADMIN_APP_URL: normalizeUrl(requireEnv(values, 'ADMIN_APP_URL'), 'ADMIN_APP_URL'),
    API_BASE_URL: normalizeUrl(requireEnv(values, 'API_BASE_URL'), 'API_BASE_URL'),
    E2E_USER_EMAIL: requireEnv(values, 'E2E_USER_EMAIL'),
    E2E_USER_PASSWORD: requireEnv(values, 'E2E_USER_PASSWORD'),
    E2E_CARER_EMAIL: requireEnv(values, 'E2E_CARER_EMAIL'),
    E2E_CARER_PASSWORD: requireEnv(values, 'E2E_CARER_PASSWORD'),
    E2E_ADMIN_EMAIL: requireEnv(values, 'E2E_ADMIN_EMAIL'),
    E2E_ADMIN_PASSWORD: requireEnv(values, 'E2E_ADMIN_PASSWORD'),
    E2E_ACCOUNT_PREFIX: requireEnv(values, 'E2E_ACCOUNT_PREFIX'),
    E2E_TEST_PHONE: requireEnv(values, 'E2E_TEST_PHONE'),
    E2E_TEST_ADDRESS: requireEnv(values, 'E2E_TEST_ADDRESS'),
    E2E_PAYMENT_TEST_MODE: parseBoolean(requireEnv(values, 'E2E_PAYMENT_TEST_MODE'), 'E2E_PAYMENT_TEST_MODE'),
    E2E_RUN_DESTRUCTIVE: parseBoolean(requireEnv(values, 'E2E_RUN_DESTRUCTIVE'), 'E2E_RUN_DESTRUCTIVE'),
    E2E_CLEANUP: parseBoolean(requireEnv(values, 'E2E_CLEANUP'), 'E2E_CLEANUP'),
  };
  return cachedEnv;
};
