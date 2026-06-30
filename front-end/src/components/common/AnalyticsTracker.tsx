import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { getAnalyticsConsent, trackPageView } from '../../utils/analytics';

const AnalyticsTracker = () => {
  const location = useLocation();
  const lastPath = useRef('');

  useEffect(() => {
    const path = `${location.pathname}${location.search}`;
    const send = () => {
      if (lastPath.current === path || getAnalyticsConsent() !== 'granted') return;
      lastPath.current = path;
      window.setTimeout(() => trackPageView(path), 0);
    };
    send();
    window.addEventListener('mommate:analytics-consent', send);
    return () => window.removeEventListener('mommate:analytics-consent', send);
  }, [location.pathname, location.search]);

  return null;
};

export default AnalyticsTracker;
