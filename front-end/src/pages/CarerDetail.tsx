import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { BadgeCheck, BriefcaseBusiness, CalendarDays, Loader2, MapPin, Medal } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import {
  formatAge,
  formatExperience,
  formatHourlyRate,
  formatLocation,
  formatReviewLabel,
  getCarerAvatar,
  getCarerFullName,
  getDisplayRating,
} from '../utils/carerDisplay';
import './CarerDetail.css';

const dayLabels: Record<string, string> = {
  monday: 'Thứ 2',
  tuesday: 'Thứ 3',
  wednesday: 'Thứ 4',
  thursday: 'Thứ 5',
  friday: 'Thứ 6',
  saturday: 'Thứ 7',
  sunday: 'Chủ nhật',
};

const CarerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [carer, setCarer] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const serviceId = new URLSearchParams(location.search).get('serviceId');

  useEffect(() => {
    const fetchCarer = async () => {
      try {
        setLoading(true);
        const [carerRes, reviewsRes] = await Promise.all([
          api.get(`/carers/${id}`),
          api.get('/reviews', { params: { carerId: id, page: 1, limit: 10 } }),
        ]);
        setCarer(carerRes.data);
        setReviews(Array.isArray(reviewsRes.data) ? reviewsRes.data : reviewsRes.data.items || []);
      } catch (error) {
        console.error('Error fetching carer detail:', error);
        setCarer(null);
      } finally {
        setLoading(false);
      }
    };
    if (id) void fetchCarer();
  }, [id]);

  if (loading) {
    return <div className="carer-detail-loading"><Loader2 className="spinner" /><p>Đang tải thông tin chuyên gia...</p></div>;
  }
  if (!carer) {
    return <div className="carer-not-found"><h2>Không tìm thấy chuyên gia</h2><Link to="/carers">Quay lại danh sách</Link></div>;
  }

  const fullName = getCarerFullName(carer);
  const displayRating = getDisplayRating(carer);
  const availability = Array.isArray(carer.availability) ? carer.availability : [];
  const services = Array.isArray(carer.services) ? carer.services : [];
  const certifications = Array.isArray(carer.certifications) ? carer.certifications : [];

  const handleBooking = () => {
    if (serviceId) {
      navigate('/booking', { state: { serviceId, carerId: carer._id, carerName: fullName } });
      return;
    }
    navigate(`/services?carerId=${carer._id}&carerName=${encodeURIComponent(fullName)}`);
  };

  return (
    <div className="carer-detail-page">
      <Navbar />
      <main className="container stitch-carer-detail">
        <aside className="stitch-carer-left">
          <section className="stitch-profile-summary">
            <div className="stitch-profile-avatar">
              <img src={getCarerAvatar(carer)} alt={fullName} />
              {carer.verificationStatus === 'verified' && <span><BadgeCheck />Đã xác minh</span>}
            </div>
            <h1>{fullName}</h1>
            <p>{carer.position || 'Chuyên gia chăm sóc mẹ và bé'}</p>
            <div className="stitch-profile-stats">
              <div><strong>{formatExperience(carer.experienceYears)}</strong><span>Kinh nghiệm</span></div>
              <div><strong>{Number(carer.completedBookingCount || 0)}</strong><span>Ca hoàn tất</span></div>
              <div><strong>{displayRating ? `${displayRating} ★` : 'N/A'}</strong><span>{formatReviewLabel(carer)}</span></div>
            </div>
            <div className="stitch-profile-price">Giá thuê: <strong>{formatHourlyRate(carer.hourlyRate)}</strong></div>
            <button type="button" onClick={handleBooking}>Đặt lịch ngay</button>
          </section>

          <section className="stitch-profile-credentials">
            <h3>Thông tin chuyên môn</h3>
            <p><MapPin size={17} />{formatLocation(carer.location)}</p>
            <p><BriefcaseBusiness size={17} />{carer.workplaceName || 'Chưa cập nhật nơi làm việc'}</p>
            <p>{formatAge(carer.age)}</p>
            {certifications.length > 0 && <>
              <hr />
              <h3>Bằng cấp & Chứng chỉ</h3>
              {certifications.map((cert: string) => <div key={cert}><Medal />{cert}</div>)}
            </>}
          </section>
        </aside>

        <div className="stitch-carer-main">
          <section className="stitch-carer-bio">
            <h2>Tiểu sử chuyên môn</h2>
            <p>{carer.bio || 'Chuyên gia chưa cập nhật phần giới thiệu.'}</p>
            {services.length > 0 && <div>{services.map((service: any) => <span key={service._id}>{service.title}</span>)}</div>}
          </section>

          <section className="stitch-weekly-calendar">
            <header><h2><CalendarDays size={21} /> Lịch khả dụng</h2></header>
            {availability.length > 0 ? (
              <div className="stitch-week-grid">
                {availability.map((entry: any) => (
                  <article key={entry.day} className={entry.slots?.length ? 'available' : ''}>
                    <strong>{dayLabels[String(entry.day).toLowerCase()] || entry.day}</strong>
                    <span>{entry.slots?.length || 0} khung giờ</span>
                    {(entry.slots || []).map((slot: string) => <b key={slot}>{slot}</b>)}
                  </article>
                ))}
              </div>
            ) : <p>Chuyên gia chưa công bố lịch khả dụng.</p>}
            <p>* Thời gian hiển thị theo múi giờ {carer.timezone || 'Asia/Ho_Chi_Minh'}.</p>
          </section>

          <section className="stitch-parent-reviews" id="reviews">
            <header><h2>Đánh giá từ phụ huynh</h2><span>{formatReviewLabel(carer, reviews)}</span></header>
            {reviews.length > 0 ? (
              <div>{reviews.map((review) => {
                const parentName = [review.parent?.firstName, review.parent?.lastName].filter(Boolean).join(' ') || 'Phụ huynh ẩn danh';
                return <article key={review._id}>
                  <header><span>{parentName.slice(0, 2).toUpperCase()}</span><div><strong>{parentName}</strong><small>{review.createdAt ? new Date(review.createdAt).toLocaleDateString('vi-VN') : ''}</small></div></header>
                  <p className="review-stars">{Array.from({ length: review.score || 0 }, () => '★').join('')}</p>
                  <blockquote>“{review.content}”</blockquote>
                </article>;
              })}</div>
            ) : <p>Chưa có đánh giá nào cho chuyên gia này.</p>}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CarerDetail;
