import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronRight, Clock3, Loader2, LockKeyhole, ShieldCheck, Stethoscope, UserRound, Copy, CheckCircle2 } from 'lucide-react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLink, setPaymentLink] = useState<any>(null);
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState('');

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
    if (!booking || !canPay || paymentLink || isPaid) return;

    const createLink = async () => {
      try {
        const { data } = await api.post(`/bookings/${booking._id}/payment-link`);
        if (data.qrCode) {
          setPaymentLink(data);
        } else {
          setError('Không thể lấy thông tin thanh toán.');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Không thể tạo link thanh toán.');
      }
    };
    createLink();
  }, [booking, canPay, isPaid, paymentLink]);

  useEffect(() => {
    if (!bookingId || isPaid) return;

    const intervalId = window.setInterval(async () => {
      try {
        const { data: paymentStatus } = await api.get(`/bookings/${bookingId}/payment-status`);
        if (paymentStatus.paid) {
          await fetchBookingDetails(false);
          window.clearInterval(intervalId);
        }
      } catch (e) {
        console.error('Polling error', e);
      }
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [bookingId, fetchBookingDetails, isPaid]);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2000);
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
          <Link to="/bookings">Lịch đặt</Link>
          <ChevronRight size={14} />
          <span>Thanh toán</span>
        </nav>

        {error && <div className="form-alert">{error}</div>}

        {!booking ? (
          <div className="empty-state">
            <p>Không tìm thấy booking cần thanh toán.</p>
            <Link to="/bookings" className="btn-primary">Quay lại lịch đặt</Link>
          </div>
        ) : (
          <motion.div 
            className="payment-layout"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <aside className="stitch-payment-summary">
              {isPaid ? (
                <section className="stitch-payment-status success">
                  <div><CheckCircle2 size={18} /><strong>Thanh toán thành công</strong></div>
                  <p>Cảm ơn bạn. Booking đã được xác nhận!</p>
                </section>
              ) : (
                <section className="stitch-payment-status">
                  <div><Clock3 size={18} /><strong>Đang chờ thanh toán</strong></div>
                  <p>Vui lòng hoàn tất thanh toán trong thời gian giới hạn để giữ lịch hẹn.</p>
                </section>
              )}
              
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
              <section className="stitch-payment-security"><ShieldCheck /><div><strong>Thanh toán bảo mật</strong><p>Giao dịch được xử lý tự động và mã hóa an toàn bởi payOS.</p></div></section>
            </aside>

            <section className="stitch-payment-gateway">
              <header>
                <div><strong>Thanh toán chuyển khoản (VietQR)</strong><span>Sử dụng ứng dụng ngân hàng để quét mã</span></div>
                <LockKeyhole size={20} />
              </header>
              <div className="stitch-gateway-body">
                {isPaid ? (
                  <div className="payment-success-view">
                    <div className="success-icon-wrapper">
                      <CheckCircle2 size={64} />
                    </div>
                    <h2>Thanh toán thành công!</h2>
                    <p>Lịch hẹn đã được xác nhận. Chuyên gia sẽ sớm liên hệ với bạn.</p>
                    <button className="stitch-pay-button" onClick={() => navigate(`/bookings/${booking._id}`)}>Xem chi tiết lịch hẹn</button>
                  </div>
                ) : !paymentLink ? (
                  <div className="loading-state">
                    <Loader2 className="spinner" />
                    <p>Đang khởi tạo mã thanh toán...</p>
                  </div>
                ) : (
                  <div className="payment-qr-view">
                    <div className="qr-container" style={{ padding: 0, overflow: 'hidden', border: 'none', background: 'transparent', boxShadow: 'none', width: '320px' }}>
                      <img 
                        src={`https://img.vietqr.io/image/${paymentLink.bin || '970436'}-${paymentLink.accountNumber}-compact2.jpg?amount=${paymentLink.amount}&addInfo=${encodeURIComponent(paymentLink.description)}&accountName=${encodeURIComponent(paymentLink.accountName)}`}
                        alt="VietQR Code" 
                        style={{ width: '320px', height: 'auto', borderRadius: '12px', display: 'block' }}
                      />
                    </div>
                    
                    <div className="payment-instructions">
                      <div className="instruction-alert" style={{ backgroundColor: '#fef2f2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', fontWeight: '500' }}>
                        ⚠️ Lưu ý: Bạn BẮT BUỘC phải mở <strong>Ứng dụng Ngân hàng</strong> (Vietcombank, MBBank...) để quét mã này, không dùng Camera thường hay Zalo.
                      </div>
                      <p className="instruction-text">Hoặc chuyển khoản thủ công theo thông tin bên dưới:</p>
                      
                      <div className="transfer-details">
                        <div className="detail-row">
                          <span className="detail-label">Ngân hàng</span>
                          <strong className="detail-value">{paymentLink.bin || '970436 (Vietcombank)'}</strong>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Số tài khoản</span>
                          <strong className="detail-value">
                            {paymentLink.accountNumber}
                            <button onClick={() => handleCopy(paymentLink.accountNumber, 'account')} className="copy-btn">
                              {copiedField === 'account' ? <CheckCircle2 size={14} color="#16a34a"/> : <Copy size={14} />}
                            </button>
                          </strong>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Chủ tài khoản</span>
                          <strong className="detail-value">{paymentLink.accountName}</strong>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Số tiền</span>
                          <strong className="detail-value highlight">
                            {formatCurrency(paymentLink.amount)}
                            <button onClick={() => handleCopy(String(paymentLink.amount), 'amount')} className="copy-btn">
                              {copiedField === 'amount' ? <CheckCircle2 size={14} color="#16a34a"/> : <Copy size={14} />}
                            </button>
                          </strong>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Nội dung (Bắt buộc)</span>
                          <strong className="detail-value highlight">
                            {paymentLink.description}
                            <button onClick={() => handleCopy(paymentLink.description, 'description')} className="copy-btn">
                              {copiedField === 'description' ? <CheckCircle2 size={14} color="#16a34a"/> : <Copy size={14} />}
                            </button>
                          </strong>
                        </div>
                      </div>

                      <div className="waiting-status">
                        <Loader2 className="spinner small" />
                        <span>Hệ thống đang chờ thanh toán... (Tự động cập nhật)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Payment;
