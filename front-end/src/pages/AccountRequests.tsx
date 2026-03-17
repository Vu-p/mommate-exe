import { ChevronRight, ChevronDown, User, FileText, Briefcase, Settings, LifeBuoy, MapPin, Image as ImageIcon, Loader2, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import './AccountRequests.css';

type RequestStatus = 'Pending' | 'Accepted' | 'Rejected';

const AccountRequests = () => {
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

  const filteredBookings = bookings.filter(b => {
    if (status === 'Pending') return b.status === 'pending';
    if (status === 'Accepted') return b.status === 'accepted' || b.status === 'paid' || b.status === 'completed';
    if (status === 'Rejected') return b.status === 'rejected';
    return true;
  });

  return (
    <div className="account-requests-page">
      <Navbar />

      <main className="container account-dashboard">
        <nav className="breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={14} />
          <span>Account</span>
          <ChevronRight size={14} />
          <span>Request</span>
        </nav>

        <div className="dashboard-layout">
          <aside className="dashboard-sidebar">
            <div className="user-profile-summary">
              <div className="avatar-placeholder">
                <ImageIcon size={24} />
              </div>
            </div>

            <nav className="sidebar-nav">
              <div className="nav-item">
                <User size={20} />
                <span>Profile</span>
              </div>
              
              <div className="nav-item active expandable">
                <div className="nav-item-header">
                  <FileText size={20} />
                  <span>Request</span>
                </div>
                <div className="nav-submenu">
                  <div 
                    className={`submenu-item ${status === 'Pending' ? 'active' : ''}`}
                    onClick={() => setStatus('Pending')}
                  >
                    <span>Pending</span>
                    <ChevronRight size={14} />
                  </div>
                  <div 
                    className={`submenu-item ${status === 'Accepted' ? 'active' : ''}`}
                    onClick={() => setStatus('Accepted')}
                  >
                    <span>Accepted</span>
                    <ChevronDown size={14} />
                  </div>
                  <div 
                    className={`submenu-item ${status === 'Rejected' ? 'active' : ''}`}
                    onClick={() => setStatus('Rejected')}
                  >
                    <span>Rejected</span>
                    <ChevronDown size={14} />
                  </div>
                </div>
              </div>

              <div className="nav-item">
                <Briefcase size={20} />
                <span>Start a job</span>
              </div>
              <div className="nav-item">
                <Settings size={20} />
                <span>Setting</span>
              </div>
              <div className="nav-item">
                <LifeBuoy size={20} />
                <span>Support</span>
              </div>
            </nav>
          </aside>

          <section className="dashboard-content">
            {loading ? (
              <div className="dashboard-loading">
                <Loader2 size={32} className="spinner" />
                <p>Loading your requests...</p>
              </div>
            ) : filteredBookings.length > 0 ? (
              <>
                {filteredBookings.map((booking) => (
                  <div key={booking._id} className="request-card">
                    <div className="request-card-info">
                      <div className="request-main">
                        <h3>{booking.service?.title || 'Unknown Service'}</h3>
                        <div className="request-time">
                          <Calendar size={14} style={{ marginRight: '6px' }} />
                          {new Date(booking.scheduledAt).toLocaleString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      
                      <div className="request-details">
                        <div className="detail-item">
                          <MapPin size={18} />
                          <span>{booking.address}</span>
                        </div>
                        <div className="detail-item">
                          <div className="carer-icon-mini">
                            <ImageIcon size={14} />
                          </div>
                          <span>
                            Carer: {booking.carer?.user?.firstName || 'Assigned'} {booking.carer?.user?.lastName || 'Carer'}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className={`status-badge ${booking.status}`}>{booking.status}</span>
                        </div>
                      </div>
                      
                      <div className="card-footer-layout">
                        <button className="btn-view-details">View Details</button>
                        {booking.status === 'accepted' && (
                          <button 
                            className="btn-pay-action" 
                            onClick={() => navigate('/payment', { state: { bookingId: booking._id } })}
                          >
                            Pay Now
                          </button>
                        )}
                        {booking.status === 'completed' && (
                          <button 
                            className="btn-review-action"
                            onClick={() => navigate('/review', { state: { bookingId: booking._id } })}
                          >
                            Review
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="empty-requests">
                <p>No {status.toLowerCase()} requests found.</p>
                <Link to="/services" className="btn-book-one">Book a service</Link>
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
