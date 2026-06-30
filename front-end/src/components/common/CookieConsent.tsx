import { useEffect, useState } from 'react';
import { Cookie, ShieldCheck, X } from 'lucide-react';
import { analyticsConfigured, denyAnalyticsConsent, getAnalyticsConsent, grantAnalyticsConsent } from '../../utils/analytics';
import './CookieConsent.css';

const CookieConsent = () => {
  const [open, setOpen] = useState(() => analyticsConfigured && getAnalyticsConsent() === 'unknown');

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener('mommate:open-analytics-preferences', show);
    return () => window.removeEventListener('mommate:open-analytics-preferences', show);
  }, []);

  if (!open || !analyticsConfigured) return null;

  return <aside className="cookie-consent" role="dialog" aria-modal="false" aria-labelledby="cookie-title">
    <button className="cookie-close" aria-label="Đóng tùy chọn cookie" onClick={() => setOpen(false)}><X size={18} /></button>
    <span className="cookie-icon"><Cookie size={22} /></span>
    <div><h2 id="cookie-title">Quyền riêng tư của bạn</h2><p>MomMate chỉ dùng cookie phân tích sau khi bạn đồng ý. Dữ liệu sức khỏe và thông tin nhận dạng không được gửi tới Google Analytics.</p><small><ShieldCheck size={14} /> Bạn có thể thay đổi lựa chọn trong Chính sách bảo mật.</small></div>
    <div className="cookie-actions">
      <button onClick={() => { denyAnalyticsConsent(); setOpen(false); }}>Từ chối</button>
      <button className="accept" onClick={() => { grantAnalyticsConsent(); setOpen(false); }}>Đồng ý phân tích</button>
    </div>
  </aside>;
};

export default CookieConsent;
