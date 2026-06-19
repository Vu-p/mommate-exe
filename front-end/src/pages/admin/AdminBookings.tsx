import { useEffect, useMemo, useState } from 'react';
import { Calendar, Eye, MapPin, Search, User } from 'lucide-react';
import { Link } from 'react-router-dom';
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
    _id: string;
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
  payosOrderCode?: number;
  payosPaymentLinkId?: string;
  payosStatus?: string;
  paidAt?: string;
  carerPayoutStatus?: string;
  carerPayoutAmount?: number;
  platformFeeAmount?: number;
}

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'pending_carer', label: 'Chờ carer' },
  { value: 'accepted_pending_payment', label: 'Chờ thanh toán' },
  { value: 'paid_confirmed', label: 'Đã thanh toán' },
  { value: 'in_progress', label: 'Đang chăm sóc' },
  { value: 'completed', label: 'Hoàn tất' },
  { value: 'cancelled', label: 'Đã hủy' },
  { value: 'rejected', label: 'Bị từ chối' },
];

const statusLabels: Record<string, string> = {
  pending: 'Chờ carer',
  pending_carer: 'Chờ carer',
  accepted_pending_payment: 'Chờ thanh toán',
  paid_confirmed: 'Đã thanh toán',
  confirmed: 'Đã thanh toán',
  in_progress: 'Đang chăm sóc',
  completed: 'Hoàn tất',
  cancelled: 'Đã hủy',
  rejected: 'Bị từ chối',
};

const formatCurrency = (value?: number) => `${Number(value || 0).toLocaleString('vi-VN')} VND`;

const AdminBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, paymentFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/bookings', {
        params: {
          status: statusFilter || undefined,
          payment: paymentFilter || undefined,
        },
      });
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
      await fetchBookings();
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
      case 'pending_carer':
      case 'accepted_pending_payment':
        return 'status-pending';
      case 'paid_confirmed':
      case 'confirmed':
        return 'status-accepted';
      case 'in_progress':
        return 'status-paid';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
      case 'rejected':
        return 'status-rejected';
      default:
        return '';
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const searchable = [
      booking.service?.title,
      booking.parent?.firstName,
      booking.parent?.lastName,
      booking.carer?.user?.firstName,
      booking.carer?.user?.lastName,
      booking.payosOrderCode,
      booking.payosPaymentLinkId,
    ].join(' ').toLowerCase();

    return searchable.includes(searchTerm.toLowerCase());
  });

  const payoutSummary = useMemo(() => {
    return filteredBookings.reduce(
      (summary, booking) => {
        if (booking.status === 'completed') {
          summary.completedRevenue += Number(booking.totalPrice || 0);
          summary.platformFees += Number(booking.platformFeeAmount || 0);
          summary.carerPayouts += Number(booking.carerPayoutAmount || 0);
        }
        return summary;
      },
      { completedRevenue: 0, platformFees: 0, carerPayouts: 0 }
    );
  }, [filteredBookings]);

  return (
    <div className="admin-page-content">
      <div className="page-header">
        <div className="header-text">
          <h1>Booking Orders</h1>
          <p>Theo dõi yêu cầu chăm sóc, payOS và đối soát trả lương carer.</p>
        </div>
      </div>

      <div className="table-controls">
        <div className="search-box">
          <Search size={20} />
          <input 
            type="text" 
            placeholder="Search client, carer, service, payOS..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          {statusOptions.map((option) => (
            <option key={option.value || 'all'} value={option.value}>{option.label}</option>
          ))}
        </select>
        <select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)}>
          <option value="">All payments</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
        </select>
      </div>

      <div className="admin-card" style={{ marginBottom: 18 }}>
        <div className="table-controls">
          <span className="price-tag">Completed revenue: {formatCurrency(payoutSummary.completedRevenue)}</span>
          <span className="price-tag">Platform fee: {formatCurrency(payoutSummary.platformFees)}</span>
          <span className="price-tag">Carer payout: {formatCurrency(payoutSummary.carerPayouts)}</span>
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
                  <th>payOS</th>
                  <th>Payout</th>
                  <th>Status</th><th></th>
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
                    <td><Link className="icon-btn view" to={`/admin/bookings/${booking._id}`}><Eye size={16} /></Link></td>
                    <td>
                      {booking.carer?.user?.firstName} {booking.carer?.user?.lastName}
                    </td>
                    <td>
                      <div className="td-multi-line">
                        <div className="icon-text"><Calendar size={14} /> {new Date(booking.scheduledAt).toLocaleDateString('vi-VN')}</div>
                        <div className="icon-text text-muted"><MapPin size={14} /> {booking.address}</div>
                      </div>
                    </td>
                    <td>
                      <div className="td-multi-line">
                        <span className="price-tag">{formatCurrency(booking.totalPrice)}</span>
                        <span className="text-muted">Fee {formatCurrency(booking.platformFeeAmount)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="td-multi-line">
                        <span>{booking.payosStatus || 'Not created'}</span>
                        <span className="text-muted">#{booking.payosOrderCode || '-'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="td-multi-line">
                        <span>{booking.carerPayoutStatus || 'unpaid'}</span>
                        <span className="text-muted">{formatCurrency(booking.carerPayoutAmount)}</span>
                      </div>
                    </td>
                    <td>
                      <select 
                        className={`status-select ${getStatusColor(booking.status)}`}
                        value={booking.status}
                        onChange={(e) => handleStatusChange(booking._id, e.target.value)}
                      >
                        {statusOptions.filter((option) => option.value).map((option) => (
                          <option key={option.value} value={option.value}>
                            {statusLabels[option.value] || option.label}
                          </option>
                        ))}
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
