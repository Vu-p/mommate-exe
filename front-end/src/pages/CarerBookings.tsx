import { AlertTriangle, CalendarDays, Clock3, LogIn, LogOut, MapPin, UserRound } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import activeAvatar from '../assets/stitch/generated/stitch-09-21ab241a02e0.png';
import './CarerWorkspace.css';
import './CarerBookings.css';

const tabStatuses: Record<string, string> = {
  pending: 'pending,pending_carer',
  upcoming: 'pending_payment,accepted_pending_payment,paid_confirmed,confirmed',
  active: 'in_progress',
  history: 'completed,cancelled,rejected',
};

const currentPosition = () => new Promise<GeolocationPosition>((resolve, reject) =>
  navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 }));

const CarerBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [signed, setSigned] = useState(false);
  const [tab, setTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [bookingResponse, contractResponse] = await Promise.all([
        api.get('/bookings/my', { params: { status: tabStatuses[tab], page: 1, limit: 20 } }),
        api.get('/contracts/me').catch(() => ({ data: null })),
      ]);
      setBookings(Array.isArray(bookingResponse.data) ? bookingResponse.data : bookingResponse.data.items || []);
      setSigned(contractResponse.data?.status === 'signed');
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Không thể tải lịch hẹn.');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { void load(); }, [load]);

  const action = async (id: string, type: string) => {
    try {
      let payload: Record<string, unknown> = {};
      if (type === 'reject') {
        const reason = window.prompt('Vui lòng nhập lý do từ chối');
        if (!reason?.trim()) return;
        payload = { rejectionReason: reason.trim() };
      }
      if (type === 'check-in' || type === 'check-out') {
        const position = await currentPosition();
        payload = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
      }
      await api.patch(`/bookings/${id}/${type}`, payload);
      await load();
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Không thể cập nhật lịch hẹn.');
    }
  };

  const renderCard = (booking: any) => {
    if (['pending', 'pending_carer'].includes(booking.status)) {
      return (
        <article key={booking._id} className="carer-booking-card">
          <header><UserRound/><div><h2>{booking.parent?.firstName} {booking.parent?.lastName}</h2><strong>{booking.service?.title}</strong></div><b>{Number(booking.totalPrice).toLocaleString('vi-VN')}đ</b></header>
          <div className="booking-card-facts">
            <p><CalendarDays/>{new Date(booking.scheduledAt).toLocaleString('vi-VN')}</p>
            <p><MapPin/>{booking.fullAddress || booking.address}</p>
            <p>{booking.medicalNotes || booking.notes || 'Không có ghi chú bổ sung.'}</p>
          </div>
          <footer>
            <button disabled={!signed} onClick={() => action(booking._id, 'accept')}>Chấp nhận</button>
            <button onClick={() => action(booking._id, 'reject')}>Từ chối</button>
          </footer>
        </article>
      );
    }
    
    if (['pending_payment', 'accepted_pending_payment', 'paid_confirmed', 'confirmed'].includes(booking.status)) {
      return (
        <article key={booking._id} className="carer-booking-card">
          <header><UserRound/><div><h2>{booking.parent?.firstName} {booking.parent?.lastName}</h2><strong>{booking.service?.title}</strong></div><b>{Number(booking.totalPrice).toLocaleString('vi-VN')}đ</b></header>
          <div className="booking-card-facts">
            <p><Clock3/>{new Date(booking.scheduledAt).toLocaleString('vi-VN')}</p>
            <p><MapPin/>{booking.serviceMode === 'online' ? 'Hẹn trực tuyến' : booking.fullAddress || booking.address}</p>
            <p style={{color: booking.status === 'pending_payment' ? '#f59e0b' : '#10b981'}}>
              {booking.status === 'pending_payment' ? 'Chờ KH thanh toán' : 'Đã xác nhận'}
            </p>
          </div>
          {['paid_confirmed', 'confirmed'].includes(booking.status) && (
            <button className="checkin-button" onClick={() => action(booking._id, 'check-in')}><LogIn/>Điểm danh</button>
          )}
          <button onClick={() => navigate(`/carer/bookings/${booking._id}`)}>Xem chi tiết</button>
        </article>
      );
    }
    
    if (booking.status === 'in_progress') {
      return (
        <article key={booking._id} className="carer-booking-card active-case">
          <header><img src={booking.parent?.avatar || activeAvatar} alt=""/><div><h2>{booking.parent?.firstName} {booking.parent?.lastName}</h2><strong>{booking.service?.title}</strong></div><b>{Number(booking.totalPrice).toLocaleString('vi-VN')}đ</b></header>
          <div className="elapsed">Bắt đầu: {new Date(booking.checkInAt || booking.scheduledAt).toLocaleTimeString('vi-VN')} <strong>• Đang thực hiện</strong></div>
          <p><MapPin/>{booking.fullAddress || booking.address}</p>
          <footer>
            <button onClick={() => navigate(`/carer/bookings/${booking._id}`)}>Nhật ký chăm sóc</button>
            <button className="danger" onClick={() => action(booking._id, 'check-out')}><LogOut/>Kết thúc ca</button>
          </footer>
        </article>
      );
    }
    
    // History
    return (
      <article key={booking._id} className="carer-booking-card">
        <header><UserRound/><div><h2>{booking.parent?.firstName} {booking.parent?.lastName}</h2><strong>{booking.service?.title}</strong></div><b>{Number(booking.totalPrice).toLocaleString('vi-VN')}đ</b></header>
        <div className="booking-card-facts">
          <p><CalendarDays/>{new Date(booking.scheduledAt).toLocaleString('vi-VN')}</p>
          <p>Trạng thái: <strong>{booking.status === 'completed' ? 'Hoàn thành' : booking.status === 'cancelled' ? 'Đã hủy' : 'Đã từ chối'}</strong></p>
        </div>
        <button onClick={() => navigate(`/carer/bookings/${booking._id}`)}>Xem chi tiết</button>
      </article>
    );
  };

  return <div className="carer-workspace-page carer-bookings-workspace"><Navbar/><main className="container carer-bookings-main">
    <h1>Quản lý lịch hẹn</h1>
    {!signed && <section className="contract-warning"><AlertTriangle/><p><strong>Yêu cầu hành động: Ký Hợp đồng Dịch vụ</strong><span>Để chấp nhận yêu cầu mới và nhận thanh toán, bạn cần ký hợp đồng dịch vụ mới nhất.</span></p><Link to="/carer/contract">Ký hợp đồng ngay</Link></section>}
    <nav className="booking-workspace-tabs">
      <button className={tab === 'pending' ? 'active' : ''} onClick={() => setTab('pending')}>Yêu cầu chờ</button>
      <button className={tab === 'upcoming' ? 'active' : ''} onClick={() => setTab('upcoming')}>Sắp tới</button>
      <button className={tab === 'active' ? 'active' : ''} onClick={() => setTab('active')}>Đang diễn ra</button>
      <button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>Lịch sử đặt lịch</button>
    </nav>
    {error && <p className="stitch-error">{error}</p>}
    {loading && <p>Đang tải lịch hẹn...</p>}
    <div className="carer-booking-grid">
      {bookings.map(renderCard)}
    </div>
    {!loading && bookings.length === 0 && <section className="empty-booking-workspace"><CalendarDays/><p>Không có lịch hẹn trong nhóm này.</p></section>}
  </main><Footer/></div>;
};

export default CarerBookings;
