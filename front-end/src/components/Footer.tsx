import { Link, useLocation } from 'react-router-dom';
import { Globe2, Mail, Phone, Share2 } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const { pathname } = useLocation();
  const contactEmail = import.meta.env.VITE_CONTACT_EMAIL?.trim();
  const contactPhone = import.meta.env.VITE_CONTACT_PHONE?.trim();

  if (pathname === '/about') {
    return (
      <footer className="site-footer about-footer" id="contact">
        <div className="container marketplace-footer-main">
          <div><h3>MaternalCare</h3><p>Kết nối các gia đình với những chuyên gia sau sinh hàng đầu thông qua nền tảng tin cậy y khoa và an toàn.</p></div>
          <div><h4>Công ty</h4><Link to="/about">Về chúng tôi</Link><Link to="/careers">Tuyển dụng</Link><Link to="/contact">Hỗ trợ liên hệ</Link></div>
          <div><h4>Dịch vụ</h4><Link to="/carers">Nhân viên y tế xác minh</Link><Link to="/services">Tư vấn nuôi con bằng sữa mẹ</Link><Link to="/services">Điều dưỡng ban đêm</Link></div>
          <div><h4>Pháp lý</h4><Link to="/privacy">Chính sách bảo mật</Link><Link to="/terms">Điều khoản dịch vụ</Link><Link to="/help">Trung tâm trợ giúp</Link></div>
        </div>
        <div className="container marketplace-footer-bottom">
          <p>© 2024 MaternalCare Professional Services. Tất cả quyền được bảo lưu.</p>
          <div><Globe2 /><Share2 /></div>
        </div>
      </footer>
    );
  }

  if (pathname === '/route-khong-ton-tai') {
    return (
      <footer className="site-footer not-found-footer" id="contact">
        <div className="container marketplace-footer-main">
          <div><h3>MaternalCare</h3><p>Cung cấp các dịch vụ chăm sóc mẹ và bé chuyên nghiệp, tận tâm và hiện đại nhất tại Việt Nam.</p></div>
          <div><h4>Dịch vụ</h4><Link to="/services">Chăm sóc sau sinh</Link><Link to="/services">Bảo mẫu chuyên nghiệp</Link><Link to="/services">Tư vấn dinh dưỡng</Link></div>
          <div><h4>Hỗ trợ</h4><Link to="/about">About Us</Link><Link to="/help">Help Center</Link><Link to="/privacy">Privacy Policy</Link><Link to="/terms">Terms of Service</Link></div>
          <div><h4>Kết nối</h4><div className="footer-network-icons"><Globe2 /><Mail /><Phone /></div><p>© 2024 MaternalCare Professional Services.<br />All rights reserved.</p></div>
        </div>
      </footer>
    );
  }

  if (pathname === '/carers') {
    return (
      <footer className="site-footer marketplace-footer" id="contact">
        <div className="container marketplace-footer-main">
          <div><h3>MaternalCare</h3><p>Nền tảng kết nối gia đình và đội ngũ điều dưỡng chuyên nghiệp, tận tâm nhất.</p></div>
          <div><h4>CÔNG TY</h4><Link to="/about">About Us</Link><Link to="/help">Help Center</Link><Link to="/contact">Contact Support</Link></div>
          <div><h4>PHÁP LÝ</h4><Link to="/privacy">Privacy Policy</Link><Link to="/terms">Terms of Service</Link><Link to="/carers">Verified Medical Personnel</Link></div>
          <div><h4>BẢN TIN</h4><p>Nhận cập nhật về dịch vụ mới nhất.</p><form><input aria-label="Email của bạn" placeholder="Email của bạn" /><button type="button">Gửi</button></form></div>
        </div>
        <div className="container marketplace-footer-bottom">
          <p>© 2024 MaternalCare Professional Services. All rights reserved.</p>
          <div><Globe2 /><Share2 /></div>
        </div>
      </footer>
    );
  }

  if (pathname === '/services') {
    return (
      <footer className="site-footer service-search-footer" id="contact">
        <div className="container marketplace-footer-main">
          <div><h3>MaternalCare</h3><p>Hệ thống cung cấp dịch vụ chăm sóc y tế tại gia chuyên nghiệp cho mẹ và bé hàng đầu Việt Nam.</p></div>
          <div><h4>Công ty</h4><Link to="/about">About Us</Link><Link to="/carers">Verified Medical Personnel</Link><Link to="/contact">Contact Support</Link></div>
          <div><h4>Pháp lý</h4><Link to="/privacy">Privacy Policy</Link><Link to="/terms">Terms of Service</Link></div>
          <div><h4>Trợ giúp</h4><Link to="/help">Help Center</Link><strong className="footer-hotline"><Phone />1900 1234</strong></div>
        </div>
        <div className="container service-footer-bottom">© 2024 MaternalCare Professional Services. All rights reserved.</div>
      </footer>
    );
  }

  if (pathname.startsWith('/services/')) {
    return (
      <footer className="site-footer service-detail-footer" id="contact">
        <div className="container marketplace-footer-main">
          <div><h3>MaternalCare</h3><p>Hệ thống đặt lịch chăm sóc sức khỏe mẹ và bé tại nhà uy tín hàng đầu tại Đà Nẵng và Việt Nam.</p></div>
          <div><h4>Liên kết</h4><Link to="/about">About Us</Link><Link to="/help">Help Center</Link><Link to="/privacy">Privacy Policy</Link></div>
          <div><h4>Dịch vụ</h4><Link to="/services">Chăm sóc sau sinh</Link><Link to="/services">Massage bầu</Link><Link to="/services">Tắm bé tại nhà</Link></div>
          <div><h4>Liên hệ</h4><p>Hotline: 1900 123 456</p><p>Email: contact@maternalcare.com</p></div>
        </div>
        <div className="service-detail-footer-bottom">© 2024 MaternalCare Professional Services. All rights reserved.</div>
      </footer>
    );
  }

  if (pathname.startsWith('/carers/')) {
    return (
      <footer className="site-footer carer-detail-footer" id="contact">
        <div className="container marketplace-footer-main">
          <div><h3>MaternalCare</h3><p>Kết nối các gia đình với những chuyên gia lâm sàng hàng đầu cho hành trình quan trọng nhất của cuộc đời họ.</p></div>
          <div><h4>TÀI NGUYÊN</h4><Link to="/about">Về chúng tôi</Link><Link to="/help">Trung tâm trợ giúp</Link><Link to="/carers">Nhân sự đã xác minh</Link></div>
          <div><h4>PHÁP LÝ</h4><Link to="/privacy">Chính sách bảo mật</Link><Link to="/terms">Điều khoản dịch vụ</Link></div>
          <div><h4>LIÊN HỆ</h4><p>Hỗ trợ 24/7: support@maternalcare.pro</p><div className="footer-network-icons"><Globe2 /><Share2 /></div></div>
        </div>
        <div className="container service-footer-bottom">© 2024 Dịch vụ chuyên nghiệp MaternalCare. Bảo lưu mọi quyền.</div>
      </footer>
    );
  }

  return (
    <footer className="site-footer" id="contact">
      <div className="container footer-main">
        <div className="footer-brand">
          <Link to="/" className="footer-brand-lockup">
            <h3>MaternalCare</h3>
          </Link>
          <p>Nền tảng kết nối gia đình với đội ngũ chăm sóc mẹ và bé có hồ sơ minh bạch, lịch làm việc rõ ràng và quy trình đặt lịch an toàn.</p>
        </div>
        <div className="footer-link-group">
          <h4>Hỗ trợ</h4>
          <Link to="/help">Trung tâm trợ giúp</Link>
          <Link to="/faq">Câu hỏi thường gặp</Link>
          <Link to="/guide">Hướng dẫn đặt lịch</Link>
        </div>
        <div className="footer-link-group">
          <h4>Liên kết nhanh</h4>
          <Link to="/services">Dịch vụ</Link>
          <Link to="/carers">Người chăm sóc</Link>
          <Link to="/account/profile">Hồ sơ chăm sóc</Link>
        </div>
        <div className="footer-contact">
          <h4>Liên hệ</h4>
          {contactPhone ? <a href={`tel:${contactPhone.replace(/\s/g, '')}`}><Phone size={18} />{contactPhone}</a> : <span className="footer-contact-placeholder"><Phone size={18} />1900 1234</span>}
          {contactEmail ? <a href={`mailto:${contactEmail}`}><Mail size={18} />{contactEmail}</a> : <span className="footer-contact-placeholder"><Mail size={18} />contact@maternalcare.vn</span>}
        </div>
      </div>
      <div className="container footer-bottom">
        <p>© 2026 MaternalCare Professional Services. Tất cả quyền được bảo lưu.</p>
        <div className="footer-legal-links">
          <Link to="/privacy">Chính sách bảo mật</Link>
          <Link to="/terms">Điều khoản sử dụng</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
