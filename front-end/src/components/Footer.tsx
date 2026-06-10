import { Mail, Phone } from 'lucide-react';
import logo from '../assets/images/logo.png';
import './Footer.css';

const Footer = () => {
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
          <a href="/booking">Đặt lịch</a>
          <a href="/review">Đánh giá</a>
          <a href="/caregiver/apply/overview">Đăng ký bảo mẫu</a>
        </div>

        <div className="footer-link-group">
          <h4>Công ty</h4>
          <a href="/about">Về chúng tôi</a>
          <a href="#contact">Liên hệ</a>
        </div>

        <div className="footer-contact">
          <h4>Liên hệ</h4>
          <a href="mailto:contact@company.com">
            <Mail size={18} />
            contact@company.com
          </a>
          <a href="tel:+84000000000">
            <Phone size={18} />
            (xx) xxxx-xxxx
          </a>
        </div>
      </div>

      <div className="container footer-bottom">
        <p>Bản quyền © 2023</p>
        <p>Bảo lưu mọi quyền</p>
      </div>
    </footer>
  );
};

export default Footer;
