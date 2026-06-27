import { Baby, BriefcaseMedical, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './AccountRequests.css';

const tabs = [
  ['all', 'Tất cả'],
  ['pending', 'Chờ xác nhận'],
  ['accepted_pending_payment', 'Chờ thanh toán'],
  ['in_progress', 'Đang thực hiện'],
  ['completed', 'Hoàn tất'],
] as const;

const labels: Record<string, string> = {
  pending: 'CHỜ XÁC NHẬN',
  pending_carer: 'CHỜ XÁC NHẬN',
  accepted_pending_payment: 'CHỜ THANH TOÁN',
  in_progress: 'ĐANG THỰC HIỆN',
  completed: 'HOÀN TẤT',
};

const AccountRequests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState('all');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    api.get('/bookings/my', { params: { page: 1, limit: 100 } })
      .then(({ data }) => setBookings(Array.isArray(data) ? data : data.items || []))
      .catch((error) => {
        console.error('Error fetching bookings:', error);
        setLoadError('Không thể tải danh sách yêu cầu. Vui lòng thử lại sau.');
      })
      .finally(() => setLoading(false));
  }, []);

  const openConversation = async (bookingId: string) => {
    const { data } = await api.post(`/messages/bookings/${bookingId}/conversation`);
    navigate(`/messages/${data._id}`);
  };

  const visible = useMemo(() => active === 'all' ? bookings : bookings.filter((item) => item.status === active), [active, bookings]);
  const activeCount = bookings.filter((item) => item.status === 'in_progress').length;
  const paymentCount = bookings.filter((item) => item.status === 'accepted_pending_payment').length;

  return (
    <div className="account-requests-page">
      <Navbar />
      <main className="container requests-main">
        <header className="requests-heading">
          <h1>Danh sách yêu cầu</h1>
          <p>Chào {user?.firstName || 'Lê Thùy Dương'}, quản lý các lịch đặt chăm sóc mẹ và bé của bạn.</p>
        </header>

        <nav className="requests-tabs">
          {tabs.map(([value, label]) => <button key={value} className={active === value ? 'active' : ''} onClick={() => setActive(value)}>{label}{value === 'accepted_pending_payment' && paymentCount > 0 && <i />}</button>)}
        </nav>

        <div className="requests-layout">
          <aside className="requests-summary">
            <h2>Tóm tắt hoạt động</h2>
            <p><span>Đang thực hiện</span><strong>{String(activeCount).padStart(2, '0')}</strong></p>
            <p><span>Chờ thanh toán</span><strong className="danger">{String(paymentCount).padStart(2, '0')}</strong></p>
            <p><span>Tổng đặt lịch</span><strong>{String(bookings.length).padStart(2, '0')}</strong></p>
          </aside>

          <section className="requests-list">
            {loading && <div className="dashboard-loading"><Loader2 className="spinner" />Đang tải lịch đặt...</div>}
            {!loading && loadError && <div className="requests-state requests-state-error"><BriefcaseMedical /><h2>Chưa thể tải lịch đặt</h2><p>{loadError}</p></div>}
            {!loading && !loadError && visible.length === 0 && <div className="requests-state"><Baby /><h2>Chưa có yêu cầu phù hợp</h2><p>Các lịch chăm sóc phù hợp với bộ lọc sẽ xuất hiện tại đây.</p></div>}
            {!loading && !loadError && visible.map((booking, index) => {
              const carer = booking.carer?.user || {};
              const isPayment = booking.status === 'accepted_pending_payment';
              const isCompleted = booking.status === 'completed';
              return (
                <article className={`request-row request-row-${booking.status}`} key={booking._id}>
                  <div className="request-row-top">
                    <div className="request-service-icon">{index === 1 ? <Baby /> : <BriefcaseMedical />}</div>
                    <div className="request-row-title">
                      <h3>{booking.service?.title || 'Dịch vụ MomMate'}</h3>
                      <p>Carer: <strong>{carer.firstName} {carer.lastName}</strong></p>
                    </div>
                    <div className="request-row-status"><span>{labels[booking.status] || booking.status}</span><small>Ngày đặt: {new Date(booking.scheduledAt).toLocaleDateString('vi-VN')}</small></div>
                  </div>
                  <div className="request-row-bottom">
                    <p>Tổng cộng: <strong>{Number(booking.totalPrice || 0).toLocaleString('vi-VN')}đ</strong></p>
                    <div>
                      <button className="request-detail-button" onClick={() => navigate(`/account/request/${booking._id}`)}>Chi tiết</button>
                      {isPayment && <button className="request-primary-button" onClick={() => navigate('/payment', { state: { bookingId: booking._id } })}>Thanh toán ngay</button>}
                      {['accepted_pending_payment','paid_confirmed','confirmed','in_progress'].includes(booking.status) && <button className="request-outline-button" onClick={() => openConversation(booking._id)}>Nhắn tin cho Carer</button>}
                      {isCompleted && <button className="request-review-button" onClick={() => navigate('/review', { state: { bookingId: booking._id } })}>Đánh giá</button>}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AccountRequests;
