import assert from 'node:assert/strict';
import test from 'node:test';
import { assertSessionConfig, AuthConfigurationError, getMissingSessionConfig } from './authConfig.js';

test('session configuration reports missing JWT secrets', () => {
  const previousAccess = process.env.JWT_SECRET;
  const previousRefresh = process.env.JWT_REFRESH_SECRET;

  delete process.env.JWT_SECRET;
  delete process.env.JWT_REFRESH_SECRET;

  try {
    assert.deepEqual(getMissingSessionConfig(), ['JWT_SECRET', 'JWT_REFRESH_SECRET']);
    assert.throws(() => assertSessionConfig(), AuthConfigurationError);
  } finally {
    if (previousAccess === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousAccess;
    if (previousRefresh === undefined) delete process.env.JWT_REFRESH_SECRET;
    else process.env.JWT_REFRESH_SECRET = previousRefresh;
  }
});

test('session configuration accepts both JWT secrets', () => {
  const previousAccess = process.env.JWT_SECRET;
  const previousRefresh = process.env.JWT_REFRESH_SECRET;

  process.env.JWT_SECRET = 'access-test-secret';
  process.env.JWT_REFRESH_SECRET = 'refresh-test-secret';

  try {
    assert.deepEqual(getMissingSessionConfig(), []);
    assert.doesNotThrow(() => assertSessionConfig());
  } finally {
    if (previousAccess === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousAccess;
    if (previousRefresh === undefined) delete process.env.JWT_REFRESH_SECRET;
    else process.env.JWT_REFRESH_SECRET = previousRefresh;
  }
});
