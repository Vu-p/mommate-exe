import { Baby, BookOpenCheck, CalendarCheck, HeartHandshake, ShieldCheck } from 'lucide-react';
import BackToTop from '../components/common/BackToTop.tsx';
import ScrollReveal from '../components/common/ScrollReveal.tsx';
import Footer from '../components/Footer.tsx';
import Navbar from '../components/Navbar.tsx';
import serviceOne from '../assets/images/service-1.png';
import serviceTwo from '../assets/images/service-2.png';
import signupMock from '../assets/images/signup-mock.png';
import './About.css';

const solutionItems = [
  {
    icon: ShieldCheck,
    title: 'Kết nối bảo mẫu uy tín',
    description: 'Sàng lọc và xác thực hồ sơ kinh nghiệm nghề.',
  },
  {
    icon: CalendarCheck,
    title: 'Quy trình có khoa học',
    description: 'Thiết lập lộ trình hồi phục sức khỏe.',
  },
  {
    icon: HeartHandshake,
    title: 'Hỗ trợ sức khỏe tinh thần',
    description: 'Lắng nghe và tư vấn tâm lý chuyên sâu.',
  },
  {
    icon: BookOpenCheck,
    title: 'Kiến thức chăm con',
    description: 'Cập nhật cẩm nang mẹ và bé định kỳ.',
  },
];

const teamMembers = [
  { name: 'Mai Đăng Bảo Châu', role: 'CEO', image: signupMock },
  { name: 'Trần Vân Ánh', role: 'CTO & Co-founder', image: serviceTwo },
  { name: 'Phan Trần Công Vũ', role: 'Product Developer', image: serviceOne },
  { name: 'Đặng Trí Dũng', role: 'Marketing', image: serviceOne },
  { name: 'Lê Công Tiến Trung', role: 'UX/UI Designer', image: serviceTwo },
  { name: 'Bùi Tường Vân', role: 'UX/UI Designer', image: signupMock },
];

const About = () => {
  return (
    <div className="about-page">
      <Navbar />
      <main>
        <section className="about-hero">
          <div className="container about-hero-inner">
            <p className="about-eyebrow">Về chúng tôi</p>
            <h1>Đồng hành cùng mẹ, từ những ngày đầu tiên</h1>
            <p>
              Theo Tổ chức Y tế Thế giới, khoảng 13% phụ nữ sau sinh trải qua rối loạn
              tâm thần. Mommate ra đời để thay đổi điều đó bằng một hệ sinh thái chăm sóc
              mẹ và bé đáng tin cậy.
            </p>
          </div>
        </section>

        <ScrollReveal>
          <section className="about-story about-section">
            <div className="container about-split">
              <div className="about-image-panel">
                <img src={serviceOne} alt="Mẹ chăm em bé sau sinh" />
              </div>
              <div className="about-copy">
                <p className="about-eyebrow">Câu chuyện thương hiệu</p>
                <h2>Tại sao Mommate ra đời?</h2>
                <p>
                  Chào mừng bạn đến với Mommate, nơi chúng tôi thấu hiểu những lo lắng
                  và thách thức của người mẹ trong hành trình thiêng liêng này. Chúng tôi
                  xây dựng giải pháp dựa trên tình yêu thương và khoa học y khoa hiện đại.
                </p>
                <a className="about-pill-link" href="#solutions">Xem thêm</a>
              </div>
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal delay={0.05}>
          <section className="about-vision about-section">
            <div className="container about-split reverse">
              <div className="about-copy">
                <p className="about-eyebrow">Tầm nhìn</p>
                <h2>Nơi chăm sóc sau sinh trở thành chuẩn mực</h2>
                <p>
                  Tầm nhìn của chúng tôi là chuẩn hóa quy trình chăm sóc hậu sản tại Việt
                  Nam, mang đến sự an tâm tuyệt đối cho mẹ và sự khởi đầu tốt nhất cho bé
                  thông qua mạng lưới chuyên gia được đào tạo bài bản.
                </p>
                <a className="about-pill-link" href="#team">Xem thêm</a>
              </div>
              <div className="about-image-panel wide">
                <img src={serviceTwo} alt="Tư vấn chăm sóc mẹ và bé" />
              </div>
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal delay={0.08}>
          <section className="about-solutions" id="solutions">
            <div className="container">
              <div className="about-section-heading">
                <h2>MomMate giải quyết điều gì?</h2>
                <p>Dịch vụ và giải pháp toàn diện</p>
              </div>
              <div className="solution-grid">
                {solutionItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <article className="solution-card" key={item.title}>
                      <span className="solution-icon">
                        <Icon size={22} />
                      </span>
                      <div>
                        <h3>{item.title}</h3>
                        <p>{item.description}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal delay={0.08}>
          <section className="about-team about-section" id="team">
            <div className="container">
              <div className="about-section-heading">
                <h2>Meet our team members</h2>
                <p>Đội ngũ chuyên gia tâm huyết với nhiều năm kinh nghiệm trong lĩnh vực sản nhi.</p>
              </div>
              <div className="team-grid">
                {teamMembers.map((member) => (
                  <article className="team-member" key={member.name}>
                    <img src={member.image} alt={member.name} />
                    <h3>{member.name}</h3>
                    <p>{member.role}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal delay={0.08}>
          <section className="about-consult">
            <div className="container about-consult-inner">
              <span className="consult-icon">
                <Baby size={30} />
              </span>
              <h2>Đăng ký để nhận tư vấn!</h2>
              <p>Để lại email, Mommate sẽ liên hệ và tư vấn gói chăm sóc phù hợp cho gia đình bạn.</p>
              <form className="consult-form">
                <input type="email" placeholder="Nhập email" aria-label="Email tư vấn" />
                <button type="submit">Đăng kí</button>
              </form>
            </div>
          </section>
        </ScrollReveal>
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
};

export default About;
