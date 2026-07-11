import { BadgeCheck, CalendarCheck, Compass, HeartHandshake, Moon, ShieldCheck, Sun } from 'lucide-react';
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

      {/* PHẦN 1: TẦM NHÌN & SỨ MỆNH */}
      <section className="about-vision-mission-section">
        <div className="container about-vm-grid">
          <div className="about-vm-header">
            <span className="public-eyebrow">TẦM NHÌN VÀ SỨ MỆNH</span>
            <h2>Mẹ không cần lời an ủi xa xôi, mẹ cần một đôi tay vững vàng để thay ca.</h2>
            <p className="about-vm-lead">
              MomMate hiểu rằng chặng đường sau sinh đầy thiêng liêng nhưng cũng không ít thử thách. Chúng tôi ở đây để đảm bảo mẹ được chăm sóc đúng cách và trọn vẹn nhất.
            </p>
          </div>
          <div className="about-vm-cards">
            <article className="about-double-bezel">
              <div className="about-bezel-inner">
                <div className="about-card-icon">
                  <HeartHandshake size={28} />
                </div>
                <h3>Sứ mệnh của MomMate</h3>
                <p>
                  MomMate tự mình tìm kiếm, sàng lọc từng hộ sinh có chứng chỉ, có kinh nghiệm thực chiến và trên hết là có tâm. MomMate hiểu rằng: mẹ sau sinh không cần một lời an ủi xa xôi - mẹ cần một đôi tay vững vàng để thay ca, để mẹ được ngủ.
                </p>
              </div>
            </article>
            <article className="about-double-bezel">
              <div className="about-bezel-inner">
                <div className="about-card-icon about-icon-secondary">
                  <Compass size={28} />
                </div>
                <h3>Tầm nhìn dài hạn</h3>
                <p>
                  Tầm nhìn của chúng tôi là chuẩn hóa quy trình chăm sóc hậu sản tại Việt Nam, mang đến sự an tâm tuyệt đối cho mẹ và sự khởi đầu tốt nhất cho bé thông qua mạng lưới chuyên gia được đào tạo bài bản.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* PHẦN 2: TẠI SAO MOMMATE RA ĐỜI */}
      <section className="about-origin-section">
        <div className="container">
          <div className="about-origin-heading">
            <span className="public-eyebrow">CÂU CHUYỆN KHỞI NGUỒN</span>
            <h2>Tại sao MomMate ra đời?</h2>
            <p className="about-origin-subtitle">Nỗi đau sau sinh đã tạo nên MomMate</p>
          </div>

          <div className="about-origin-grid">
            {/* The Pain / The Night */}
            <article className="about-origin-card origin-card-night">
              <div className="origin-card-badge">
                <Moon size={18} />
                <span>Có những đêm dài chỉ mẹ mới hiểu</span>
              </div>
              <h3>3 giờ sáng, em bé khóc không ngừng...</h3>
              <div className="origin-card-body">
                <p>
                  Người mẹ trẻ gần như thức trắng nhiều tuần liền, một mình chăm con khi chồng đi làm xa và người thân không thể ở bên. Sự kiệt sức kéo dài đã khiến chị rơi vào trầm cảm sau sinh.
                </p>
                <p>
                  Đó không chỉ là câu chuyện của một người mẹ, mà là thực tế của rất nhiều phụ nữ sau sinh ở Việt Nam. Họ cần sự hỗ trợ chuyên môn nhưng lại không biết tìm người đáng tin cậy ở đâu.
                </p>
              </div>
            </article>

            {/* The Solution / The Dawn */}
            <article className="about-origin-card origin-card-dawn">
              <div className="origin-card-badge badge-dawn">
                <Sun size={18} />
                <span>Chính từ trăn trở ấy, MomMate ra đời</span>
              </div>
              <h3>Đôi tay vững vàng cho mẹ được nghỉ ngơi</h3>
              <div className="origin-card-body">
                <p>
                  MomMate kết nối các mẹ với đội ngũ hộ sinh và chuyên gia chăm sóc sau sinh đã được xác minh về chứng chỉ và kinh nghiệm. Chúng tôi tin rằng, mẹ sau sinh không chỉ cần lời động viên, mà cần một đôi tay vững vàng để được nghỉ ngơi, hồi phục và an tâm chăm sóc con.
                </p>
                <p className="origin-highlight">
                  MomMate không chỉ là một nền tảng đặt dịch vụ, mà còn là người bạn đồng hành cùng mỗi gia đình trên hành trình chào đón một em bé khỏe mạnh và hạnh phúc.
                </p>
              </div>
            </article>
          </div>
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
