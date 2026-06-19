import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BackToTop from '../components/common/BackToTop';
import heroImage from '../assets/stitch/generated/stitch-50-0a4a57cd7214.png';
import storyImage from '../assets/stitch/generated/stitch-51-1510a95a52e1.png';
import './About.css';

const About = () => (
  <div className="about-page">
    <Navbar />
    <main>
      <section className="about-redesign-hero">
        <div className="about-hero-backdrop">
          <img src={heroImage} alt="" />
        </div>
        <div className="container about-hero-copy">
          <h1>Đồng hành cùng mẹ,<br />trọn vẹn yêu thương.</h1>
          <p>MomMate ra đời với sứ mệnh mang đến sự chăm sóc chuyên nghiệp và tận tâm nhất cho phụ nữ sau sinh. Chúng tôi tin rằng mỗi người mẹ đều xứng đáng được nâng niu trong giai đoạn nhạy cảm này.</p>
          <a href="#about-story">Tìm hiểu Tiêu chuẩn của chúng tôi</a>
        </div>
      </section>

      <section className="about-redesign-story" id="about-story">
        <div className="container about-story-grid">
          <div>
            <span className="public-eyebrow">CÂU CHUYỆN CỦA CHÚNG TÔI</span>
            <h2>Tại sao MomMate ra đời?</h2>
            <p>Nỗi đau sau sinh đã sinh ra MomMate. Chị Minh Anh – một người quen của chúng tôi – đã từng ngồi khóc trong phòng tắm lúc 3 giờ sáng. Con khóc không dỗ được. Chồng đi làm xa. Bà ngoại ở quê. Suốt ba tháng đầu, chị chỉ ngủ tổng cộng chưa đầy 4 tiếng mỗi ngày. Có lần chị suýt ngã gục khi bế con đi tắm. Bác sĩ chẩn đoán chị bị trầm cảm sau sinh mức độ nặng – nguyên nhân chính đến từ sự kiệt sức kéo dài và không có người hỗ trợ đáng tin cậy. Chính nỗi đau đó sinh ra MomMate.</p>
          </div>
          <img src={storyImage} alt="Ứng dụng MomMate" />
        </div>
      </section>
    </main>
    <Footer />
    <BackToTop />
  </div>
);

export default About;
