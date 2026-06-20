import { CalendarDays, CheckCircle2, ChevronDown, Clock3, Loader2, Smile, Star, Stethoscope } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import carerAvatar from '../assets/stitch/generated/stitch-06-ad3697d45210.png';
import './Review.css';

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
    api.get('/bookings/my').then(({ data }) => {
      const current = (Array.isArray(data) ? data : []).find((item: any) => item._id === bookingId);
      if (!current || current.status !== 'completed') setPageError('Chỉ có thể đánh giá lịch đặt đã hoàn thành.');
      else setBooking(current);
    }).catch(() => setPageError('Không thể tải thông tin lịch đặt.'));
  }, [bookingId]);

  const handlePost = async () => {
    if (!rating) return alert('Vui lòng chọn số sao đánh giá.');
    if (!booking) return;
    setLoading(true);
    try {
      await api.post('/reviews', { bookingId, carerId: booking.carer?._id || booking.carer, rating, comment });
      navigate('/account/request');
    } catch {
      alert('Không thể gửi đánh giá. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const carer = booking?.carer?.user || {};

  return (
    <div className="review-page">
      <Navbar />
      <main className="container stitch-review-main">
        <header className="stitch-review-heading"><h1>Đánh giá dịch vụ</h1><p>Cảm ơn bạn đã tin tưởng MaternalCare. Hãy chia sẻ trải nghiệm của bạn để chúng tôi phục vụ tốt hơn.</p></header>
        {pageError ? <div className="review-error-banner">{pageError}</div> : (
          <section className="stitch-review-card">
            <div className="review-carer-summary">
              <img src={carerAvatar} alt="" />
              <div><h2>BS. {carer.firstName || 'Nguyễn Thị'} {carer.lastName || 'Minh Anh'} <span>Đã xác minh</span></h2><em>Bác sĩ Sản phụ khoa & Chuyên gia chăm sóc sau sinh</em><p><CalendarDays />Dịch vụ: {booking?.service?.title || 'Chăm sóc sau sinh (14 ngày)'} <CheckCircle2 />Hoàn tất: 20/8/2026</p></div>
            </div>

            <div className="review-rating-block">
              <p>Bạn đánh giá trải nghiệm tổng thể như thế nào?</p>
              <div>{[1,2,3,4,5].map((value) => <button key={value} onClick={() => setRating(value)} aria-label={`${value} sao`}><Star className={value <= rating ? 'active' : ''} /></button>)}</div>
            </div>

            <div className="review-select-grid">
              <label>Thái độ phục vụ<span><Smile />Rất hài lòng<ChevronDown /></span></label>
              <label>Chuyên môn nghiệp vụ<span><Stethoscope />Rất chuyên nghiệp<ChevronDown /></span></label>
              <label>Đúng giờ & Tác phong<span><Clock3 />Luôn đúng giờ<ChevronDown /></span></label>
            </div>

            <label className="review-comment-label">Nhận xét chi tiết<textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Hãy chia sẻ thêm về quá trình làm việc của Carer (ví dụ: sự tận tâm, khả năng xử lý tình huống, giao tiếp với gia đình...)" /></label>

            <footer className="review-card-footer">
              <label><input type="checkbox" defaultChecked />Hiển thị tên tôi trong phần đánh giá công khai</label>
              <div><button className="review-cancel" onClick={() => navigate('/account/request')}>Hủy bỏ</button><button className="review-submit" disabled={loading} onClick={handlePost}>{loading ? <Loader2 className="spinner" /> : 'Gửi đánh giá'}</button></div>
            </footer>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Review;
