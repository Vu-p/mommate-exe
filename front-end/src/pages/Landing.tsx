import { Baby, HeartHandshake, Info, Search, ShieldCheck, Stethoscope, WalletCards } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Hero from '../components/landing/Hero';
import Services from '../components/landing/Services';
import Testimonials from '../components/landing/Testimonials';
import BackToTop from '../components/common/BackToTop';
import './Landing.css';

const members = [
  ['Mai Đăng Bảo Châu', 'Điều hành'],
  ['Trần Vân Ánh', 'Marketing'],
  ['Đặng Trí Dũng', 'Marketing'],
  ['Phan Trần Công Vũ', 'Kỹ thuật'],
  ['Bùi Tường Vân', 'Thiết kế'],
  ['Lê Công Tiến Trung', 'Thiết kế'],
];

const initials = (name: string) => name.split(' ').slice(-2).map((part) => part[0]).join('').toUpperCase();

const Landing = () => (
  <div className="landing-page">
    <Navbar />
    <main>
      <Hero />
      <section className="marketplace-proof">
        <div className="container marketplace-proof-grid">
          <div><ShieldCheck /><strong>Hồ sơ chuyên môn</strong><span>Chuyên gia công khai bằng cấp, kinh nghiệm và trạng thái xác minh.</span></div>
          <div><HeartHandshake /><strong>Chăm sóc phù hợp</strong><span>Gia đình chọn dịch vụ và chuyên gia theo nhu cầu, khu vực và lịch khả dụng.</span></div>
          <div><WalletCards /><strong>Giá cả minh bạch</strong><span>Chi phí được backend tính và xác nhận trước khi thanh toán.</span></div>
        </div>
      </section>

      <section className="home-journey">
        <div className="container">
          <h2>TỪ NHU CẦU ĐẾN MỘT CA CHĂM SÓC AN TOÀN</h2>
          <p>Quy trình rõ ràng giúp gia đình tìm đúng người, đúng dịch vụ và theo dõi toàn bộ lịch chăm sóc.</p>
          <div className="home-journey-grid">
            <article><b>1</b><h3>Chọn nhu cầu</h3><p>Tìm dịch vụ theo tình trạng của mẹ, bé, khu vực và thời gian mong muốn.</p></article>
            <article><b>2</b><h3>Kiểm tra hồ sơ</h3><p>Xem kinh nghiệm, chứng chỉ, đánh giá đã duyệt và lịch khả dụng của chuyên gia.</p></article>
            <article><b>3</b><h3>Đặt lịch minh bạch</h3><p>Nhận báo giá từ hệ thống, thanh toán và theo dõi trạng thái ngay trên tài khoản.</p></article>
          </div>
        </div>
      </section>

      <Services />
      <Testimonials />

      <section className="home-team">
        <div className="container">
          <h2>Đội ngũ xây dựng MomMate</h2>
          <p>Thông tin thành viên được trình bày bằng visual trung tính cho đến khi có bộ ảnh chính thức được xác minh.</p>
          <div className="home-team-grid">
            {members.map(([name, role]) => <article key={name}><div className="team-initials" aria-hidden="true">{initials(name)}</div><h3>{name}</h3><span>{role}</span></article>)}
          </div>
        </div>
      </section>

      <section className="landing-dual-cta">
        <div className="container landing-dual-cta-grid">
          <article className="landing-cta-parent"><div><h2>Dành cho gia đình</h2><p>Tìm chuyên gia đã xác minh và đặt lịch chăm sóc phù hợp tại Đà Nẵng.</p><Link to="/carers">Tìm chuyên gia <Search size={17} /></Link></div><Baby className="landing-cta-watermark" /></article>
          <article className="landing-cta-carer"><div><h2>Dành cho chuyên gia</h2><p>Đăng ký hồ sơ chuyên môn và theo dõi quy trình xét duyệt minh bạch.</p><Link to="/carer/apply">Đăng ký chuyên gia <Info size={17} /></Link></div><Stethoscope className="landing-cta-watermark" /></article>
        </div>
      </section>
    </main>
    <Footer />
    <BackToTop />
  </div>
);

export default Landing;
