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
  const [isPublic, setIsPublic] = useState(true);
  const [pageError, setPageError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const bookingId = location.state?.bookingId || searchParams.get('bookingId');

  useEffect(() => {
    if (!bookingId) return setPageError('Không tìm thấy mã đặt lịch.');
    api.get(`/bookings/${bookingId}`).then(({ data }) => {
      if (!data || data.status !== 'completed') setPageError('Chỉ có thể đánh giá lịch đặt đã hoàn thành.');
      else setBooking(data);
    }).catch(() => setPageError('Không thể tải thông tin lịch đặt.'));
  }, [bookingId]);

  const handlePost = async () => {
    if (!rating) return alert('Vui lòng chọn số sao đánh giá.');
    if (!booking) return;
    setLoading(true);
    try {
      await api.post('/reviews', { 
        bookingId, 
        carerId: booking.carer?._id || booking.carer, 
        rating, 
        comment,
        isAnonymous: !isPublic
      });
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
        <header className="stitch-review-heading"><h1>Đánh giá dịch vụ</h1><p>Cảm ơn bạn đã tin tưởng MomMate. Hãy chia sẻ trải nghiệm của bạn để chúng tôi phục vụ tốt hơn.</p></header>
        {pageError ? <div className="review-error-banner">{pageError}</div> : (
          <section className="stitch-review-card">
            <div className="review-carer-summary">
              <img src={carer.avatar || carerAvatar} alt="" />
              <div><h2>{booking?.carer?.department === 'doctor' ? 'BS. ' : ''}{carer.firstName} {carer.lastName} <span>Đã xác minh</span></h2><em>{booking?.carer?.position || booking?.carer?.department || 'Chuyên gia chăm sóc'}</em><p><CalendarDays />Dịch vụ: {booking?.service?.title} <CheckCircle2 />Hoàn tất: {booking?.statusHistory?.find((s: any) => s.status === 'completed')?.changedAt ? new Date(booking.statusHistory.find((s: any) => s.status === 'completed').changedAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN')}</p></div>
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
              <label><input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />Hiển thị tên tôi trong phần đánh giá công khai</label>
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
