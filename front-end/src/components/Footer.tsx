import { Facebook, Instagram, Linkedin, Mail, Phone, Twitter, Youtube } from 'lucide-react';
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
          <div className="footer-social-links">
            <a href="#" aria-label="Facebook"><Facebook size={18} /></a>
            <a href="#" aria-label="Twitter"><Twitter size={18} /></a>
            <a href="#" aria-label="Instagram"><Instagram size={18} /></a>
            <a href="#" aria-label="LinkedIn"><Linkedin size={18} /></a>
            <a href="#" aria-label="YouTube"><Youtube size={18} /></a>
          </div>
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
          <a href="/#about">Về chúng tôi</a>
          <a href="#contact">Liên hệ</a>
          <a href="/#careers">Tuyển dụng</a>
          <a href="/#culture">Văn hóa</a>
          <a href="/#blog">Blog</a>
        </div>

        <div className="footer-link-group">
          <h4>Hỗ trợ</h4>
          <a href="/#getting-started">Bắt đầu</a>
          <a href="/#help">Trung tâm trợ giúp</a>
          <a href="/#status">Trạng thái dịch vụ</a>
          <a href="/#bug-report">Báo lỗi</a>
          <a href="/#chat">Hỗ trợ trực tuyến</a>
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
        <p>
          Bảo lưu mọi quyền | <a href="/terms">Terms and Conditions</a> | <a href="/privacy">Privacy Policy</a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
