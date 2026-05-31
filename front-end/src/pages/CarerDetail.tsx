import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, Star, MapPin, User, Briefcase, CreditCard, CheckCircle2, Loader2, ChevronRight as ChevronRightIcon } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
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
  numReviews?: number;
  age?: number;
  services?: any[];
}

const CarerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [carer, setCarer] = useState<Carer | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const serviceId = queryParams.get('serviceId');
  const serviceTitle = queryParams.get('serviceTitle');

  useEffect(() => {
    const fetchCarer = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/carers/${id}`);
        setCarer(data);
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

  const fullName = `${carer.user?.firstName || ''} ${carer.user?.lastName || ''}`.trim() || 'Nguyễn Thị A';
  const avatar = carer.user?.avatar || 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=2574&auto=format&fit=crop';
  
  const displayRating = carer.rating || 5.0;
  const displayReviews = carer.numReviews || Math.floor(Math.random() * 20) + 1;

  // Fake certifications if none
  const certifications = carer.certifications && carer.certifications.length > 0 
    ? carer.certifications 
    : [
        'Chứng chỉ chăm sóc mẹ và bé', 
        'Chứng chỉ nghiệp vụ chăm sóc sức khoẻ', 
        'Chứng chỉ điều dưỡng', 
        'Chứng chỉ sơ cấp cứu'
      ];

  // Fake services if none
  const otherServices = carer.services && carer.services.length > 0
    ? carer.services
    : ['Chăm sóc mẹ sau sinh', 'Tắm bé sơ sinh', 'Thông tắc tia sữa', 'Chăm sóc bé sinh non'];

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
                <Star size={18} fill="#FACC15" color="#FACC15" />
                <span>{displayRating.toFixed(1)}</span>
                <span className="reviews">{displayReviews} bình luận</span>
              </div>
            </div>
            <p className="profile-bio">
              {carer.bio || 'Với hơn 4 năm kinh nghiệm trong lĩnh vực chăm sóc hậu sản và sơ sinh, tôi hiểu rằng giai đoạn đầu đời của bé và quá trình phục hồi của mẹ là vô cùng quan trọng. Phương châm làm việc của tôi là sự tận tâm, tỉ mỉ và luôn ưu tiên sức khỏe y khoa làm đầu.'}
            </p>
            
            <div className="profile-stats-grid">
              <div className="stat-item">
                <div className="stat-icon"><MapPin size={24} strokeWidth={1.5} /></div>
                <div className="stat-text">
                  <span className="label">Khu vực</span>
                  <span className="value">{carer.location || 'Hồ Chí Minh'}</span>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon"><User size={24} strokeWidth={1.5} /></div>
                <div className="stat-text">
                  <span className="label">Tuổi</span>
                  <span className="value">{carer.age || '27 tuổi'}</span>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon"><Briefcase size={24} strokeWidth={1.5} /></div>
                <div className="stat-text">
                  <span className="label">Kinh nghiệm</span>
                  <span className="value">{carer.experienceYears ? `${carer.experienceYears} năm` : '4 năm'}</span>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon"><CreditCard size={24} strokeWidth={1.5} /></div>
                <div className="stat-text">
                  <span className="label">Giá</span>
                  <span className="value">{carer.hourlyRate ? `${carer.hourlyRate.toLocaleString()} VNĐ/ giờ` : '150 000 VNĐ/ giờ'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="detail-section certifications">
            <h3>Chứng chỉ</h3>
            <div className="certs-list">
              {certifications.map((cert, i) => (
                <div key={i} className="cert-item">
                  <CheckCircle2 size={20} color="var(--primary)" />
                  <span>{cert}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="detail-section services-list-section">
            <h3>Các dịch vụ khác</h3>
            <div className="service-tags">
              {otherServices.map((srv, i) => (
                <span key={i} className={`service-tag ${i === 0 ? 'active' : ''}`}>
                  {typeof srv === 'string' ? srv : srv.title}
                </span>
              ))}
            </div>
          </div>

          <div className="detail-section availability-calendar">
            <h3>Lịch làm việc</h3>
            <div className="calendar-container">
              <div className="calendar-header">
                <div className="time-col"></div>
                <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
              </div>
              {[
                '6-9 am', '9-12 am', '12-3 pm', '3-6 pm', '6-9 pm', '9-12 pm', '12-6 am'
              ].map((time, i) => (
                <div key={i} className="calendar-row">
                  <span className="time-label">{time}</span>
                  {[...Array(7)].map((_, j) => (
                    <div key={j} className="calendar-slot-wrapper">
                      <div className={`calendar-slot ${j < 5 && i < 4 ? 'filled' : ''}`}></div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="detail-section reviews-section">
            <h3>Đánh giá</h3>
            <div className="reviews-carousel">
              <div className="review-card">
                <div className="review-stars">
                  {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="#FACC15" color="#FACC15" />)}
                </div>
                <p>“Lorem ipsum dolor sit amet consectetur adipiscing elit. Lectus a nunc mauris scelerisque sed egestas pharetraol quis pharetra arcu pharetra blandit.”</p>
                <div className="reviewer-info">
                  <strong>Thi Tran</strong>
                  <span>Mẹ một con</span>
                </div>
              </div>
              <div className="review-card">
                <div className="review-stars">
                  {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="#FACC15" color="#FACC15" />)}
                </div>
                <p>“Ultrices eros in cursus turpis massa tincidunt sem nulla pharetra. Amet nisl suscipit adipiscing bibendum est ultricies integer quis.”</p>
                <div className="reviewer-info">
                  <strong>Nguyen Khoa Toc Tien</strong>
                  <span>Mẹ bỉm sữa đầu</span>
                </div>
              </div>
              <button className="carousel-next"><ChevronRightIcon size={24} /></button>
            </div>
            
            <div className="comment-input">
              <input type="text" placeholder="Nhập bình luận ..." />
            </div>
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
              {serviceId ? 'Xác nhận Đặt ngay' : 'Đặt ngay'}
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
