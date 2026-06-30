import type { NextFunction, Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import { getGa4Metadata, getGa4Overview, getGa4Realtime, runGa4Report } from '../services/ga4Service.js';

const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const safeName = /^[A-Za-z][A-Za-z0-9_]*$/;

export const dateValues = (fromValue?: unknown, toValue?: unknown) => {
  const to = String(toValue || new Date().toISOString().slice(0, 10));
  const from = String(fromValue || '28daysAgo');
  const validRelative = /^\d+daysAgo$/;
  if ((!isoDate.test(from) && !validRelative.test(from)) || (!isoDate.test(to) && to !== 'today')) {
    const error: any = new Error('Invalid GA4 date range'); error.status = 400; error.code = 'INVALID_DATE_RANGE'; throw error;
  }
  return { from, to };
};

const dateParams = (req: AuthRequest) => dateValues(req.query.from, req.query.to);

export const parseGa4ReportBody = (body: any) => {
  const dimensions = Array.isArray(body?.dimensions) ? body.dimensions.map(String) : [];
  const metrics = Array.isArray(body?.metrics) ? body.metrics.map(String) : [];
  if (!metrics.length || dimensions.length > 9 || metrics.length > 10 || [...dimensions, ...metrics].some((name) => !safeName.test(name))) {
    const error: any = new Error('Report requires 1-10 metrics, up to 9 dimensions, and valid API names'); error.status = 400; error.code = 'INVALID_REPORT'; throw error;
  }
  const limit = Number(body.limit || 50);
  const offset = Number(body.offset || 0);
  if (!Number.isInteger(limit) || limit < 1 || limit > 1000 || !Number.isInteger(offset) || offset < 0) {
    const error: any = new Error('Invalid report pagination'); error.status = 400; error.code = 'INVALID_PAGINATION'; throw error;
  }
  let dimensionFilter: any;
  const filter = body.dimensionFilter?.filter;
  if (filter) {
    const fieldName = String(filter.fieldName || '');
    const value = String(filter.stringFilter?.value || '').slice(0, 200);
    if (!dimensions.includes(fieldName) || !value) {
      const error: any = new Error('Dimension filter must target a selected dimension'); error.status = 400; error.code = 'INVALID_FILTER'; throw error;
    }
    dimensionFilter = { filter: { fieldName, stringFilter: { matchType: 'CONTAINS', value, caseSensitive: Boolean(filter.stringFilter?.caseSensitive) } } };
  }
  const orderBys = Array.isArray(body.orderBys) ? body.orderBys.slice(0, 2).map((item: any) => {
    const dimensionName = item?.dimension?.dimensionName;
    const metricName = item?.metric?.metricName;
    if (dimensionName && dimensions.includes(dimensionName)) return { dimension: { dimensionName }, desc: Boolean(item.desc) };
    if (metricName && metrics.includes(metricName)) return { metric: { metricName }, desc: Boolean(item.desc) };
    const error: any = new Error('Sort must target a selected dimension or metric'); error.status = 400; error.code = 'INVALID_SORT'; throw error;
  }) : undefined;
  const { from, to } = dateValues(body.from, body.to);
  return { from, to, dimensions, metrics, dimensionFilter, orderBys, offset, limit };
};

const handle = (action: (req: AuthRequest) => Promise<unknown>) => async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { res.json(await action(req)); } catch (error) { next(error); }
};

export const ga4Overview = handle(async (req) => { const { from, to } = dateParams(req); return getGa4Overview(from, to); });
export const ga4Realtime = handle(async () => getGa4Realtime());
export const ga4Metadata = handle(async () => getGa4Metadata());
export const ga4Report = handle(async (req) => {
  return runGa4Report(parseGa4ReportBody(req.body || {}));
});
