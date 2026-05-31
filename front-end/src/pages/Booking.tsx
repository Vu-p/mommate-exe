import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Booking.css';

const Booking = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { serviceId, serviceTitle, carerId, carerName } = location.state || {};
  const hasRequiredBookingData = Boolean(serviceId && carerId);

  const [formData, setFormData] = useState({
    name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
    phone: '',
    area: 'Hồ Chí Minh',
    date: '',
    time: '08:00',
    notes: '',
    numSessions: 1,
    hours: 4
  });
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hasRequiredBookingData) {
      return;
    }

    // Re-fill if user session loads after component mount
    if (user && !formData.name) {
      setFormData(prev => ({
        ...prev,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim()
      }));
    }

    const fetchService = async () => {
      if (serviceId) {
        try {
          const { data } = await api.get(`/services/${serviceId}`);
          setService(data);
          // Don't auto-set session to 10 if we want default to 1 for simplicity, 
          // but we can respect service.sessionOptions if we want.
        } catch (error) {
          console.error('Error fetching service:', error);
        }
      }
    };
    fetchService();
  }, [hasRequiredBookingData, serviceId, user]);

  const pricePerHour = service?.price || 150000; // default 150k if missing
  const serviceFee = 5000;
  const subTotal = pricePerHour * formData.hours * formData.numSessions;
  const totalPrice = subTotal + serviceFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || !formData.time) {
      alert("Vui lòng chọn ngày và giờ hẹn.");
      return;
    }

    setLoading(true);
    try {
      const scheduledAt = new Date(`${formData.date}T${formData.time}`);
      
      if (!hasRequiredBookingData) {
        alert('Thiếu thông tin dịch vụ hoặc chuyên gia để đặt lịch.');
        return;
      }

      const payload = {
        carerId,
        serviceId,
        scheduledAt: scheduledAt,
        address: formData.area,
        notes: `Phone: ${formData.phone}. Notes: ${formData.notes}`,
        numSessions: formData.numSessions,
        hours: formData.hours,
        totalPrice: totalPrice
      };
      
      await api.post('/bookings', payload);
      // Navigate to request page or payment page depending on flow
      // MVP says we should go to /account/request or /payment. 
      // Actually we will navigate to /payment if booking is confirmed, but MVP says booking is pending first.
      navigate('/account/request');
    } catch (error) {
      console.error('Booking failed:', error);
      alert('Đặt lịch thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  if (!hasRequiredBookingData) {
    return (
      <div className="booking-page">
        <Navbar />
        <main className="container booking-content">
          <div className="empty-state booking-empty-state">
            <h2>Không đủ thông tin để đặt lịch</h2>
            <p>Vui lòng chọn một dịch vụ và một chuyên gia trước khi tiếp tục.</p>
            <div className="booking-empty-actions">
              <Link to="/services" className="btn-primary">Chọn dịch vụ</Link>
              <Link to="/carers" className="btn-secondary">Chọn chuyên gia</Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="booking-page">
      <Navbar />

      <main className="container booking-content">
        <nav className="breadcrumb">
          <Link to="/">Trang chủ</Link>
          <ChevronRight size={14} />
          <span>Đặt lịch</span>
        </nav>

        <div className="booking-layout">
          {/* Left Form Column */}
          <form className="booking-form-col" onSubmit={handleSubmit}>
            <div className="booking-form-section">
              <h2>Thông tin người đặt</h2>
              <div className="form-row-2">
                <div className="input-field">
                  <label>Họ và Tên</label>
                  <input 
                    type="text" required
                    placeholder="Nguyễn Văn A" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="input-field">
                  <label>Số điện thoại</label>
                  <input 
                    type="tel" required
                    placeholder="0123 456 789" 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="booking-form-section">
              <h2>Thông tin lịch hẹn</h2>
              <div className="input-field">
                <label>Khu vực</label>
                <div className="select-wrapper">
                  <select 
                    value={formData.area}
                    onChange={e => setFormData({...formData, area: e.target.value})}
                  >
                    <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="Đà Nẵng">Đà Nẵng</option>
                  </select>
                  <ChevronDown size={18} />
                </div>
              </div>

              <div className="form-row-2">
                <div className="input-field">
                  <label>Ngày hẹn</label>
                  <input 
                    type="date" required
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div className="input-field">
                  <label>Giờ hẹn</label>
                  <div className="select-wrapper">
                    <select 
                      value={formData.time}
                      onChange={e => setFormData({...formData, time: e.target.value})}
                    >
                      <option value="07:00">07:00</option>
                      <option value="08:00">08:00</option>
                      <option value="09:00">09:00</option>
                      <option value="10:00">10:00</option>
                      <option value="14:00">14:00</option>
                      <option value="15:00">15:00</option>
                    </select>
                    <ChevronDown size={18} />
                  </div>
                </div>
              </div>

              <div className="form-row-2">
                <div className="input-field">
                  <label>Số buổi</label>
                  <div className="select-wrapper">
                    <select 
                      value={formData.numSessions}
                      onChange={e => setFormData({...formData, numSessions: parseInt(e.target.value)})}
                    >
                      <option value="1">1 Buổi</option>
                      <option value="5">5 Buổi</option>
                      <option value="10">10 Buổi</option>
                    </select>
                    <ChevronDown size={18} />
                  </div>
                </div>
                <div className="input-field">
                  <label>Số giờ / buổi</label>
                  <div className="select-wrapper">
                    <select 
                      value={formData.hours}
                      onChange={e => setFormData({...formData, hours: parseInt(e.target.value)})}
                    >
                      <option value="2">2 Giờ</option>
                      <option value="4">4 Giờ</option>
                      <option value="8">8 Giờ</option>
                    </select>
                    <ChevronDown size={18} />
                  </div>
                </div>
              </div>

              <div className="input-field">
                <label>Lời nhắn</label>
                <textarea 
                  placeholder="Ghi chú thêm cho chuyên gia..."
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                ></textarea>
              </div>
            </div>
          </form>

          {/* Right Summary Column */}
          <aside className="booking-summary-col">
            <div className="summary-card">
              <div className="summary-header">
                <div className="summary-image">
                  {service?.image ? (
                    <img src={service.image} alt="Service" />
                  ) : (
                    <div className="img-placeholder">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                        <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="#A4A8B4" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="summary-title-wrapper">
                  <h3>{serviceTitle || service?.title || 'Tên dịch vụ'}</h3>
                  <p className="carer-name">Chuyên gia: {carerName || 'Đang cập nhật'}</p>
                </div>
              </div>

              <div className="summary-details">
                <div className="summary-row">
                  <span>Giá dịch vụ</span>
                  <span>{pricePerHour.toLocaleString()} VNĐ / giờ</span>
                </div>
                <div className="summary-row">
                  <span>Thời lượng</span>
                  <span>{formData.numSessions} buổi x {formData.hours} giờ</span>
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

              <button 
                type="submit" 
                className="btn-booking-submit" 
                disabled={loading}
                onClick={handleSubmit}
              >
                {loading ? 'Đang xử lý...' : 'Thanh toán'}
              </button>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Booking;
