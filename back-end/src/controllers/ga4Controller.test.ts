import assert from 'node:assert/strict';
import test from 'node:test';
import { dateValues, parseGa4ReportBody } from './ga4Controller.js';

test('GA4 report validation accepts a compatible-shaped explorer request', () => {
  const result = parseGa4ReportBody({
    from: '2026-06-01', to: '2026-06-30', dimensions: ['pagePath'], metrics: ['screenPageViews'],
    dimensionFilter: { filter: { fieldName: 'pagePath', stringFilter: { value: '/services' } } },
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }], limit: 25, offset: 0,
  });
  assert.equal(result.dimensionFilter.filter.stringFilter.matchType, 'CONTAINS');
  assert.equal(result.orderBys?.[0].metric.metricName, 'screenPageViews');
});

test('GA4 report validation rejects unknown filter fields and invalid pagination', () => {
  assert.throws(() => parseGa4ReportBody({ dimensions: ['pagePath'], metrics: ['sessions'], dimensionFilter: { filter: { fieldName: 'email', stringFilter: { value: 'x' } } } }), /selected dimension/);
  assert.throws(() => parseGa4ReportBody({ dimensions: [], metrics: ['sessions'], limit: 1001 }), /pagination/);
});

test('GA4 date validation accepts relative ranges and rejects malformed dates', () => {
  assert.deepEqual(dateValues('28daysAgo', 'today'), { from: '28daysAgo', to: 'today' });
  assert.throws(() => dateValues('yesterday', 'today'), /date range/);
});
