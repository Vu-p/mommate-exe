import { Baby, CalendarCheck, HeartHandshake, Image, Info, Search, ShieldCheck, Stethoscope, WalletCards } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Hero from '../components/landing/Hero';
import BackToTop from '../components/common/BackToTop';
import postpartumImage from '../assets/stitch/generated/stitch-46-4c9ac1902c34.png';
import babyImage from '../assets/stitch/generated/stitch-47-0f78d38f14ba.png';
import lactationImage from '../assets/stitch/generated/stitch-48-b9ff115eab19.png';
import './Landing.css';

const services = [
  { title: 'Chăm sóc sau sinh', text: 'Phục hồi sức khỏe cho mẹ, kiểm tra vết mổ và ổn định đường huyết.', price: 'Từ 500k/buổi', image: postpartumImage, badge: 'PHỔ BIẾN NHẤT' },
  { title: 'Tắm bé & Massage', text: 'Quy trình tắm bé chuẩn bệnh viện, massage thư giãn giúp bé ngủ ngon.', price: 'Từ 300k/buổi', image: babyImage },
  { title: 'Thông tắc tia sữa', text: 'Hỗ trợ kích sữa, xử lý tắc tia sữa bằng phương pháp vật lý trị liệu an toàn.', price: 'Từ 600k/buổi', image: lactationImage },
];

const members = [
  ['Mai Đăng Bảo Châu', 'CEO'],
  ['Trần Vân Ánh', 'MARKETING'],
  ['Đặng Trí Dũng', 'MARKETING'],
  ['Phan Trần Công Vũ', 'IT'],
  ['Bùi Tường Vân', 'UX/UI'],
  ['Lê Công Tiến Trung', 'UX/UI'],
];

const Landing = () => (
  <div className="landing-page">
    <Navbar />
    <main>
      <Hero />
      <section className="marketplace-proof">
        <div className="container marketplace-proof-grid">
          <div><ShieldCheck /><strong>Chuyên môn Y tế</strong><span>100% nhân sự là Điều dưỡng hoặc Nữ hộ sinh có chứng chỉ hành nghề chính quy.</span></div>
          <div><HeartHandshake /><strong>Xác thực hồ sơ</strong><span>Lý lịch và bằng cấp được kiểm chứng nghiêm ngặt bởi ban cố vấn y tế của MomMate.</span></div>
          <div><WalletCards /><strong>Giá cả minh bạch</strong><span>Chi phí hiển thị rõ ràng, không phụ phí ẩn, thanh toán an toàn qua ứng dụng.</span></div>
        </div>
      </section>

      <section className="home-journey">
        <div className="container">
          <h2>LỘ TRÌNH ĐẾN DỊCH VỤ CHĂM SÓC CHUYÊN NGHIỆP</h2>
          <p>Quy trình đơn giản giúp bạn tìm được sự chăm sóc tốt nhất cho mẹ và bé từ MaternalCare.</p>
          <div className="home-journey-grid">
            <article><b>1</b><h3>Xác định Nhu cầu</h3><p>Hoàn thành hồ sơ chăm sóc trong 2 phút chi tiết về nhu cầu y tế, lịch trình và sở thích của bạn.</p></article>
            <article><b>2</b><h3>Kết nối & Phỏng vấn</h3><p>Xem các hồ sơ chuyên gia đã xác minh và đặt lịch tư vấn video miễn phí 15 phút.</p></article>
            <article><b>3</b><h3>Đặt lịch An toàn</h3><p>Xác nhận lịch trình của bạn với thanh toán được bảo vệ và bắt đầu nhận sự chăm sóc chuyên gia.</p></article>
          </div>
        </div>
      </section>

      <section className="home-services">
        <div className="container">
          <div className="home-heading"><div><h2>Dịch vụ nổi bật</h2><p>Giải pháp chăm sóc toàn diện cho gia đình hiện đại.</p></div><Link to="/services">Xem tất cả dịch vụ →</Link></div>
          <div className="home-service-grid">
            {services.map((service) => <Link to="/services" key={service.title} className="home-service-card"><div className="home-service-image"><img src={service.image} alt="" />{service.badge && <span>{service.badge}</span>}</div><div><h3>{service.title}</h3><p>{service.text}</p><strong>{service.price}</strong><b>＋</b></div></Link>)}
          </div>
        </div>
      </section>

      <section className="home-team">
        <div className="container">
          <h2>Đội ngũ thành viên</h2>
          <p>Đội ngũ MomMate là những cá nhân tận tâm từ nhiều lĩnh vực khác nhau</p>
          <div className="home-team-grid">
            {members.map(([name, role]) => <article key={name}><div><Image /></div><h3>{name}</h3><span>{role}</span></article>)}
          </div>
        </div>
      </section>

      <section className="landing-dual-cta">
        <div className="container landing-dual-cta-grid">
          <article className="landing-cta-parent"><div><h2>Dành cho ba mẹ</h2><p>Hãy để MomMate đồng hành cùng gia đình bạn trong những ngày đầu đón thành viên mới.</p><Link to="/carers">Tìm chuyên viên ngay <Search size={17} /></Link></div><Baby className="landing-cta-watermark" /></article>
          <article className="landing-cta-carer"><div><h2>Dành cho chuyên gia</h2><p>Chúng tôi chỉ chấp nhận hồ sơ được mời hoặc giới thiệu từ các đối tác y tế uy tín.</p><Link to="/about">Tìm hiểu quy trình <Info size={17} /></Link></div><Stethoscope className="landing-cta-watermark" /></article>
        </div>
      </section>
    </main>
    <Footer />
    <BackToTop />
  </div>
);

export default Landing;
