import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Briefcase, CheckCircle2, ChevronRight, CreditCard, Loader2, MapPin, Star, User } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import {
  formatAge,
  formatExperienceShort,
  formatHourlyRate,
  formatLocation,
  formatReviewLabel,
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

const DAYS = [
  { key: 'Monday', label: 'T2' },
  { key: 'Tuesday', label: 'T3' },
  { key: 'Wednesday', label: 'T4' },
  { key: 'Thursday', label: 'T5' },
  { key: 'Friday', label: 'T6' },
  { key: 'Saturday', label: 'T7' },
  { key: 'Sunday', label: 'CN' },
];

const TIME_SLOTS = [
  { value: '06:00-09:00', label: '6-9 am' },
  { value: '09:00-12:00', label: '9-12 am' },
  { value: '12:00-15:00', label: '12-3 pm' },
  { value: '15:00-18:00', label: '3-6 pm' },
  { value: '18:00-21:00', label: '6-9 pm' },
  { value: '21:00-00:00', label: '9-12 pm' },
  { value: '00:00-06:00', label: '12-6 am' },
];

const buildAvailabilitySet = (availability?: Carer['availability']) =>
  new Set(
    (availability || []).flatMap((dayAvailability) =>
      (dayAvailability.slots || []).map((slot) => `${dayAvailability.day}|${slot}`)
    )
  );

const CarerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [carer, setCarer] = useState<Carer | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  const queryParams = new URLSearchParams(location.search);
  const serviceId = queryParams.get('serviceId');
  const serviceTitle = queryParams.get('serviceTitle');

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
  const displayReviews = formatReviewLabel(carer);
  const availabilitySet = buildAvailabilitySet(carer.availability);
  const certifications = carer.certifications || [];
  const otherServices = carer.services || [];

  return (
    <div className="carer-detail-page">
      <Navbar />

      <main className="container carer-detail-content">
        <nav className="breadcrumb">
          <Link to="/">Trang chủ</Link>
          <ChevronRight size={14} />
          <Link to="/carers">Tìm chuyên gia chăm sóc</Link>
        </nav>

        <section className="carer-profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              <img src={avatar} alt={fullName} />
            </div>
            <div className="profile-titles">
              <h2>{fullName}</h2>
              <div className="profile-rating">
                {displayRating && (
                  <>
                    <Star size={18} fill="#FACC15" color="#FACC15" />
                    <span>{displayRating}</span>
                  </>
                )}
                <span className="reviews">{displayReviews}</span>
              </div>
            </div>
            <p className="profile-bio">
              {carer.bio || 'Chuyên gia chưa cập nhật giới thiệu cá nhân.'}
            </p>
            
            <div className="profile-stats-grid">
              <div className="stat-item">
                <div className="stat-icon"><MapPin size={24} strokeWidth={1.5} /></div>
                <div className="stat-text">
                  <span className="label">Khu vực</span>
                  <span className="value">{formatLocation(carer.location)}</span>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon"><User size={24} strokeWidth={1.5} /></div>
                <div className="stat-text">
                  <span className="label">Tuổi</span>
                  <span className="value">{formatAge(carer.age)}</span>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon"><Briefcase size={24} strokeWidth={1.5} /></div>
                <div className="stat-text">
                  <span className="label">Kinh nghiệm</span>
                  <span className="value">{formatExperienceShort(carer.experienceYears)}</span>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon"><CreditCard size={24} strokeWidth={1.5} /></div>
                <div className="stat-text">
                  <span className="label">Giá</span>
                  <span className="value">{formatHourlyRate(carer.hourlyRate)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="detail-section certifications">
            <h3>Chứng chỉ</h3>
            {certifications.length > 0 ? (
              <div className="certs-list">
                {certifications.map((cert, i) => (
                  <div key={i} className="cert-item">
                    <CheckCircle2 size={20} color="var(--primary)" />
                    <span>{cert}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="reviews-empty">Chuyên gia chưa cập nhật chứng chỉ.</p>
            )}
          </div>

          <div className="detail-section services-list-section">
            <h3>Các dịch vụ khác</h3>
            {otherServices.length > 0 ? (
              <div className="service-tags">
                {otherServices.map((srv, i) => (
                  <span key={srv._id || i} className={`service-tag ${i === 0 ? 'active' : ''}`}>
                    {typeof srv === 'string' ? srv : srv.title}
                  </span>
                ))}
              </div>
            ) : (
              <p className="reviews-empty">Chuyên gia chưa cập nhật dịch vụ.</p>
            )}
          </div>

          <div className="detail-section availability-calendar">
            <h3>Lịch làm việc</h3>
            <div className="calendar-container">
              <div className="calendar-header">
                <div className="time-col"></div>
                {DAYS.map((day) => (
                  <span key={day.key}>{day.label}</span>
                ))}
              </div>
              {TIME_SLOTS.map((slot) => (
                <div key={slot.value} className="calendar-row">
                  <span className="time-label">{slot.label}</span>
                  {DAYS.map((day) => {
                    const isAvailable = availabilitySet.has(`${day.key}|${slot.value}`);

                    return (
                      <div key={`${day.key}-${slot.value}`} className="calendar-slot-wrapper">
                        <div
                          className={`calendar-slot ${isAvailable ? 'filled' : ''}`}
                          aria-label={`${day.label} ${slot.label}${isAvailable ? ' có lịch' : ' không có lịch'}`}
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
              {availabilitySet.size === 0 && (
                <div className="availability-empty">
                  Chuyên gia chưa cập nhật lịch làm việc.
                </div>
              )}
            </div>
          </div>

          <div className="detail-section reviews-section">
            <h3>Đánh giá</h3>
            {reviews.length > 0 ? (
              <div className="reviews-carousel">
                {reviews.map((review) => {
                  const reviewerName = [review.parent?.firstName, review.parent?.lastName].filter(Boolean).join(' ') || 'Khách hàng';
                  const reviewDate = review.createdAt
                    ? new Date(review.createdAt).toLocaleDateString('vi-VN')
                    : 'Đã đánh giá';

                  return (
                    <div className="review-card" key={review._id}>
                      <div className="review-stars">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            fill={i < Math.round(review.score || 0) ? '#FACC15' : 'transparent'}
                            color={i < Math.round(review.score || 0) ? '#FACC15' : '#D1D5DB'}
                          />
                        ))}
                      </div>
                      <p>{review.content || review.title || 'Khách hàng chưa để lại nội dung đánh giá.'}</p>
                      <div className="reviewer-info">
                        <strong>{reviewerName}</strong>
                        <span>{reviewDate}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="reviews-empty">Chuyên gia chưa có đánh giá nào.</p>
            )}
          </div>
          
          <div className="detail-footer-actions">
            <button 
              className="btn-book-now-solid"
              onClick={() => {
                if (serviceId) {
                  navigate('/booking', { 
                    state: { 
                      carerId: carer._id, 
                      carerName: fullName,
                      serviceId,
                      serviceTitle
                    } 
                  });
                } else {
                  navigate(`/services?carerId=${carer._id}&carerName=${encodeURIComponent(fullName)}`);
                }
              }}
            >
              {serviceId ? 'Xác nhận đặt ngay' : 'Đặt ngay'}
            </button>
            <Link to="/carers" className="btn-explore-outline">Xem thêm</Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CarerDetail;
