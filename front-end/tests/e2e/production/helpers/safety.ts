import type { E2EEnv } from './env';

export type E2ECleanupRecord = {
  id: string;
  label: string;
};

export const guardMutation = (env: E2EEnv, options: { payment?: boolean } = {}) => {
  if (!env.E2E_RUN_DESTRUCTIVE) return false;
  if (!env.E2E_CLEANUP) return false;
  if (options.payment && !env.E2E_PAYMENT_TEST_MODE) return false;
  return true;
};

export const cleanupE2EData = async (
  env: E2EEnv,
  records: E2ECleanupRecord[],
  cleanup: (record: E2ECleanupRecord) => Promise<void>,
) => {
  if (!env.E2E_CLEANUP) throw new Error('E2E cleanup is disabled');
  const unsafeRecord = records.find((record) => !record.label.startsWith(env.E2E_ACCOUNT_PREFIX));
  if (unsafeRecord) throw new Error('Refusing cleanup for a record without the configured E2E prefix');
  for (const record of records) await cleanup(record);
};

export const isClearlyE2E = (env: E2EEnv, value?: string | null) =>
  Boolean(value?.trim().toLowerCase().includes(env.E2E_ACCOUNT_PREFIX.trim().toLowerCase()));
