import assert from 'node:assert/strict';
import test from 'node:test';
import { calculatePublishedReviewStats } from './reviewStats.js';

test('review stats only include published reviews', () => {
  assert.deepEqual(calculatePublishedReviewStats([
    { score: 5, moderationStatus: 'published' },
    { score: 1, moderationStatus: 'pending' },
    { score: 2, moderationStatus: 'hidden' },
    { score: 4, moderationStatus: 'published' },
  ]), { rating: 4.5, reviewCount: 2 });
});

test('review stats return an empty state without published reviews', () => {
  assert.deepEqual(calculatePublishedReviewStats([
    { score: 5, moderationStatus: 'pending' },
  ]), { rating: null, reviewCount: 0 });
});
