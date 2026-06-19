import { AlertTriangle, Calendar, CheckCircle2, Clock3, Loader2, MapPin, Phone, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './OperationalPages.css';

const labels: Record<string, string> = {
  pending: 'Chờ chuyên gia', pending_carer: 'Chờ chuyên gia', accepted_pending_payment: 'Chờ thanh toán',
  paid_confirmed: 'Đã thanh toán', confirmed: 'Đã thanh toán', in_progress: 'Đang chăm sóc',
  completed: 'Hoàn tất', cancelled: 'Đã hủy', rejected: 'Đã từ chối',
};

const BookingDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.get(`/bookings/${id}`).then(({ data }) => setBooking(data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="stitch-page"><Navbar /><main className="stitch-state"><Loader2 className="spinner" />Đang tải chi tiết lịch hẹn...</main></div>;
  if (!booking) return <div className="stitch-page"><Navbar /><main className="stitch-state">Không tìm thấy lịch hẹn.</main></div>;

  const carer = booking.carer?.user || {};
  const parent = booking.parent || {};
  const canReport = user && ['parent', 'carer'].includes(user.role);

  return (
    <div className="stitch-page">
      <Navbar />
      <main className="container operational-detail">
        <div className="operational-heading">
          <div><p className="stitch-eyebrow">CHI TIẾT LỊCH HẸN</p><h1>{booking.service?.title || 'Dịch vụ MomMate'}</h1><p>Mã lịch hẹn #{String(booking._id).slice(-8).toUpperCase()}</p></div>
          <span className={`stitch-status ${booking.status}`}>{labels[booking.status] || booking.status}</span>
        </div>
        <div className="operational-grid">
          <section className="stitch-card">
            <h2>Thông tin buổi chăm sóc</h2>
            <div className="detail-facts">
              <div><Calendar /><span><small>Ngày hẹn</small>{new Date(booking.scheduledAt).toLocaleDateString('vi-VN')}</span></div>
              <div><Clock3 /><span><small>Thời gian</small>{new Date(booking.scheduledAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span></div>
              <div><MapPin /><span><small>Địa chỉ</small>{booking.fullAddress || booking.address}</span></div>
              <div><Phone /><span><small>Liên hệ</small>{booking.contactPhone || parent.phoneNumber || 'Chưa cập nhật'}</span></div>
            </div>
            <h2>Hồ sơ chăm sóc</h2>
            <div className="clinical-grid">
              <p><strong>Đối tượng:</strong> {booking.careFor || 'Mẹ và bé'}</p>
              <p><strong>Tuần thai:</strong> {booking.pregnancyWeek || 'Không áp dụng'}</p>
              <p><strong>Tình trạng mẹ:</strong> {booking.motherCondition || 'Không có ghi chú'}</p>
              <p><strong>Tình trạng bé:</strong> {booking.babyCondition || 'Không có ghi chú'}</p>
              <p><strong>Lưu ý y tế:</strong> {booking.medicalNotes || booking.allergies || 'Không có'}</p>
              <p><strong>Lời nhắn:</strong> {booking.notes || 'Không có'}</p>
            </div>
          </section>
          <aside>
            <section className="stitch-card people-card">
              <h2>Người tham gia</h2>
              <div><UserRound /><span><small>Gia đình</small>{parent.firstName} {parent.lastName}</span></div>
              <div><CheckCircle2 /><span><small>Chuyên gia</small>{carer.firstName} {carer.lastName}</span></div>
            </section>
            <section className="stitch-card summary-panel">
              <h2>Thanh toán</h2>
              <p><span>{booking.numSessions || 1} buổi × {booking.hours || 1} giờ</span><strong>{Number(booking.totalPrice || 0).toLocaleString('vi-VN')}đ</strong></p>
              {booking.status === 'accepted_pending_payment' && user?.role === 'parent' && <button className="stitch-primary-button" onClick={() => navigate('/payment', { state: { bookingId: booking._id } })}>Thanh toán ngay</button>}
              {booking.status === 'completed' && user?.role === 'parent' && <button className="stitch-primary-button" onClick={() => navigate('/review', { state: { bookingId: booking._id, carerId: booking.carer?._id } })}>Đánh giá dịch vụ</button>}
              {canReport && <Link className="incident-link" to={`/incidents/new?bookingId=${booking._id}`}><AlertTriangle size={16} />Báo cáo sự cố</Link>}
            </section>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BookingDetail;
