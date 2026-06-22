import { BadgeCheck, CalendarCheck, HeartHandshake, ShieldCheck } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BackToTop from '../components/common/BackToTop';
import './About.css';

const About = () => (
  <div className="about-page">
    <Navbar />
    <main>
      <section className="about-redesign-hero about-neutral-hero">
        <div className="container about-hero-copy">
          <span className="public-eyebrow">MOMMATE TẠI ĐÀ NẴNG</span>
          <h1>Thêm một người đáng tin<br />bên cạnh mẹ sau sinh.</h1>
          <p>MomMate giúp gia đình tìm và đặt lịch với chuyên gia chăm sóc mẹ và bé có hồ sơ minh bạch. Nền tảng tập trung vào những dịch vụ đang thực sự có chuyên gia cung cấp, không hứa hẹn thay thế cơ sở y tế hoặc điều trị cấp cứu.</p>
          <a href="#about-story">Tìm hiểu tiêu chuẩn hoạt động</a>
        </div>
        <div className="about-neutral-visual" aria-hidden="true"><HeartHandshake /><span>Hồ sơ thật</span><span>Lịch thật</span><span>Giá thật</span></div>
      </section>

      <section className="about-redesign-story" id="about-story">
        <div className="container about-story-grid">
          <div>
            <span className="public-eyebrow">VẤN ĐỀ MOMMATE MUỐN GIẢI QUYẾT</span>
            <h2>Khi gia đình cần hỗ trợ nhưng không biết nên tin ai</h2>
            <p>Sau sinh, nhiều gia đình cần thêm người hỗ trợ nhưng khó kiểm tra chuyên môn, lịch làm việc và chi phí trước khi quyết định. MomMate được xây dựng để đưa những thông tin đó về cùng một nơi: hồ sơ chuyên gia, dịch vụ, lịch khả dụng, báo giá, thanh toán và lịch sử chăm sóc.</p>
            <p>Trong giai đoạn hiện tại, MomMate ưu tiên xây dựng mật độ chuyên gia tại Đà Nẵng và chỉ công bố những dịch vụ có dữ liệu vận hành thực tế.</p>
          </div>
          <div className="about-standard-grid">
            <article><BadgeCheck /><strong>Xác minh hồ sơ</strong><span>Trạng thái xét duyệt và chứng chỉ được quản lý trên hệ thống.</span></article>
            <article><CalendarCheck /><strong>Lịch khả dụng</strong><span>Gia đình lựa chọn dựa trên lịch chuyên gia đã công bố.</span></article>
            <article><ShieldCheck /><strong>Quy trình minh bạch</strong><span>Booking, thanh toán và thay đổi trạng thái có lịch sử rõ ràng.</span></article>
          </div>
        </div>
      </section>

      <section className="about-vision-band">
        <div className="container">
          <span>TẦM NHÌN VÀ SỨ MỆNH</span>
          <h2>Tại sao MomMate ra đời?</h2>
          <p>MomMate tự mình tìm kiếm, sàng lọc từng hộ sinh có chứng chỉ, có kinh nghiệm thực chiến và trên hết là có tâm. MomMate hiểu rằng: mẹ sau sinh không cần một lời an ủi xa xôi - mẹ cần một đôi tay vững vàng để thay ca, để mẹ được ngủ. Tầm nhìn của chúng tôi là chuẩn hóa quy trình chăm sóc hậu sản tại Việt Nam, mang đến sự an tâm tuyệt đối cho mẹ và sự khởi đầu tốt nhất cho bé thông qua mạng lưới chuyên gia được đào tạo bài bản.</p>
        </div>
      </section>

      <section className="about-founders" id="about-team">
        <div className="container">
          <div className="about-section-heading">
            <h2>Đội ngũ chuyên môn</h2>
            <p>Những người đứng sau nền tảng MomMate, kết nối chuyên gia y tế với các gia đình.</p>
          </div>
          <div className="about-founder-grid">
            <article>
              <div><BadgeCheck size={32} /></div>
              <h3>BS. Nguyễn Thị A</h3>
              <p>Trưởng ban Y tế</p>
            </article>
            <article>
              <div><HeartHandshake size={32} /></div>
              <h3>Trần Minh Tâm</h3>
              <p>Giám đốc Vận hành</p>
            </article>
            <article>
              <div><ShieldCheck size={32} /></div>
              <h3>Lê Hoàng Yến</h3>
              <p>Giám đốc Chất lượng</p>
            </article>
          </div>
        </div>
      </section>
    </main>
    <Footer />
    <BackToTop />
  </div>
);

export default About;
