import { BetaAnalyticsDataClient } from '@google-analytics/data';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import AnalyticsCache from '../models/AnalyticsCache.js';

type ReportRequest = {
  from: string;
  to: string;
  dimensions: string[];
  metrics: string[];
  dimensionFilter?: unknown;
  metricFilter?: unknown;
  orderBys?: unknown[];
  offset?: number;
  limit?: number;
};

const propertyId = () => process.env.GA4_PROPERTY_ID?.trim();

const configurationError = (code: string, message: string, cause?: unknown) => {
  const error: any = new Error(message, cause ? { cause } : undefined);
  error.status = 503;
  error.code = code;
  return error;
};

const credentials = () => {
  const credentialPath = process.env.GA4_SERVICE_ACCOUNT_PATH?.trim();
  const json = process.env.GA4_SERVICE_ACCOUNT_JSON?.trim();
  const base64 = process.env.GA4_SERVICE_ACCOUNT_BASE64?.trim();
  if (credentialPath || json || base64) {
    try {
      const resolvedPath = credentialPath ? path.resolve(process.cwd(), credentialPath) : '';
      const source = resolvedPath && fs.existsSync(resolvedPath)
        ? fs.readFileSync(resolvedPath, 'utf8')
        : json
          ? json.replace(/^['"]|['"]$/g, '')
          : Buffer.from(base64!.replace(/^['"]|['"]$/g, '').replace(/\s+/g, ''), 'base64').toString('utf8');
      const parsed = JSON.parse(source);
      const client_email = String(parsed.client_email || '').trim();
      const private_key = String(parsed.private_key || '').replace(/\\n/g, '\n').trim();
      if (!client_email || !private_key.includes('BEGIN PRIVATE KEY')) throw new Error('Required service-account fields are missing');
      return { client_email, private_key };
    } catch (error) {
      throw configurationError('GA4_CREDENTIALS_INVALID', 'Google Analytics service-account credentials are invalid', error);
    }
  }
  const client_email = process.env.GA4_CLIENT_EMAIL?.trim();
  const private_key = process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, '\n').trim();
  return client_email && private_key ? { client_email, private_key } : undefined;
};

let client: BetaAnalyticsDataClient | undefined;
const getClient = () => {
  const id = propertyId();
  const creds = credentials();
  if (!id || !creds?.client_email || !creds.private_key) {
    throw configurationError('GA4_NOT_CONFIGURED', 'Google Analytics is not configured');
  }
  client ||= new BetaAnalyticsDataClient({ credentials: creds });
  return { client, property: `properties/${id}` };
};

const hash = (value: unknown) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

const withCache = async <T>(scope: string, input: unknown, ttlMs: number, loader: () => Promise<T>) => {
  const key = `ga4:${propertyId() || 'missing'}:${scope}:${hash(input)}`;
  const cached = await AnalyticsCache.findOne({ key, expiresAt: { $gt: new Date() } }).lean();
  if (cached) return { ...(cached.value as T), cached: true };
  const value: any = await loader();
  await AnalyticsCache.findOneAndUpdate(
    { key },
    { key, value, expiresAt: new Date(Date.now() + ttlMs) },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return { ...value, cached: false } as T & { cached: boolean };
};

const normalizeReport = (response: any) => {
  const dimensions = (response.dimensionHeaders || []).map((item: any) => item.name);
  const metrics = (response.metricHeaders || []).map((item: any) => ({ name: item.name, type: item.type }));
  const rows = (response.rows || []).map((row: any) => ({
    dimensions: Object.fromEntries(dimensions.map((name: string, index: number) => [name, row.dimensionValues?.[index]?.value || ''])),
    metrics: Object.fromEntries(metrics.map((item: any, index: number) => [item.name, Number(row.metricValues?.[index]?.value || 0)])),
  }));
  return { dimensions, metrics, rows, rowCount: Number(response.rowCount || rows.length), quota: response.propertyQuota || null };
};

const dateRange = (from: string, to: string) => [{ startDate: from, endDate: to }];
const dim = (name: string) => ({ name });
const metric = (name: string) => ({ name });

const run = async (request: ReportRequest) => {
  const { client, property } = getClient();
  const [response] = await client.runReport({
    property,
    dateRanges: dateRange(request.from, request.to),
    dimensions: request.dimensions.map(dim),
    metrics: request.metrics.map(metric),
    dimensionFilter: request.dimensionFilter as any,
    metricFilter: request.metricFilter as any,
    orderBys: request.orderBys as any,
    offset: request.offset || 0,
    limit: Math.min(request.limit || 50, 10000),
    returnPropertyQuota: true,
  });
  return normalizeReport(response);
};

const reportSpec = (dimensions: string[], metrics: string[], limit = 10, orderBys?: any[]) =>
  ({ dimensions, metrics, limit, orderBys });

export const getGa4Overview = (from: string, to: string) => withCache('overview', { from, to }, 5 * 60_000, async () => {
  const specs = {
    totals: reportSpec([], ['activeUsers', 'newUsers', 'sessions', 'engagedSessions', 'eventCount', 'keyEvents']),
    timeline: reportSpec(['date'], ['activeUsers', 'sessions', 'eventCount', 'keyEvents'], 366, [{ dimension: { dimensionName: 'date' } }]),
    acquisition: reportSpec(['sessionDefaultChannelGroup'], ['sessions', 'activeUsers', 'keyEvents'], 10, [{ metric: { metricName: 'sessions' }, desc: true }]),
    pages: reportSpec(['pagePath'], ['screenPageViews', 'activeUsers', 'averageSessionDuration'], 10, [{ metric: { metricName: 'screenPageViews' }, desc: true }]),
    events: reportSpec(['eventName'], ['eventCount', 'totalUsers'], 15, [{ metric: { metricName: 'eventCount' }, desc: true }]),
    geography: reportSpec(['country', 'city'], ['activeUsers', 'sessions'], 10, [{ metric: { metricName: 'activeUsers' }, desc: true }]),
    technology: reportSpec(['deviceCategory', 'browser'], ['activeUsers', 'sessions'], 10, [{ metric: { metricName: 'activeUsers' }, desc: true }]),
  };
  const entries = await Promise.all(Object.entries(specs).map(async ([name, spec]) => [name, await run({ from, to, ...spec })]));
  return { generatedAt: new Date().toISOString(), from, to, reports: Object.fromEntries(entries) };
});

export const getGa4Realtime = () => withCache('realtime', {}, 30_000, async () => {
  const { client, property } = getClient();
  const specs = {
    totals: { dimensions: [], metrics: ['activeUsers'] },
    pages: { dimensions: ['unifiedScreenName'], metrics: ['activeUsers'] },
    events: { dimensions: ['eventName'], metrics: ['eventCount'] },
    streams: { dimensions: ['streamName', 'platform'], metrics: ['activeUsers'] },
    devices: { dimensions: ['deviceCategory'], metrics: ['activeUsers'] },
  };
  const results = await Promise.all(Object.entries(specs).map(async ([name, spec]) => {
    try {
      const [response] = await client.runRealtimeReport({
        property,
        dimensions: spec.dimensions.map(dim),
        metrics: spec.metrics.map(metric),
        limit: 20,
        returnPropertyQuota: true,
      });
      return { name, report: normalizeReport(response) };
    } catch (error: any) {
      return { name, error: { code: error.code || 'GA4_REALTIME_REPORT_FAILED', message: 'Realtime panel is temporarily unavailable' } };
    }
  }));
  const reports = Object.fromEntries(results.filter((item) => item.report).map((item) => [item.name, item.report]));
  const errors = results.filter((item) => item.error).map((item) => ({ panel: item.name, ...item.error }));
  if (!Object.keys(reports).length) {
    const error: any = new Error('All Google Analytics realtime reports failed');
    error.status = 502;
    error.code = 'GA4_REALTIME_UNAVAILABLE';
    error.details = errors;
    throw error;
  }
  return { generatedAt: new Date().toISOString(), reports, errors };
});

export const getGa4Metadata = () => withCache('metadata', {}, 24 * 60 * 60_000, async () => {
  const { client, property } = getClient();
  const [response] = await client.getMetadata({ name: `${property}/metadata` });
  const map = (item: any) => ({ apiName: item.apiName, uiName: item.uiName, description: item.description, category: item.category, customDefinition: Boolean(item.customDefinition), deprecatedApiNames: item.deprecatedApiNames || [] });
  return { generatedAt: new Date().toISOString(), dimensions: (response.dimensions || []).map(map), metrics: (response.metrics || []).map(map) };
});

export const runGa4Report = (request: ReportRequest) => withCache('report', request, 5 * 60_000, async () => {
  const { client, property } = getClient();
  const [compatibility] = await client.checkCompatibility({
    property,
    dimensions: request.dimensions.map(dim),
    metrics: request.metrics.map(metric),
  });
  const incompatibleDimensions = (compatibility.dimensionCompatibilities || []).filter((item: any) => item.compatibility === 'INCOMPATIBLE').map((item: any) => item.dimensionMetadata?.apiName);
  const incompatibleMetrics = (compatibility.metricCompatibilities || []).filter((item: any) => item.compatibility === 'INCOMPATIBLE').map((item: any) => item.metricMetadata?.apiName);
  if (incompatibleDimensions.length || incompatibleMetrics.length) {
    const error: any = new Error('Selected dimensions and metrics are not compatible');
    error.status = 400;
    error.code = 'GA4_INCOMPATIBLE_REPORT';
    error.details = { dimensions: incompatibleDimensions, metrics: incompatibleMetrics };
    throw error;
  }
  return { generatedAt: new Date().toISOString(), from: request.from, to: request.to, ...(await run(request)), offset: request.offset || 0, limit: request.limit || 50 };
});

export const resetGa4ClientForTests = () => { client = undefined; };
