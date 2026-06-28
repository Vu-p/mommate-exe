import type { E2EEnv } from './env';

const secretKeys = /password|token|cookie|authorization|api[_-]?key|secret|mongodb|database[_-]?url/i;

export const redactSecrets = (value: unknown, env?: E2EEnv): unknown => {
  const knownSecrets = env
    ? [env.E2E_USER_PASSWORD, env.E2E_CARER_PASSWORD, env.E2E_ADMIN_PASSWORD].filter(Boolean)
    : [];

  if (typeof value === 'string') {
    return knownSecrets.reduce((result, secret) => result.split(secret).join('[REDACTED]'), value);
  }
  if (Array.isArray(value)) return value.map((entry) => redactSecrets(entry, env));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [
      key,
      secretKeys.test(key) ? '[REDACTED]' : redactSecrets(entry, env),
    ]));
  }
  return value;
};
