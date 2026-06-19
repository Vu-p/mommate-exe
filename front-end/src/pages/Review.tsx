import { useEffect, useState } from 'react';
import { Star, Loader2, ChevronRight } from 'lucide-react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import './Review.css';
import './Booking.css';

const Review = () => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [pageError, setPageError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const bookingId = location.state?.bookingId || searchParams.get('bookingId');

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!bookingId) {
        setPageError('Không tìm thấy lịch đặt hợp lệ để đánh giá.');
        return;
      }

      try {
        const { data } = await api.get('/bookings/my');
        const currentBooking = data.find((b: any) => b._id === bookingId);

        if (!currentBooking) {
          setPageError('Không tìm thấy lịch đặt hợp lệ để đánh giá.');
          return;
        }

        if (currentBooking.status !== 'completed') {
          setPageError('Chỉ có thể đánh giá khi lịch đặt đã hoàn thành.');
          return;
        }

        setBooking(currentBooking);
      } catch (error) {
        console.error('Error fetching booking for review:', error);
        setPageError('Không thể tải thông tin lịch đặt.');
      }
    };

    fetchBookingDetails();
  }, [bookingId]);

  const serviceTitle = booking?.service?.title || '';
  const carerName = `${booking?.carer?.user?.firstName || ''} ${booking?.carer?.user?.lastName || ''}`.trim();

  const handlePost = async () => {
    if (rating === 0) {
      alert('Vui lòng chọn số sao đánh giá.');
      return;
    }

    if (!booking || booking.status !== 'completed') {
      setPageError('Chỉ có thể gửi đánh giá cho lịch đặt đã hoàn thành.');
      return;
    }

    setLoading(true);
    try {
      const carerId = booking.carer?._id || booking.carer;
      await api.post('/reviews', {
        bookingId,
        carerId,
        rating,
        comment
      });
      navigate('/account/request');
    } catch (error) {
      console.error('Review submission failed:', error);
      alert('Không thể gửi đánh giá. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="review-page">
      <Navbar />

      <main className="container review-content">
        <nav className="breadcrumb">
          <Link to="/">Trang chủ</Link>
          <ChevronRight size={14} />
          <Link to="/account/request">Lịch sử đặt</Link>
          <ChevronRight size={14} />
          <span>Đánh giá</span>
        </nav>

        {pageError && (
          <div className="review-error-banner">
            <p>{pageError}</p>
            <Link to="/account/request" className="btn-review-back">
              Quay lại lịch sử đặt
            </Link>
          </div>
        )}

        <div className="review-layout">
          <aside className="booking-summary-col">
            <div className="summary-card">
              <div className="summary-header">
                <div className="summary-image">
                  {booking?.service?.image ? (
                    <img src={booking.service.image} alt="Service" />
                  ) : (
                    <div className="img-placeholder">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                        <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="#A4A8B4" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="summary-title-wrapper">
                  <h3>{serviceTitle || 'Dịch vụ đã hoàn thành'}</h3>
                  <p className="carer-name">Chuyên gia: {carerName || 'Đang cập nhật'}</p>
                </div>
              </div>

              <div className="summary-details">
                <div className="summary-row">
                  <span>Trạng thái</span>
                  <span style={{ color: '#10B981' }}>Hoàn thành</span>
                </div>
                <div className="summary-row total">
                  <span>Tổng thanh toán</span>
                  <span className="total-price">{booking?.totalPrice?.toLocaleString()} VNĐ</span>
                </div>
              </div>
            </div>
          </aside>

          <section className="review-form-col">
            <div className="review-form-card">
              <h2 className="review-section-title">Chất lượng dịch vụ</h2>

              <div className="stars-container-large">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={48}
                    className={star <= rating ? 'star active' : 'star'}
                    onClick={() => setRating(star)}
                    fill={star <= rating ? '#FACC15' : 'transparent'}
                    color={star <= rating ? '#FACC15' : '#D1D5DB'}
                    strokeWidth={1.5}
                  />
                ))}
              </div>

              <div className="review-input-section">
                <h3 className="review-section-subtitle">Chăm sóc bé như thế nào?</h3>
                <textarea
                  placeholder="Nội dung nhận xét"
                  className="review-textarea-large"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              <button
                className="btn-submit-review"
                onClick={handlePost}
                disabled={loading || Boolean(pageError)}
              >
                {loading ? <Loader2 className="spinner" size={20} /> : 'Xác nhận gửi'}
              </button>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Review;
