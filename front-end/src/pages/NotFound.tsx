import { Headphones, Home, BriefcaseMedical } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import notFoundImage from '../assets/stitch/generated/stitch-44-8a7e05175eff.png';
import './OperationalPages.css';

const NotFound = () => (
  <div className="stitch-page">
    <Navbar />
    <main className="container not-found-screen">
      <div className="not-found-illustration"><img src={notFoundImage} alt="Mẹ ôm em bé" /></div>
      <div className="not-found-copy">
        <p className="stitch-eyebrow">LỖI 404</p>
        <h1>Rất tiếc, trang bạn tìm kiếm không tồn tại</h1>
        <p>Có vẻ như địa chỉ liên kết đã bị hỏng hoặc trang này đã được di chuyển sang một vị trí mới. Đừng lo lắng, chúng tôi luôn ở đây để hỗ trợ hành trình làm mẹ của bạn.</p>
        <div className="stitch-actions">
          <Link to="/" className="stitch-primary-button"><Home size={18} />Về Trang chủ</Link>
          <Link to="/services" className="stitch-secondary-button"><BriefcaseMedical size={18} />Danh sách dịch vụ</Link>
        </div>
        <div className="not-found-support">Bạn cần hỗ trợ ngay? <a href="#contact"><Headphones />Liên hệ hỗ trợ</a></div>
      </div>
    </main>
    <Footer />
  </div>
);

export default NotFound;
