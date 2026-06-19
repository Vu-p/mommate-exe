import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { BadgeCheck, ChevronLeft, ChevronRight, Loader2, Medal } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import {
  formatHourlyRate,
  getCarerAvatar,
  getCarerFullName,
  getDisplayRating,
} from '../utils/carerDisplay';
import './CarerDetail.css';

interface Carer {
  _id: string;
  user: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  bio?: string;
  location?: string;
  experienceYears?: number;
  hourlyRate?: number;
  certifications?: string[];
  skills?: string[];
  rating?: number;
  reviewCount?: number;
  numReviews?: number;
  age?: number;
  verificationStatus?: string;
  workplaceName?: string;
  position?: string;
  services?: any[];
  availability?: {
    day: string;
    slots: string[];
  }[];
}

interface ReviewItem {
  _id: string;
  score: number;
  title?: string;
  content?: string;
  parent?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  createdAt?: string;
}

const CarerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [carer, setCarer] = useState<Carer | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  const queryParams = new URLSearchParams(location.search);
  const serviceId = queryParams.get('serviceId');

  useEffect(() => {
    const fetchCarer = async () => {
      try {
        setLoading(true);
        const [carerRes, reviewsRes] = await Promise.all([
          api.get(`/carers/${id}`),
          api.get('/reviews', { params: { carerId: id, limit: 10 } }),
        ]);
        setCarer(carerRes.data);
        setReviews(reviewsRes.data);
      } catch (error) {
        console.error('Error fetching carer detail:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchCarer();
  }, [id]);

  if (loading) {
    return (
      <div className="carer-detail-loading">
        <Loader2 className="spinner" />
        <p>Đang tải thông tin chuyên gia...</p>
      </div>
    );
  }

  if (!carer) {
    return (
      <div className="carer-not-found">
        <h2>Không tìm thấy chuyên gia</h2>
        <Link to="/carers">Quay lại danh sách</Link>
      </div>
    );
  }

  const fullName = getCarerFullName(carer);
  const avatar = getCarerAvatar(carer);
  const displayRating = getDisplayRating(carer);
  const certifications = carer.certifications || [];

  return (
    <div className="carer-detail-page">
      <Navbar />

      <main className="container stitch-carer-detail">
        <aside className="stitch-carer-left">
          <section className="stitch-profile-summary">
            <div className="stitch-profile-avatar"><img src={avatar} alt={fullName} /><span><BadgeCheck />Đã xác minh</span></div>
            <h1>{fullName}</h1>
            <p>{carer.position || 'Bác sĩ Sản phụ khoa'} & Chuyên gia chăm sóc sau sinh</p>
            <div className="stitch-profile-stats">
              <div><strong>10+</strong><span>Năm kinh nghiệm</span></div>
              <div><strong>850</strong><span>Lượt đặt</span></div>
              <div><strong>{displayRating} ★</strong><span>Đánh giá</span></div>
            </div>
            <div className="stitch-profile-price">Giá thuê: <strong>{formatHourlyRate(carer.hourlyRate)}</strong></div>
            <button onClick={() => navigate(serviceId ? '/booking' : `/services?carerId=${carer._id}&carerName=${encodeURIComponent(fullName)}`)}>Đặt lịch ngay</button>
          </section>
          <section className="stitch-profile-credentials">
            <h3>Nơi làm việc hiện tại</h3>
            <strong>♜ {carer.workplaceName || 'Phòng khám Phụ khoa Đà Nẵng'}</strong>
            <span>{carer.position || 'Bác sĩ chuyên trách'}</span>
            <hr />
            <h3>Bằng cấp & Chứng chỉ</h3>
            {(certifications.length ? certifications : ['Chuyên gia tư vấn sữa mẹ IBCLC', 'Nữ hộ sinh được chứng nhận', 'Hồi sức sơ sinh nâng cao']).slice(0, 3).map((cert) => <div key={cert}><Medal />{cert}</div>)}
          </section>
        </aside>

        <div className="stitch-carer-main">
          <section className="stitch-carer-bio">
            <h2>Tiểu sử chuyên môn</h2>
            <p>Với hơn một thập kỷ kinh nghiệm lâm sàng tại các cơ sở sản khoa công và tư nhân, tôi chuyên sâu về phục hồi hậu sản và chăm sóc trẻ sơ sinh giai đoạn chuyển tiếp. Phương pháp của tôi kết hợp sự chính xác về mặt chuyên môn với sự hỗ trợ tận tâm mà các gia đình cần trong “Tam cá nguyệt thứ tư”. Tôi đã đồng hành cùng hơn 800 gia đình trong việc thiết lập thói quen ngủ lành mạnh, nuôi con bằng sữa mẹ thành công và chăm sóc sức khỏe tâm thần sau sinh.</p>
            <div>{['Chăm sóc hậu sản','Hỗ trợ nuôi con sữa mẹ','Rèn luyện giấc ngủ','An toàn trẻ sơ sinh'].map((tag) => <span key={tag}>{tag}</span>)}</div>
          </section>
          <section className="stitch-weekly-calendar">
            <header><h2>Lịch làm việc hàng tuần</h2><div><button><ChevronLeft /></button><button><ChevronRight /></button></div></header>
            <div className="stitch-week-grid">
              {['THỨ 2','THỨ 3','THỨ 4','THỨ 5','THỨ 6','THỨ 7','CN'].map((day, index) => <article key={day} className={index === 1 || index === 2 || index === 4 ? 'available' : index === 3 ? 'busy' : ''}><strong>{day}</strong><span>{14 + index}</span>{index === 3 ? <b>Kín lịch</b> : index === 1 || index === 2 || index === 4 ? <b>{index === 4 ? 5 : 4-index} Trống</b> : null}</article>)}
            </div>
            <p>* Tất cả thời gian được hiển thị theo múi giờ địa phương của bạn (GMT+7)</p>
          </section>
          <section className="stitch-parent-reviews">
            <header><h2>Đánh giá từ phụ huynh</h2><a href="#reviews">Xem tất cả 142 đánh giá</a></header>
            <div>
              {[reviews[0], { _id: 'review-2', score: 4.5, content: 'Cực kỳ chuyên nghiệp và đúng giờ. Bác sĩ Minh Anh đã dạy cho gia đình tôi rất nhiều mẹo thực tế để quản lý lịch ngủ cho cặp sinh đôi.', parent: { firstName: 'Trần', lastName: 'Văn Nam' } }].map((review: any, index) => <article key={review?._id || index}><header><span>{index ? 'VN' : 'LD'}</span><div><strong>{index ? 'Trần Văn Nam' : 'Lê Thùy Dương'}</strong><small>Phụ huynh bé {index ? 'sinh đôi' : '2 tháng tuổi'}</small></div></header><p className="review-stars">★★★★★</p><blockquote>“{review?.content || 'Bác sĩ Minh Anh thực sự là một cứu cánh cho tôi. Kiến thức về nuôi con bằng sữa mẹ rất sâu rộng.'}”</blockquote></article>)}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CarerDetail;
