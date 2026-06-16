import { Calendar, ChevronDown, ChevronRight, FileText, Image as ImageIcon, LifeBuoy, Loader2, MapPin, Settings, User, Briefcase } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './AccountRequests.css';

type RequestStatus = 'Pending' | 'Accepted' | 'Paid' | 'Active' | 'Completed' | 'Cancelled';

const statusGroups: Record<RequestStatus, string[]> = {
  Pending: ['pending', 'pending_carer'],
  Accepted: ['accepted_pending_payment'],
  Paid: ['paid_confirmed', 'confirmed'],
  Active: ['in_progress'],
  Completed: ['completed'],
  Cancelled: ['cancelled', 'rejected'],
};

const statusLabels: Record<string, string> = {
  pending: 'Chờ xác nhận',
  pending_carer: 'Chờ carer xác nhận',
  accepted_pending_payment: 'Chờ thanh toán',
  paid_confirmed: 'Đã thanh toán',
  confirmed: 'Đã thanh toán',
  in_progress: 'Đang chăm sóc',
  completed: 'Hoàn tất',
  cancelled: 'Đã hủy',
  rejected: 'Carer từ chối',
};

const timelineSteps = [
  { status: 'pending_carer', label: 'Chờ carer' },
  { status: 'accepted_pending_payment', label: 'Chờ thanh toán' },
  { status: 'paid_confirmed', label: 'Đã thanh toán' },
  { status: 'in_progress', label: 'Đang chăm sóc' },
  { status: 'completed', label: 'Hoàn tất' },
];

const getTimelineIndex = (status: string) => {
  if (status === 'pending') return 0;
  if (status === 'confirmed') return 2;
  const index = timelineSteps.findIndex((step) => step.status === status);
  return index >= 0 ? index : -1;
};

const AccountRequests = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<RequestStatus>('Pending');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const fetchMyBookings = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/bookings/my');
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter((booking) => statusGroups[status].includes(booking.status));

  return (
    <div className="account-requests-page">
      <Navbar />

      <main className="container account-dashboard">
        <nav className="breadcrumb">
          <Link to="/">Trang chủ</Link>
          <ChevronRight size={14} />
          <span>Tài khoản</span>
          <ChevronRight size={14} />
          <span>Lịch đặt</span>
        </nav>

        <div className="dashboard-layout">
          <aside className="dashboard-sidebar">
            <div className="user-profile-summary">
              <div className="avatar-placeholder">
                <ImageIcon size={24} />
              </div>
            </div>

            <nav className="sidebar-nav">
              <Link to="/account/profile" className="nav-item">
                <User size={20} />
                <span>Hồ sơ</span>
              </Link>
              
              <div className="nav-item active expandable">
                <div className="nav-item-header">
                  <FileText size={20} />
                  <span>Lịch đặt</span>
                </div>
                <div className="nav-submenu">
                  {(Object.keys(statusGroups) as RequestStatus[]).map((item) => (
                    <div
                      key={item}
                      className={`submenu-item ${status === item ? 'active' : ''}`}
                      onClick={() => setStatus(item)}
                    >
                      <span>{item}</span>
                      {status === item ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </div>
                  ))}
                </div>
              </div>

              {user?.role === 'carer' ? (
                <>
                  <Link to="/carer/profile" className="nav-item">
                    <Briefcase size={20} />
                    <span>Hồ sơ carer</span>
                  </Link>
                  <Link to="/carer/bookings" className="nav-item">
                    <Briefcase size={20} />
                    <span>Việc của tôi</span>
                  </Link>
                </>
              ) : (
                <Link to="/services" className="nav-item">
                  <Briefcase size={20} />
                  <span>Đặt dịch vụ</span>
                </Link>
              )}
              <div className="nav-item">
                <Settings size={20} />
                <span>Cài đặt</span>
              </div>
              <div className="nav-item" id="support">
                <LifeBuoy size={20} />
                <span>Hỗ trợ</span>
              </div>
            </nav>
          </aside>

          <section className="dashboard-content">
            {loading ? (
              <div className="dashboard-loading">
                <Loader2 size={32} className="spinner" />
                <p>Đang tải lịch đặt...</p>
              </div>
            ) : filteredBookings.length > 0 ? (
              <>
                {filteredBookings.map((booking) => {
                  const carerUser = booking.carer?.user || {};
                  const carerName = [carerUser.firstName, carerUser.lastName].filter(Boolean).join(' ') || 'Chuyên gia';
                  const currentStepIndex = getTimelineIndex(booking.status);

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
                            <span>{booking.fullAddress || booking.address}</span>
                          </div>
                          <div className="detail-item">
                            <div className="carer-icon-mini">
                              <ImageIcon size={14} />
                            </div>
                            <span>Carer: {carerName}</span>
                          </div>
                          <div className="detail-item">
                            <span className={`status-badge ${booking.status}`}>
                              {statusLabels[booking.status] || booking.status}
                            </span>
                          </div>
                        </div>

                        {!['cancelled', 'rejected'].includes(booking.status) && (
                          <div className="booking-timeline">
                            {timelineSteps.map((step, index) => (
                              <div
                                key={step.status}
                                className={`timeline-step ${index <= currentStepIndex ? 'done' : ''} ${index === currentStepIndex ? 'current' : ''}`}
                              >
                                <span className="timeline-dot" />
                                <span>{step.label}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="card-footer-layout">
                          <button className="btn-view-details">Xem chi tiết</button>
                          {booking.status === 'accepted_pending_payment' && (
                            <button 
                              className="btn-pay-action" 
                              onClick={() => navigate('/payment', { state: { bookingId: booking._id } })}
                            >
                              Thanh toán payOS
                            </button>
                          )}
                          {booking.status === 'completed' && (
                            <button 
                              className="btn-review-action"
                              onClick={() => navigate('/review', { state: { bookingId: booking._id } })}
                            >
                              Đánh giá
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="empty-requests">
                <p>Không có lịch đặt trong nhóm {status.toLowerCase()}.</p>
                <Link to="/services" className="btn-book-one">Đặt dịch vụ</Link>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AccountRequests;
