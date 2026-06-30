import { isAdminApp } from '../config/appMode';

export type AnalyticsConsent = 'granted' | 'denied' | 'unknown';
type AnalyticsValue = string | number | boolean;

const CONSENT_KEY = 'mommate.analytics.consent';
const ALLOWED_PARAMETERS = new Set(['service_category', 'source_screen', 'currency', 'value', 'search_term', 'item_list_name']);
const measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID?.trim();

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let initialized = false;
const recentEvents = new Map<string, number>();

export const getAnalyticsConsent = (): AnalyticsConsent => {
  if (typeof window === 'undefined') return 'unknown';
  const value = window.localStorage.getItem(CONSENT_KEY);
  return value === 'granted' || value === 'denied' ? value : 'unknown';
};

const ensureGtag = () => {
  window.dataLayer ||= [];
  window.gtag ||= (...args: unknown[]) => { window.dataLayer!.push(args); };
};

export const initializeAnalytics = () => {
  if (initialized) return true;
  if (isAdminApp || !measurementId || getAnalyticsConsent() !== 'granted') return false;
  ensureGtag();
  window.gtag!('js', new Date());
  window.gtag!('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  window.gtag!('config', measurementId, { send_page_view: false, anonymize_ip: true });
  if (!document.querySelector(`script[data-mommate-ga4="${measurementId}"]`)) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    script.dataset.mommateGa4 = measurementId;
    document.head.appendChild(script);
  }
  initialized = true;
  return true;
};

export const grantAnalyticsConsent = () => {
  localStorage.setItem(CONSENT_KEY, 'granted');
  ensureGtag();
  window.gtag!('consent', 'update', { analytics_storage: 'granted' });
  initializeAnalytics();
  window.dispatchEvent(new CustomEvent('mommate:analytics-consent', { detail: 'granted' }));
};

export const denyAnalyticsConsent = () => {
  localStorage.setItem(CONSENT_KEY, 'denied');
  if (window.gtag) window.gtag('consent', 'update', { analytics_storage: 'denied' });
  window.dispatchEvent(new CustomEvent('mommate:analytics-consent', { detail: 'denied' }));
};

export const openAnalyticsPreferences = () => window.dispatchEvent(new Event('mommate:open-analytics-preferences'));

const safeParameters = (parameters: Record<string, AnalyticsValue>) => Object.fromEntries(
  Object.entries(parameters).filter(([key, value]) => ALLOWED_PARAMETERS.has(key) && ['string', 'number', 'boolean'].includes(typeof value)),
);

export const trackPageView = (path: string, title = document.title) => {
  if (getAnalyticsConsent() !== 'granted' || !initializeAnalytics() || !window.gtag) return;
  window.gtag('event', 'page_view', { page_title: title, page_location: `${window.location.origin}${path}` });
};

export const trackEvent = (name: string, parameters: Record<string, AnalyticsValue> = {}) => {
  if (!/^[a-z][a-z0-9_]{0,39}$/.test(name) || getAnalyticsConsent() !== 'granted' || !initializeAnalytics() || !window.gtag) return;
  const safe = safeParameters(parameters);
  const fingerprint = `${name}:${JSON.stringify(safe)}`;
  const now = Date.now();
  if (now - (recentEvents.get(fingerprint) || 0) < 1000) return;
  recentEvents.set(fingerprint, now);
  window.gtag('event', name, safe);
};

export const analyticsConfigured = Boolean(measurementId) && !isAdminApp;
