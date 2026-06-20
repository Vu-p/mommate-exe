import { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle2, ChevronDown, ClipboardList, MapPin, ShieldCheck, UsersRound, CalendarDays, FileHeart } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './Booking.css';

const Booking = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const state = location.state || {};
  const serviceId = state.serviceId || query.get('serviceId');
  const serviceTitle = state.serviceTitle || query.get('serviceTitle');
  const carerId = state.carerId || query.get('carerId');
  const hasRequiredBookingData = Boolean(serviceId && carerId);

  const [formData, setFormData] = useState({
    name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
    contactPhone: user?.phoneNumber || '',
    city: 'Hồ Chí Minh',
    district: '',
    fullAddress: '',
    date: '',
    time: '08:00',
    careFor: 'mom_and_baby',
    pregnancyWeek: '',
    expectedBirthDate: '',
    babyBirthDate: '',
    birthMethod: 'unknown',
    motherCondition: '',
    babyCondition: '',
    allergies: '',
    medicalNotes: '',
    notes: '',
    numSessions: 10,
    hours: 4
  });
  const [service, setService] = useState<any>(null);
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const today = new Date();
  const minimumBookingDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

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

  const pricePerHour = quote?.unitPrice ?? service?.price ?? 0;
  const subTotal = quote?.totalPrice ?? pricePerHour * formData.hours * formData.numSessions;
  const serviceFee = quote?.platformFeeAmount ?? 0;
  const totalPrice = quote?.totalPrice ?? subTotal;

  useEffect(() => {
    if (!carerId || !serviceId || !formData.date || !formData.time) {
      setQuote(null);
      return;
    }
    const scheduledAt = new Date(`${formData.date}T${formData.time}:00`);
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) return;
    const timer = window.setTimeout(() => {
      api.post('/bookings/quote', {
        carerId,
        serviceId,
        scheduledAt: scheduledAt.toISOString(),
        numSessions: formData.numSessions,
        hours: formData.hours,
      }).then(({ data }) => setQuote(data)).catch(() => setQuote(null));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [carerId, serviceId, formData.date, formData.time, formData.numSessions, formData.hours]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || !formData.time) {
      alert("Vui lòng chọn ngày và giờ hẹn.");
      return;
    }

    if (!formData.contactPhone.trim() || !formData.fullAddress.trim()) {
      alert('Vui lòng nhập số điện thoại liên hệ và địa chỉ chăm sóc chi tiết.');
      return;
    }

    setLoading(true);
    try {
      const scheduledAt = new Date(`${formData.date}T${formData.time}:00`);

      if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now()) {
        alert('Vui lòng chọn thời gian hẹn trong tương lai.');
        return;
      }
      
      if (!hasRequiredBookingData) {
        alert('Thiếu thông tin dịch vụ hoặc chuyên gia để đặt lịch.');
        return;
      }

      const payload = {
        carerId,
        serviceId,
        scheduledAt: scheduledAt.toISOString(),
        contactName: formData.name,
        contactPhone: formData.contactPhone,
        city: formData.city,
        district: formData.district,
        fullAddress: formData.fullAddress,
        address: formData.fullAddress,
        careFor: formData.careFor,
        pregnancyWeek: formData.pregnancyWeek ? Number(formData.pregnancyWeek) : undefined,
        expectedBirthDate: formData.expectedBirthDate || undefined,
        babyBirthDate: formData.babyBirthDate || undefined,
        birthMethod: formData.birthMethod,
        motherCondition: formData.motherCondition,
        babyCondition: formData.babyCondition,
        allergies: formData.allergies,
        medicalNotes: formData.medicalNotes,
        notes: formData.notes,
        numSessions: formData.numSessions,
        hours: formData.hours
      };
      
      if (!quote?.available) {
        alert('Khung giờ này không còn trống. Vui lòng chọn thời gian khác.');
        return;
      }
      const { data } = await api.post('/bookings', payload);
      navigate(`/account/request/${data._id}`);
    } catch (error) {
      console.error('Booking failed:', error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message
        : '';
      alert(message || 'Đặt lịch thất bại. Vui lòng kiểm tra lại thông tin.');
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
        <header className="stitch-booking-heading">
          <div><span>ĐĂNG KÝ DỊCH VỤ</span><span>XÁC MINH Y TẾ</span></div>
          <h1>Thông tin đặt lịch chăm sóc</h1>
          <p>Vui lòng cung cấp chi tiết thông tin để chúng tôi có thể điều phối nhân viên y tế (Điều dưỡng/Nữ hộ sinh) phù hợp nhất với nhu cầu của gia đình.</p>
        </header>

        <div className="booking-layout">
          {/* Left Form Column */}
          <form id="booking-request-form" className="booking-form-col" onSubmit={handleSubmit}>
            <div className="booking-form-section">
              <h2><MapPin /> <span>1.</span> Thông tin liên hệ & Địa chỉ</h2>
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
                  <label>Số điện thoại liên hệ</label>
                  <input 
                    type="tel" required
                    placeholder="0123 456 789" 
                    value={formData.contactPhone}
                    onChange={e => setFormData({...formData, contactPhone: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-row-2">
                <div className="input-field">
                  <label>Thành phố</label>
                  <div className="select-wrapper">
                    <select
                      value={formData.city}
                      onChange={e => setFormData({...formData, city: e.target.value})}
                    >
                      <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                      <option value="Hà Nội">Hà Nội</option>
                      <option value="Đà Nẵng">Đà Nẵng</option>
                    </select>
                    <ChevronDown size={18} />
                  </div>
                </div>
                <div className="input-field">
                  <label>Quận / huyện</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Quận 7"
                    value={formData.district}
                    onChange={e => setFormData({...formData, district: e.target.value})}
                  />
                </div>
              </div>
              <div className="input-field">
                <label>Địa chỉ chi tiết</label>
                <input
                  type="text"
                  required
                  placeholder="Số nhà, tên đường, tòa nhà, căn hộ..."
                  value={formData.fullAddress}
                  onChange={e => setFormData({...formData, fullAddress: e.target.value})}
                />
              </div>
            </div>

            <div className="booking-form-section">
              <h2><UsersRound /> <span>2.</span> Đối tượng chăm sóc</h2>
              <div className="stitch-care-options">
                {[['pregnant_mom', 'Mẹ bầu'], ['postpartum_mom', 'Mẹ sau sinh'], ['baby', 'Em bé'], ['mom_and_baby', 'Mẹ & bé']].map(([value, label]) => (
                  <button type="button" key={value} className={formData.careFor === value ? 'active' : ''} onClick={() => setFormData({...formData, careFor: value})}>
                    <span>{label.slice(0, 1)}</span>{label}
                  </button>
                ))}
              </div>
            </div>

            <div className="booking-form-section">
              <h2><FileHeart /> <span>3.</span> Hồ sơ sức khỏe</h2>
              <div className="form-row-2">
                <div className="input-field">
                  <label>Tuần thai</label>
                  <input type="number" min="1" max="42" placeholder="Nếu đang mang thai" value={formData.pregnancyWeek}
                    onChange={e => setFormData({...formData, pregnancyWeek: e.target.value})}
                  />
                </div>
                <div className="input-field">
                  <label>Ngày dự sinh</label>
                  <input type="date" value={formData.expectedBirthDate} onChange={e => setFormData({...formData, expectedBirthDate: e.target.value})} />
                </div>
              </div>
              <div className="form-row-2">
                <div className="input-field">
                  <label>Ngày sinh của bé</label>
                  <input type="date" value={formData.babyBirthDate} onChange={e => setFormData({...formData, babyBirthDate: e.target.value})} />
                </div>
                <div className="input-field">
                  <label>Hình thức sinh</label>
                  <div className="select-wrapper">
                    <select value={formData.birthMethod} onChange={e => setFormData({...formData, birthMethod: e.target.value})}>
                      <option value="unknown">Chưa cập nhật</option><option value="vaginal">Sinh thường</option><option value="c_section">Sinh mổ</option>
                    </select>
                    <ChevronDown size={18} />
                  </div>
                </div>
              </div>
              <div className="form-row-2">
                <div className="input-field">
                  <label>Tình trạng mẹ</label>
                  <textarea
                    placeholder="Ví dụ: đau vết mổ, tắc tia sữa, cần hỗ trợ vận động..."
                    value={formData.motherCondition}
                    onChange={e => setFormData({...formData, motherCondition: e.target.value})}
                  />
                </div>
                <div className="input-field">
                  <label>Tình trạng bé</label>
                  <textarea
                    placeholder="Ví dụ: tuổi bé, lịch ăn/ngủ, vàng da, quấy đêm..."
                    value={formData.babyCondition}
                    onChange={e => setFormData({...formData, babyCondition: e.target.value})}
                  />
                </div>
              </div>
              <div className="input-field">
                <label>Lưu ý y tế & dị ứng</label>
                <textarea placeholder="Chẩn đoán, dị ứng, chỉ định bác sĩ hoặc lưu ý đặc biệt..."
                  value={formData.medicalNotes} onChange={e => setFormData({...formData, medicalNotes: e.target.value})} />
              </div>
            </div>

            <div className="booking-form-section">
              <h2><CalendarDays /> <span>4.</span> Lịch trình chăm sóc</h2>
              <div className="form-row-2">
                <div className="input-field"><label>Ngày hẹn</label><input type="date" min={minimumBookingDate} required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
                <div className="input-field"><label>Giờ hẹn</label><div className="select-wrapper"><select value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})}>
                  <option value="07:00">07:00</option><option value="08:00">08:00</option><option value="09:00">09:00</option><option value="14:00">14:00</option><option value="15:00">15:00</option>
                </select><ChevronDown size={18} /></div></div>
              </div>
              <div className="form-row-2">
                <div className="input-field"><label>Số buổi</label><div className="select-wrapper"><select value={formData.numSessions} onChange={e => setFormData({...formData, numSessions: parseInt(e.target.value)})}><option value="1">1 buổi</option><option value="5">5 buổi</option><option value="10">10 buổi</option></select><ChevronDown size={18} /></div></div>
                <div className="input-field"><label>Số giờ / buổi</label><div className="select-wrapper"><select value={formData.hours} onChange={e => setFormData({...formData, hours: parseInt(e.target.value)})}><option value="2">2 giờ</option><option value="4">4 giờ</option><option value="8">8 giờ</option></select><ChevronDown size={18} /></div></div>
              </div>
              <div className="input-field"><label>Lời nhắn cho chuyên gia</label><textarea placeholder="Ghi chú thêm cho chuyên gia..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} /></div>
            </div>
          </form>

          {/* Right Summary Column */}
          <aside className="booking-summary-col">
            <div className="summary-card">
              <h2 className="booking-summary-title"><ClipboardList />Tổng hợp chi phí</h2>

              <div className="summary-details">
                <div className="summary-row">
                  <span>Gói chăm sóc</span>
                  <strong>{serviceTitle || service?.title || 'Chăm sóc mẹ sau sinh'}</strong>
                </div>
                <div className="summary-row">
                  <span>Đơn giá/giờ</span>
                  <span>{pricePerHour.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="summary-row">
                  <span>Số buổi ({formData.numSessions} buổi)</span>
                  <span>x{formData.numSessions}</span>
                </div>
                <div className="summary-row">
                  <span>Thời gian ({formData.hours}h/buổi)</span>
                  <span>x{formData.hours}</span>
                </div>
                
                <div className="summary-divider"></div>

                <div className="summary-row total">
                  <span>Tổng cộng</span>
                  <span className="total-price">{subTotal.toLocaleString('vi-VN')}đ</span>
                </div>
                <em>*Đã bao gồm VAT và dụng cụ y tế cơ bản</em>
              </div>

              <button 
                type="submit" 
                form="booking-request-form"
                className="btn-booking-submit" 
                disabled={loading}
              >
                {loading ? 'Đang xử lý...' : 'Xác nhận đặt lịch'} <ArrowRight />
              </button>
            </div>
            <div className="booking-trust-card">
              <header><ShieldCheck /><div><strong>Cam kết tin cậy</strong><span>An tâm cho cả mẹ và bé</span></div></header>
              <p><CheckCircle2 />100% Nhân viên có bằng cấp y khoa</p>
              <p><CheckCircle2 />Kiểm tra sức khỏe định kỳ 2 lần/tháng</p>
              <p><CheckCircle2 />Hỗ trợ 24/7 qua hotline y tế</p>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Booking;
