import { Link } from 'react-router-dom';
import { Facebook, Globe2, Instagram, Mail, Phone } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const contactEmail = import.meta.env.VITE_CONTACT_EMAIL?.trim();
  const contactPhone = import.meta.env.VITE_CONTACT_PHONE?.trim();
  const facebookUrl = import.meta.env.VITE_FACEBOOK_URL?.trim();
  const instagramUrl = import.meta.env.VITE_INSTAGRAM_URL?.trim();
  const websiteUrl = import.meta.env.VITE_WEBSITE_URL?.trim();

  return (
    <footer className="site-footer" id="contact">
      <div className="container footer-main">
        <div className="footer-brand">
          <Link to="/" className="footer-brand-lockup"><h3>MomMate</h3></Link>
          <p>Nền tảng kết nối gia đình tại Đà Nẵng với chuyên gia chăm sóc mẹ và bé có hồ sơ, lịch làm việc và quy trình đặt lịch minh bạch.</p>
        </div>
        <div className="footer-link-group">
          <h4>Khám phá</h4>
          <Link to="/services">Dịch vụ</Link>
          <Link to="/carers">Chuyên gia</Link>
          <Link to="/about">Về MomMate</Link>
          <Link to="/careers">Tuyển dụng</Link>
        </div>
        <div className="footer-link-group">
          <h4>Hỗ trợ</h4>
          <Link to="/help">Trung tâm trợ giúp</Link>
          <Link to="/faq">Câu hỏi thường gặp</Link>
          <Link to="/guide">Hướng dẫn đặt lịch</Link>
          <Link to="/contact">Báo lỗi website</Link>
        </div>
        <div className="footer-contact">
          <h4>Liên hệ</h4>
          {contactPhone && <a href={`tel:${contactPhone.replace(/\s/g, '')}`}><Phone size={18} />{contactPhone}</a>}
          {contactEmail && <a href={`mailto:${contactEmail}`}><Mail size={18} />{contactEmail}</a>}
          <div className="footer-network-icons">
            {websiteUrl && <a href={websiteUrl} target="_blank" rel="noreferrer" aria-label="Website"><Globe2 /></a>}
            {facebookUrl && <a href={facebookUrl} target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook /></a>}
            {instagramUrl && <a href={instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram /></a>}
          </div>
        </div>
      </div>
      <div className="container footer-bottom">
        <p>© 2026 MomMate. Tất cả quyền được bảo lưu.</p>
        <div className="footer-legal-links"><Link to="/privacy">Chính sách bảo mật</Link><Link to="/terms">Điều khoản sử dụng</Link></div>
      </div>
    </footer>
  );
};

export default Footer;
