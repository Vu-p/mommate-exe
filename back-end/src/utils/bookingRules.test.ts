import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateBookingPrice, distanceMeters, isOutsideFreeCancellationWindow, isWithinCheckInWindow, overlaps } from './bookingRules.js';

test('server pricing ignores client totals and derives fee/payout', () => {
  assert.deepEqual(calculateBookingPrice({ unitPrice: 100_000, hours: 4, sessions: 2, platformFeePercent: 15 }), {
    totalPrice: 800_000,
    platformFeeAmount: 120_000,
    carerPayoutAmount: 680_000,
  });
});

test('schedule overlap uses half-open intervals', () => {
  const start = new Date('2026-06-20T08:00:00Z');
  const end = new Date('2026-06-20T10:00:00Z');
  assert.equal(overlaps(start, end, new Date('2026-06-20T09:00:00Z'), new Date('2026-06-20T11:00:00Z')), true);
  assert.equal(overlaps(start, end, end, new Date('2026-06-20T11:00:00Z')), false);
});

test('24-hour cancellation boundary is inclusive', () => {
  const now = new Date('2026-06-20T08:00:00Z');
  assert.equal(isOutsideFreeCancellationWindow(new Date('2026-06-21T08:00:00Z'), now), true);
  assert.equal(isOutsideFreeCancellationWindow(new Date('2026-06-21T07:59:59Z'), now), false);
});

test('check-in window permits -15 to +30 minutes', () => {
  const scheduled = new Date('2026-06-20T08:00:00Z');
  assert.equal(isWithinCheckInWindow(scheduled, new Date('2026-06-20T07:45:00Z')), true);
  assert.equal(isWithinCheckInWindow(scheduled, new Date('2026-06-20T08:30:00Z')), true);
  assert.equal(isWithinCheckInWindow(scheduled, new Date('2026-06-20T08:31:00Z')), false);
});

test('GPS distance is suitable for attendance radius checks', () => {
  const meters = distanceMeters({ latitude: 16.0544, longitude: 108.2022 }, { latitude: 16.0545, longitude: 108.2022 });
  assert.ok(meters > 10 && meters < 12);
});
