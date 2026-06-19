import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Baby,
  Cake,
  Droplets,
  HeartPulse,
  Plus,
  Ruler,
  Scale,
  UserRound,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './AccountProfile.css';

type Profile = {
  firstName?: string;
  lastName?: string;
  email?: string;
};

const AccountProfile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }

    api.get('/users/me')
      .then(({ data }) => setProfile(data))
      .catch(() => setProfile(user))
      .finally(() => setLoading(false));
  }, [authLoading, navigate, user]);

  if (authLoading || loading) {
    return (
      <div className="care-profile-page">
        <Navbar />
        <main className="care-profile-loading">Đang tải hồ sơ chăm sóc...</main>
      </div>
    );
  }

  const parentName = `${profile.firstName || user?.firstName || 'Thuỳ'} ${profile.lastName || user?.lastName || 'Dương'}`.trim();

  return (
    <div className="care-profile-page">
      <Navbar />

      <main className="container care-profile-content">
        <header className="care-profile-heading">
          <div>
            <h1>Hồ sơ chăm sóc</h1>
            <p>Lưu trữ và quản lý thông tin sức khỏe cho cả gia đình.</p>
          </div>
          <button type="button" className="care-profile-edit">Cập nhật hồ sơ</button>
        </header>

        <div className="care-profile-grid">
          <aside className="family-profile-list">
            <h2>Thành viên gia đình</h2>
            <button type="button" className="family-profile active">
              <span><UserRound size={23} /></span>
              <div><strong>Mẹ {parentName}</strong><small>Chính chủ</small></div>
            </button>
            <button type="button" className="family-profile">
              <span className="baby-avatar"><Baby size={23} /></span>
              <div><strong>Bé Bơ</strong><small>12 ngày tuổi</small></div>
            </button>
            <button type="button" className="family-profile add">
              <span><Plus size={23} /></span>
              <strong>Thêm hồ sơ bé</strong>
            </button>
          </aside>

          <div className="care-profile-main">
            <section className="care-information-card">
              <header>
                <div><HeartPulse size={30} /><h2>Thông tin của Mẹ</h2></div>
                <span>Đang phục hồi</span>
              </header>
              <div className="mother-care-grid">
                <div className="recovery-copy">
                  <small>Tình trạng phục hồi</small>
                  <p><strong>12</strong> ngày sau mổ lấy thai</p>
                  <div className="care-note">
                    <HeartPulse size={20} />
                    <span>Ưu tiên nghỉ ngơi, theo dõi vết mổ và huyết áp mỗi ngày.</span>
                  </div>
                </div>
                <div>
                  <div className="allergy-card">
                    <strong><AlertTriangle size={17} /> Dị ứng</strong>
                    <p>Kháng sinh Penicillin, phấn hoa</p>
                  </div>
                  <div className="medical-history">
                    <strong>Tiền sử bệnh lý</strong>
                    <p>Huyết áp thấp</p>
                    <p>Đau dạ dày nhẹ</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="care-information-card baby-card">
              <header>
                <div><Baby size={30} /><h2>Hồ sơ Bé (Bé Bơ)</h2></div>
                <span>Trẻ sơ sinh</span>
              </header>
              <div className="baby-card-body">
                <div className="baby-stat-grid">
                  <article><Cake /><small>Ngày sinh</small><strong>12/6/2026</strong></article>
                  <article><Scale /><small>Cân nặng</small><strong>3.4 kg</strong></article>
                  <article><Droplets /><small>Nhóm máu</small><strong>O (Rh+)</strong></article>
                  <article><Ruler /><small>Chiều cao</small><strong>50 cm</strong></article>
                </div>
                <div className="baby-special-note">
                  <strong><AlertTriangle size={18} /> Tình trạng đặc biệt & lưu ý</strong>
                  <p>Bé đang trong giai đoạn thích nghi sau sinh, có thể quấy nhẹ vào buổi tối. Theo dõi lịch ăn ngủ và tránh các sản phẩm có dấu hiệu gây không dung nạp lactose.</p>
                </div>
              </div>
            </section>

            <section className="care-recommendation">
              <div>
                <h2>Lời khuyên cho tuần phục hồi</h2>
                <p>Gia đình hãy chuẩn bị không gian nghỉ ngơi yên tĩnh và ghi lại các thay đổi sức khỏe của mẹ và bé mỗi ngày.</p>
                <button type="button">Xem chi tiết lộ trình</button>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AccountProfile;
