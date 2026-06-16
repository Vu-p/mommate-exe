import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';
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
    if (paymentResult !== 'success' || !bookingId || isPaid) return;

    let attempts = 0;
    setIsWaitingForWebhook(true);

    const intervalId = window.setInterval(async () => {
      attempts += 1;
      const latestBooking = await fetchBookingDetails(false);
      if (['paid_confirmed', 'confirmed'].includes(latestBooking?.status) || attempts >= 15) {
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
            <section className="payment-methods-col">
              <h2>Thanh toán qua payOS</h2>
              <p>
                Booking chỉ có thể thanh toán sau khi carer đã xác nhận nhận lịch. payOS sẽ tạo mã VietQR
                và ghi nhận giao dịch tự động qua webhook.
              </p>

              <div className="vietqr-details-card">
                <div className="bank-info-grid">
                  <div className="info-item">
                    <span className="label">Trạng thái booking</span>
                    <strong>{booking.status}</strong>
                  </div>
                  <div className="info-item">
                    <span className="label">payOS orderCode</span>
                    <strong>{booking.payosOrderCode || 'Chưa tạo'}</strong>
                  </div>
                  <div className="info-item full-width">
                    <span className="label">Ghi chú</span>
                    <strong>Webhook payOS là nguồn xác nhận thanh toán chính.</strong>
                  </div>
                </div>
              </div>

              {isPaid ? (
                <button className="btn-confirm-payment" onClick={() => navigate('/account/request')}>
                  Đã thanh toán - quay lại lịch đặt
                </button>
              ) : (
                <button 
                  className="btn-confirm-payment"
                  onClick={handleCreatePaymentLink}
                  disabled={!canPay || creatingLink}
                >
                  {creatingLink ? 'Đang tạo link payOS...' : 'Thanh toán qua payOS'}
                </button>
              )}

              {!canPay && !isPaid && (
                <p className="empty-text">
                  Booking này chưa được carer xác nhận nên chưa thể thanh toán.
                </p>
              )}
            </section>

            <aside className="booking-summary-col">
              <div className="summary-card">
                <div className="summary-header">
                  <div className="summary-image">
                    {booking.service?.image ? (
                      <img src={booking.service.image} alt={booking.service?.title || 'Service'} />
                    ) : (
                      <div className="img-placeholder" />
                    )}
                  </div>
                  <div className="summary-title-wrapper">
                    <h3>{booking.service?.title || 'Dịch vụ MomMate'}</h3>
                    <p className="carer-name">Chuyên gia: {carerName}</p>
                  </div>
                </div>

                <div className="summary-details">
                  <div className="summary-row">
                    <span>Lịch hẹn</span>
                    <span>{new Date(booking.scheduledAt).toLocaleString('vi-VN')}</span>
                  </div>
                  <div className="summary-row">
                    <span>Thời lượng</span>
                    <span>{booking.numSessions || 1} buổi x {booking.hours || 1} giờ</span>
                  </div>
                  <div className="summary-row">
                    <span>Địa chỉ</span>
                    <span>{booking.fullAddress || booking.address}</span>
                  </div>
                  <div className="summary-divider"></div>
                  <div className="summary-row total">
                    <span>Tổng thanh toán</span>
                    <span className="total-price">{formatCurrency(booking.totalPrice)}</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Payment;
