export class AuthConfigurationError extends Error {
  code = 'AUTH_NOT_CONFIGURED';

  constructor(public readonly missing: string[]) {
    super(`Authentication configuration is missing: ${missing.join(', ')}`);
    this.name = 'AuthConfigurationError';
  }
}

export const getMissingSessionConfig = () =>
  (['JWT_SECRET', 'JWT_REFRESH_SECRET'] as const).filter((name) => !process.env[name]?.trim());

export const assertSessionConfig = () => {
  const missing = getMissingSessionConfig();
  if (missing.length) throw new AuthConfigurationError(missing);
};
