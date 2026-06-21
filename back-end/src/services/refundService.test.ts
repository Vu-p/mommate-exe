import assert from 'node:assert/strict';
import test from 'node:test';
import { processRefund } from './refundService.js';

test('manual refund requires a provider reference', async () => {
  await assert.rejects(
    () => processRefund({ amount: 100000, reason: 'Cancellation' }),
    /requires a bank or PayOS payout reference/,
  );
});

test('manual refund returns a completed provider result', async () => {
  const result = await processRefund({ amount: 100000, reason: 'Cancellation', providerReference: 'BANK-REF-001' });
  assert.deepEqual(result, { provider: 'manual', status: 'completed', providerReference: 'BANK-REF-001' });
});

test('refund rejects non-positive amounts', async () => {
  await assert.rejects(
    () => processRefund({ amount: 0, reason: 'Cancellation', providerReference: 'BANK-REF-001' }),
    /greater than zero/,
  );
});
