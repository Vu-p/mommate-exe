import { useState, useEffect } from 'react';
import { ChevronRight, Upload, X } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import ImageUpload from '../components/common/ImageUpload';
import './Payment.css';
import './Booking.css'; // Re-use summary card styles

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingId } = location.state || {};
  const [booking, setBooking] = useState<any>(null);
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('vietqr');

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const { data } = await api.get(`/bookings/my`); // Simplified; ideally should be GET /bookings/:id
      const currentBooking = data.find((b: any) => b._id === bookingId);
      setBooking(currentBooking);
    } catch (error) {
      console.error('Error fetching booking details:', error);
    }
  };

  // Fake booking data if not found (for MVP testing without going through full flow)
  const displayBooking = booking || {
    service: { title: 'Mẹ và bé y khoa (Combo)', price: 150000, image: '' },
    carer: { user: { firstName: 'Nguyễn Thị', lastName: 'A' } },
    hours: 4,
    numSessions: 1,
    totalPrice: 150000 * 4 + 5000
  };

  const serviceTitle = displayBooking.service?.title;
  const carerName = `${displayBooking.carer?.user?.firstName || ''} ${displayBooking.carer?.user?.lastName || ''}`.trim() || 'Nguyễn Thị A';
  const pricePerHour = displayBooking.service?.price || 150000;
  const hours = displayBooking.hours || 4;
  const numSessions = displayBooking.numSessions || 1;
  const subTotal = pricePerHour * hours * numSessions;
  const serviceFee = 5000;
  const totalPrice = subTotal + serviceFee;

  const handleSubmitProof = async () => {
    if (!termsAccepted) {
      alert("Vui lòng đồng ý với điều khoản và chính sách.");
      return;
    }
    
    // Allow submitting even if no proof (as per design "không bắt buộc" - optional)
    setLoading(true);
    try {
      if (booking) {
        await api.patch(`/bookings/${booking._id}/payment-proof`, {
          paymentProofUrl,
          paymentNote: 'Thanh toán qua VietQR'
        });
      }
      // Navigate to success or request page
      navigate('/account/request');
    } catch (error) {
      console.error('Payment proof upload failed:', error);
      alert('Không thể xác nhận thanh toán. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-page">
      <Navbar />

      <main className="container payment-content">
        <nav className="breadcrumb">
          <Link to="/">Trang chủ</Link>
          <ChevronRight size={14} />
          <Link to="/booking">Đặt lịch</Link>
          <ChevronRight size={14} />
          <span>Thanh toán</span>
        </nav>

        <div className="payment-layout">
          {/* Left Form Column */}
          <section className="payment-methods-col">
            <h2>Thanh toán</h2>
            
            <div className="payment-options">
              <label className={`payment-radio-item ${paymentMethod === 'vietqr' ? 'active' : ''}`}>
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="vietqr"
                  checked={paymentMethod === 'vietqr'}
                  onChange={() => setPaymentMethod('vietqr')}
                />
                <span className="radio-circle"></span>
                Chuyển khoản (VietQR)
              </label>

              {paymentMethod === 'vietqr' && (
                <div className="vietqr-details-card">
                  <div className="bank-details-row">
                    <div className="bank-info-grid">
                      <div className="info-item">
                        <span className="label">Ngân hàng</span>
                        <div className="bank-logo-name">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/4/47/Logo_ACB.png" alt="ACB" className="acb-logo" />
                          <strong>Ngân hàng Á Châu (ACB)</strong>
                        </div>
                      </div>
                      <div className="info-item">
                        <span className="label">Tên tài khoản</span>
                        <strong>NGUYỄN VĂN A</strong>
                      </div>
                      <div className="info-item">
                        <span className="label">Số tài khoản</span>
                        <strong>123456789</strong>
                      </div>
                      <div className="info-item full-width">
                        <span className="label">Nội dung chuyển khoản</span>
                        <strong>Thanh toán dịch vụ cho {carerName}</strong>
                      </div>
                    </div>
                    
                    <div className="qr-code-box">
                      <div className="qr-image">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=example_qr" alt="QR Code" />
                      </div>
                    </div>
                  </div>

                  <div className="upload-proof-section">
                    <p className="upload-title">Tải biên lai lên (không bắt buộc)</p>
                    <div className="upload-box-wrapper">
                      <ImageUpload
                        label=""
                        onUploadSuccess={setPaymentProofUrl}
                        defaultImage={paymentProofUrl}
                      />
                    </div>
                  </div>
                </div>
              )}

              <label className={`payment-radio-item ${paymentMethod === 'napas' ? 'active' : ''}`}>
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="napas"
                  checked={paymentMethod === 'napas'}
                  onChange={() => setPaymentMethod('napas')}
                />
                <span className="radio-circle"></span>
                Thanh toán bằng thẻ (Napas)
              </label>
            </div>

            <div className="terms-checkbox">
              <label>
                <input 
                  type="checkbox" 
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                />
                <span className="custom-checkbox"></span>
                Tôi đã đọc và đồng ý với điều khoản cũng như chính sách bảo mật
              </label>
            </div>

            <button 
              className="btn-confirm-payment"
              onClick={handleSubmitProof}
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'Xác nhận đã chuyển'}
            </button>
          </section>

          {/* Right Summary Column - Reusing booking-summary styles */}
          <aside className="booking-summary-col">
            <div className="summary-card">
              <div className="summary-header">
                <div className="summary-image">
                  {displayBooking.service?.image ? (
                    <img src={displayBooking.service.image} alt="Service" />
                  ) : (
                    <div className="img-placeholder">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                        <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="#A4A8B4" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="summary-title-wrapper">
                  <h3>{serviceTitle}</h3>
                  <p className="carer-name">Chuyên gia: {carerName}</p>
                </div>
              </div>

              <div className="summary-details">
                <div className="summary-row">
                  <span>Giá dịch vụ</span>
                  <span>{pricePerHour.toLocaleString()} VNĐ / giờ</span>
                </div>
                <div className="summary-row">
                  <span>Tạm tính</span>
                  <span>{subTotal.toLocaleString()} VNĐ</span>
                </div>
                <div className="summary-row">
                  <span>Phí dịch vụ</span>
                  <span>{serviceFee.toLocaleString()} VNĐ</span>
                </div>
                
                <div className="summary-divider"></div>

                <div className="summary-row total">
                  <span>Tổng thanh toán</span>
                  <span className="total-price">{totalPrice.toLocaleString()} VNĐ</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Payment;
