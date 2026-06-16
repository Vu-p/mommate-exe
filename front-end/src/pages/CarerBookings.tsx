import { useEffect, useState } from 'react';
import { Calendar, CheckCircle2, Loader2, MapPin, PlayCircle, SquareCheckBig, XCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './AccountRequests.css';

interface ContractState {
  status: 'pending' | 'signed' | 'voided';
}

const statusLabels: Record<string, string> = {
  pending: 'Chờ xác nhận',
  pending_carer: 'Chờ bạn xác nhận',
  accepted_pending_payment: 'Chờ khách thanh toán',
  paid_confirmed: 'Đã thanh toán',
  confirmed: 'Đã thanh toán',
  in_progress: 'Đang chăm sóc',
  completed: 'Hoàn tất',
  cancelled: 'Đã hủy',
  rejected: 'Đã từ chối',
};

const CarerBookings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [contract, setContract] = useState<ContractState | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'carer')) {
      navigate('/auth?mode=login');
      return;
    }

    if (!authLoading && user?.role === 'carer' && user.mustChangePassword) {
      navigate('/change-password');
      return;
    }

    if (!authLoading && user?.role === 'carer') {
      fetchBookings();
    }
  }, [authLoading, user, navigate]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const [bookingsResponse, contractResponse] = await Promise.all([
        api.get('/bookings/my'),
        api.get('/contracts/me').catch(() => ({ data: null })),
      ]);
      setBookings(bookingsResponse.data);
      setContract(contractResponse.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải lịch của carer.');
    } finally {
      setLoading(false);
    }
  };

  const patchBooking = async (bookingId: string, action: 'accept' | 'reject' | 'check-in' | 'check-out') => {
    const reason = action === 'reject' ? window.prompt('Lý do từ chối lịch này?') || '' : undefined;

    setUpdatingId(bookingId);
    setError('');

    try {
      await api.patch(`/bookings/${bookingId}/${action}`, reason ? { rejectionReason: reason } : {});
      await fetchBookings();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể cập nhật booking.');
    } finally {
      setUpdatingId('');
    }
  };

  const pendingBookings = bookings.filter((booking) => ['pending', 'pending_carer'].includes(booking.status));
  const activeBookings = bookings.filter((booking) =>
    ['accepted_pending_payment', 'paid_confirmed', 'confirmed', 'in_progress'].includes(booking.status)
  );
  const historyBookings = bookings.filter((booking) => ['completed', 'cancelled', 'rejected'].includes(booking.status));
  const hasSignedContract = contract?.status === 'signed';

  const renderBookingCard = (booking: any) => {
    const parentName = [booking.parent?.firstName, booking.parent?.lastName].filter(Boolean).join(' ') || 'Khách hàng';
    const isUpdating = updatingId === booking._id;

    return (
      <div key={booking._id} className="request-card">
        <div className="request-card-info">
          <div className="request-main">
            <h3>{booking.service?.title || 'Dịch vụ MomMate'}</h3>
            <div className="request-time">
              <Calendar size={14} style={{ marginRight: '6px' }} />
              {new Date(booking.scheduledAt).toLocaleString('vi-VN')}
            </div>
          </div>

          <div className="request-details">
            <div className="detail-item">
              <MapPin size={18} />
              <span>{booking.address}</span>
            </div>
            <div className="detail-item">
              <span>Khách: {parentName}</span>
            </div>
            <div className="detail-item">
              <span className={`status-badge ${booking.status}`}>
                {statusLabels[booking.status] || booking.status}
              </span>
            </div>
          </div>

          <div className="card-footer-layout">
            {['pending', 'pending_carer'].includes(booking.status) && (
              <>
                <button className="btn-pay-action" disabled={isUpdating || !hasSignedContract} onClick={() => patchBooking(booking._id, 'accept')}>
                  <CheckCircle2 size={16} /> Nhận lịch
                </button>
                <button className="btn-review-action" disabled={isUpdating} onClick={() => patchBooking(booking._id, 'reject')}>
                  <XCircle size={16} /> Từ chối
                </button>
              </>
            )}
            {['paid_confirmed', 'confirmed'].includes(booking.status) && (
              <button className="btn-pay-action" disabled={isUpdating || !hasSignedContract} onClick={() => patchBooking(booking._id, 'check-in')}>
                <PlayCircle size={16} /> Check-in
              </button>
            )}
            {booking.status === 'in_progress' && (
              <button className="btn-pay-action" disabled={isUpdating || !hasSignedContract} onClick={() => patchBooking(booking._id, 'check-out')}>
                <SquareCheckBig size={16} /> Check-out
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="account-requests-page">
      <Navbar />
      <main className="container account-dashboard">
        <nav className="breadcrumb">
          <Link to="/">Trang chủ</Link>
          <span>/</span>
          <span>Việc của carer</span>
        </nav>

        <section className="dashboard-content" style={{ maxWidth: 980, margin: '0 auto' }}>
          <div className="apply-form-heading">
            <p className="section-eyebrow">Caregiver workspace</p>
            <h1>Lịch chăm sóc của tôi</h1>
          </div>

          {error && <div className="form-alert">{error}</div>}
          {!loading && !authLoading && !hasSignedContract && (
            <div className="form-alert" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <span>Bạn cần ký hợp đồng điện tử trước khi nhận lịch, check-in hoặc check-out.</span>
              <Link to="/carer/contract" className="btn-pay-action" style={{ whiteSpace: 'nowrap' }}>
                Ký hợp đồng
              </Link>
            </div>
          )}
          {loading || authLoading ? (
            <div className="dashboard-loading">
              <Loader2 className="spinner" />
              <p>Đang tải lịch chăm sóc...</p>
            </div>
          ) : (
            <>
              <h2>Chờ xác nhận</h2>
              {pendingBookings.length > 0 ? pendingBookings.map(renderBookingCard) : <p className="empty-text">Không có lịch mới.</p>}

              <h2>Lịch đang xử lý</h2>
              {activeBookings.length > 0 ? activeBookings.map(renderBookingCard) : <p className="empty-text">Không có lịch đang xử lý.</p>}

              <h2>Lịch sử</h2>
              {historyBookings.length > 0 ? historyBookings.map(renderBookingCard) : <p className="empty-text">Chưa có lịch sử.</p>}
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CarerBookings;
