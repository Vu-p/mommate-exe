import { useState, useEffect } from 'react';
import { Search, Calendar, MapPin, User } from 'lucide-react';
import api from '../../utils/api';
import './AdminTable.css';

interface Booking {
  _id: string;
  parent: {
    firstName: string;
    lastName: string;
    email: string;
  };
  carer: {
    user: {
      firstName: string;
      lastName: string;
    }
  };
  service: {
    title: string;
  };
  status: string;
  scheduledAt: string;
  address: string;
  totalPrice: number;
}

const AdminBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/bookings');
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/bookings/${id}/status`, { status: newStatus });
      setBookings(bookings.map(b => b._id === id ? { ...b, status: newStatus } : b));
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'status-pending';
      case 'accepted': return 'status-accepted';
      case 'paid': return 'status-paid';
      case 'completed': return 'status-completed';
      case 'rejected': return 'status-rejected';
      default: return '';
    }
  };

  const filteredBookings = bookings.filter(booking =>
    (booking.service?.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (booking.parent?.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (booking.parent?.lastName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-page-content">
      <div className="page-header">
        <div className="header-text">
          <h1>Booking Orders</h1>
          <p>Managing the flow of care requests and completions.</p>
        </div>
      </div>

      <div className="table-controls">
        <div className="search-box">
          <Search size={20} />
          <input 
            type="text" 
            placeholder="Search by client or service..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-card">
        {loading ? (
          <div className="table-loading">Syncing active bookings...</div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Client & Service</th>
                  <th>Caregiver</th>
                  <th>Date & Location</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
                  <tr key={booking._id}>
                    <td>
                      <div className="td-main-info">
                        <div className="user-info">
                          <span className="user-icon"><User size={14} /></span>
                          {booking.parent?.firstName || 'Unknown'} {booking.parent?.lastName || 'Client'}
                        </div>
                        <div className="sub-info">{booking.service?.title || 'Deleted Service'}</div>
                      </div>
                    </td>
                    <td>
                      {booking.carer?.user?.firstName} {booking.carer?.user?.lastName}
                    </td>
                    <td>
                      <div className="td-multi-line">
                        <div className="icon-text"><Calendar size={14} /> {new Date(booking.scheduledAt).toLocaleDateString()}</div>
                        <div className="icon-text text-muted"><MapPin size={14} /> {booking.address}</div>
                      </div>
                    </td>
                    <td><span className="price-tag">${booking.totalPrice}</span></td>
                    <td>
                      <select 
                        className={`status-select ${getStatusColor(booking.status)}`}
                        value={booking.status}
                        onChange={(e) => handleStatusChange(booking._id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="accepted">Accepted</option>
                        <option value="paid">Paid</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBookings;
