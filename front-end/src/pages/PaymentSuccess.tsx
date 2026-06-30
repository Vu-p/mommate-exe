import { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, Download, Info, Loader2 } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import { downloadBookingInvoice } from '../utils/invoice';
import { trackEvent } from '../utils/analytics';

const formatCurrency = (value: number) => `${Number(value || 0).toLocaleString('vi-VN')} VNĐ`;

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get('bookingId');
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!bookingId) {
        setError('Không tìm thấy mã đặt lịch.');
        setLoading(false);
        return;
      }

      try {
        const { data: paymentStatus } = await api.get(`/bookings/${bookingId}/payment-status`);
        if (!paymentStatus.paid) {
          navigate(`/payment?bookingId=${bookingId}&payment=success`, { replace: true });
          return;
        }
        const { data } = await api.get(`/bookings/${bookingId}`);
        setBooking(data);
        trackEvent('payment_success', { service_category: data.service?.category || 'service', source_screen: 'payment_success', currency: 'VND', value: Number(data.totalPrice || 0) });
      } catch (err: any) {
        setError(err.response?.data?.message || 'Không thể tải thông tin thanh toán.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bookingId, navigate]);

  return (
    <div className="payment-success-page">
      <Navbar />
      <main className="container payment-success-shell">
        {loading ? (
          <div className="loading-state"><Loader2 className="spinner" /><p>Đang xác nhận giao dịch...</p></div>
        ) : error ? (
          <div className="payment-success-card">
            <h1>Không thể xác nhận thanh toán</h1>
            <p>{error}</p>
            <div className="payment-success-actions"><Link className="btn-primary" to="/account/request">Xem lịch đặt</Link></div>
          </div>
        ) : (
          <section className="payment-success-card">
            <header className="stitch-success-header">
              <span className="payment-success-icon"><CheckCircle2 size={46} /></span>
              <h1>Thanh toán thành công!</h1>
              <p>Cảm ơn bạn đã tin tưởng dịch vụ của MomMate.</p>
            </header>
            <div className="stitch-receipt">
              <div className="stitch-receipt-top">
                <div><small>Transaction ID</small><strong>#{String(booking?._id || '').slice(-8).toUpperCase()}</strong></div>
                <div><small>Tổng thanh toán</small><strong>{formatCurrency(booking?.totalPrice)}</strong></div>
              </div>
              <div className="stitch-receipt-grid">
                <div><small>Dịch vụ</small><strong>{booking?.service?.title || 'Dịch vụ MomMate'}</strong></div>
                <div><small>Ngày bắt đầu</small><span><CalendarDays size={15} />{booking?.scheduledAt ? new Date(booking.scheduledAt).toLocaleDateString('vi-VN') : 'Đang cập nhật'}</span></div>
                <div><small>Chuyên gia phụ trách</small><strong>Chuyên gia MomMate</strong></div>
                <div><small>Thời gian dự kiến</small><span><Clock3 size={15} />{booking?.scheduledAt ? new Date(booking.scheduledAt).toLocaleTimeString('vi-VN') : 'Đang cập nhật'}</span></div>
              </div>
              <div className="stitch-next-steps">
                <h3><Info size={16} /> BƯỚC TIẾP THEO</h3>
                <p><b>1</b> Chuyên gia sẽ liên hệ với bạn sớm để xác nhận chi tiết lộ trình chăm sóc.</p>
                <p><b>2</b> Bạn có thể theo dõi tiến độ trong phần Quản lý yêu cầu.</p>
              </div>
            </div>
            <div className="payment-success-actions">
              <Link className="btn-primary" to="/account/request">Xem chi tiết lịch hẹn <ArrowRight size={16} /></Link>
              <button className="btn-secondary" onClick={() => bookingId && downloadBookingInvoice(bookingId)}><Download size={16} /> Tải hóa đơn</button>
              <Link className="stitch-home-link" to="/">Về trang chủ</Link>
            </div>
            <aside className="stitch-success-tip"><div /><p><strong>Mẹo cho bạn</strong><span>Chuẩn bị sẵn hồ sơ sức khỏe của mẹ và bé để buổi tư vấn đầu tiên diễn ra thuận lợi nhất.</span><Link to="/account/profile">Xem hướng dẫn chuẩn bị</Link></p></aside>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default PaymentSuccess;
