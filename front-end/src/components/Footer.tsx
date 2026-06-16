import { Mail, Phone } from 'lucide-react';
import logo from '../assets/images/logo.png';
import './Footer.css';

const Footer = () => {
  const contactEmail = import.meta.env.VITE_CONTACT_EMAIL?.trim();
  const contactPhone = import.meta.env.VITE_CONTACT_PHONE?.trim();

  return (
    <footer className="site-footer" id="contact">
      <div className="container footer-main">
        <div className="footer-brand">
          <img src={logo} alt="Mommate" className="footer-logo-img" />
          <h3>Mommate</h3>
          <p>Hệ sinh thái chăm sóc mẹ và bé, kết nối gia đình với đội ngũ bảo mẫu và chuyên gia đáng tin cậy.</p>
        </div>

        <div className="footer-link-group">
          <h4>Sản phẩm</h4>
          <a href="/services">Dịch vụ</a>
          <a href="/carers">Chuyên gia</a>
          <a href="/account/request">Lịch đặt</a>
        </div>

        <div className="footer-link-group">
          <h4>Công ty</h4>
          <a href="/about">Về chúng tôi</a>
          <a href="#contact">Liên hệ</a>
        </div>

        <div className="footer-contact">
          <h4>Liên hệ</h4>
          {contactEmail ? (
            <a href={`mailto:${contactEmail}`}>
              <Mail size={18} />
              {contactEmail}
            </a>
          ) : (
            <span className="footer-contact-placeholder">
              <Mail size={18} />
              Email đang cập nhật
            </span>
          )}
          {contactPhone ? (
            <a href={`tel:${contactPhone.replace(/\s/g, '')}`}>
              <Phone size={18} />
              {contactPhone}
            </a>
          ) : (
            <span className="footer-contact-placeholder">
              <Phone size={18} />
              Hotline đang cập nhật
            </span>
          )}
        </div>
      </div>

      <div className="container footer-bottom">
        <p>Bản quyền © 2026</p>
        <p>Bảo lưu mọi quyền</p>
      </div>
    </footer>
  );
};

export default Footer;
