import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronRight, Clock3, Loader2, LockKeyhole, ShieldCheck, Stethoscope, UserRound } from 'lucide-react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import './Payment.css';
import './Booking.css';

const formatCurrency = (value: number) => `${Number(value || 0).toLocaleString('vi-VN')} VNĐ`;

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const stateBookingId = location.state?.bookingId;
  const bookingId = stateBookingId || searchParams.get('bookingId');
  const paymentResult = searchParams.get('payment');
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creatingLink, setCreatingLink] = useState(false);
  const [error, setError] = useState('');
  const [isWaitingForWebhook, setIsWaitingForWebhook] = useState(false);

  const fetchBookingDetails = useCallback(async (showLoader = true) => {
    if (!bookingId) {
      setLoading(false);
      setError('Không tìm thấy mã đặt lịch.');
      return null;
    }

    try {
      if (showLoader) setLoading(true);
      const { data } = await api.get(`/bookings/${bookingId}`);
      setBooking(data);
      return data;
    } catch (err: any) {
      console.error('Error fetching booking details:', err);
      setError(err.response?.data?.message || 'Không thể tải thông tin thanh toán.');
      return null;
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchBookingDetails();
  }, [fetchBookingDetails]);

  const carerName = useMemo(() => {
    const carerUser = booking?.carer?.user || {};
    return [carerUser.firstName, carerUser.lastName].filter(Boolean).join(' ') || 'Chuyên gia';
  }, [booking]);

  const canPay = booking?.status === 'accepted_pending_payment';
  const isPaid = booking?.status === 'paid_confirmed' || booking?.status === 'confirmed';

  useEffect(() => {
    if (paymentResult === 'success' && bookingId && isPaid) {
      navigate(`/payment/success?bookingId=${bookingId}`, { replace: true });
    }
  }, [bookingId, isPaid, navigate, paymentResult]);

  useEffect(() => {
    if (paymentResult !== 'success' || !bookingId || isPaid) return;

    let attempts = 0;
    setIsWaitingForWebhook(true);

    const intervalId = window.setInterval(async () => {
      attempts += 1;
      const { data: paymentStatus } = await api.get(`/bookings/${bookingId}/payment-status`);
      if (paymentStatus.paid) {
        await fetchBookingDetails(false);
      }
      if (paymentStatus.paid || attempts >= 15) {
        setIsWaitingForWebhook(false);
        window.clearInterval(intervalId);
      }
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [bookingId, fetchBookingDetails, isPaid, paymentResult]);

  const handleCreatePaymentLink = async () => {
    if (!booking?._id) return;

    setCreatingLink(true);
    setError('');

    try {
      const { data } = await api.post(`/bookings/${booking._id}/payment-link`);
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      setError('payOS chưa trả về đường dẫn thanh toán.');
    } catch (err: any) {
      console.error('payOS payment link failed:', err);
      setError(err.response?.data?.message || 'Không thể tạo link thanh toán payOS.');
    } finally {
      setCreatingLink(false);
    }
  };

  if (loading) {
    return (
      <div className="payment-page">
        <Navbar />
        <main className="container payment-content">
          <div className="loading-state">
            <Loader2 className="spinner" />
            <p>Đang tải thông tin thanh toán...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="payment-page">
      <Navbar />

      <main className="container payment-content">
        <nav className="breadcrumb">
          <Link to="/">Trang chủ</Link>
          <ChevronRight size={14} />
          <Link to="/account/request">Lịch đặt</Link>
          <ChevronRight size={14} />
          <span>Thanh toán</span>
        </nav>

        {paymentResult === 'success' && (
          <div className="form-success">
            {isPaid
              ? 'Thanh toán đã được xác nhận.'
              : isWaitingForWebhook
                ? 'payOS đã chuyển bạn về MomMate. Hệ thống đang chờ webhook ngân hàng xác nhận thanh toán.'
                : 'MomMate đang chờ ngân hàng xác nhận thanh toán. Bạn có thể quay lại lịch đặt để kiểm tra trạng thái sau.'}
          </div>
        )}
        {paymentResult === 'cancelled' && (
          <div className="form-alert">
            Bạn đã hủy phiên thanh toán payOS. Booking vẫn được giữ ở trạng thái chờ thanh toán.
          </div>
        )}
        {error && <div className="form-alert">{error}</div>}

        {!booking ? (
          <div className="empty-state">
            <p>Không tìm thấy booking cần thanh toán.</p>
            <Link to="/account/request" className="btn-primary">Quay lại lịch đặt</Link>
          </div>
        ) : (
          <div className="payment-layout">
            <aside className="stitch-payment-summary">
              <section className="stitch-payment-status"><div><Clock3 size={18} /><strong>Đang chờ thanh toán</strong></div><b>9:47</b><p>Vui lòng hoàn tất thanh toán trong thời gian giới hạn để giữ lịch hẹn.</p></section>
              <section className="stitch-payment-recap">
                <h2>Tóm tắt đặt lịch</h2>
                <div><Stethoscope /><p><small>Dịch vụ</small><strong>{booking.service?.title || 'Dịch vụ MomMate'}</strong></p></div>
                <div><UserRound /><p><small>Người chăm sóc</small><strong>{carerName}</strong></p></div>
                <div><CalendarDays /><p><small>Ngày & giờ</small><strong>{new Date(booking.scheduledAt).toLocaleString('vi-VN')}</strong></p></div>
                <footer>
                  <span>Phí dịch vụ <b>{formatCurrency(booking.totalPrice)}</b></span>
                  <span>Phí xử lý <b>0đ</b></span>
                  <strong>Tổng cộng <b>{formatCurrency(booking.totalPrice)}</b></strong>
                </footer>
              </section>
              <section className="stitch-payment-security"><ShieldCheck /><div><strong>Thanh toán bảo mật</strong><p>Thông tin thanh toán được mã hóa và xử lý an toàn bởi payOS.</p></div></section>
            </aside>

            <section className="stitch-payment-gateway">
              <header><div><strong>payOS</strong><span>Cổng thanh toán bảo mật</span></div><LockKeyhole size={20} /></header>
              <div className="stitch-gateway-body" style={{ padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                  <h3>Thanh toán qua Cổng payOS</h3>
                  <p style={{ color: '#666', marginBottom: '20px' }}>Hỗ trợ thanh toán bằng ứng dụng ngân hàng (VietQR) hoặc thẻ thanh toán quốc tế.</p>
                  
                  {isPaid ? (
                    <button className="stitch-pay-button" onClick={() => navigate('/account/request')}>Đã thanh toán</button>
                  ) : (
                    <button className="stitch-pay-button" onClick={handleCreatePaymentLink} disabled={!canPay || creatingLink}>
                      {creatingLink ? 'Đang tạo link payOS...' : `Thanh toán ${formatCurrency(booking.totalPrice)} an toàn`}
                      <ChevronRight size={18} />
                    </button>
                  )}
                  {!canPay && !isPaid && <p className="empty-text">Booking chưa được chuyên gia xác nhận nên chưa thể thanh toán.</p>}
                  <footer style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '15px' }}>
                    <span><ShieldCheck size={14} /> Tuân thủ PCI-DSS</span>
                    <span><LockKeyhole size={14} /> Mã hóa bảo mật</span>
                  </footer>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Payment;
