import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp,
  ClipboardList
} from 'lucide-react';
import api from '../../utils/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeBookings: 0,
    totalRevenue: 0,
    carerCount: 0,
    serviceCount: 0
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, carersRes, servicesRes] = await Promise.all([
        api.get('/bookings'),
        api.get('/carers'),
        api.get('/services')
      ]);

      const bookings = bookingsRes.data;
      const revenue = bookings.reduce((acc: number, b: any) => acc + (b.totalPrice || 0), 0);
      const active = bookings.filter((b: any) =>
        ['pending', 'pending_carer', 'accepted_pending_payment', 'paid_confirmed', 'confirmed', 'in_progress'].includes(b.status)
      ).length;

      setStats({
        totalBookings: bookings.length,
        activeBookings: active,
        totalRevenue: revenue,
        carerCount: carersRes.data.length,
        serviceCount: servicesRes.data.length
      });
      setRecentBookings(bookings.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className={`stat-card ${color}`}>
      <div className="stat-content">
        <span className="stat-title">{title}</span>
        <h2 className="stat-value">{value}</h2>
      </div>
      <div className="stat-icon-wrapper">
        <Icon size={24} />
      </div>
    </div>
  );

  return (
    <div className="admin-page-content">
      <div className="page-header">
        <div className="header-text">
          <h1>Platform Overview</h1>
          <p>Welcome back! Here's what's happening on Mommate today.</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard 
          title="Total Revenue" 
          value={`${stats.totalRevenue.toLocaleString('vi-VN')} VND`} 
          icon={DollarSign} 
          color="purple"
        />
        <StatCard 
          title="Active Bookings" 
          value={stats.activeBookings} 
          icon={ShoppingBag} 
          color="blue"
        />
        <StatCard 
          title="Service Carers" 
          value={stats.carerCount} 
          icon={Users} 
          color="pink"
        />
        <StatCard 
          title="Total Requests" 
          value={stats.totalBookings} 
          icon={ClipboardList} 
          color="orange"
        />
      </div>

      <div className="dashboard-grid">
        <div className="admin-card main-chart-card">
          <div className="card-header">
            <h3>Revenue Growth</h3>
            <span className="subtitle">Visual performance over time</span>
          </div>
          <div className="placeholder-chart">
            <TrendingUp size={48} />
            <p>Chart data visualization will appear here</p>
          </div>
        </div>

        <div className="admin-card activity-card">
          <div className="card-header">
            <h3>Recent Activity</h3>
          </div>
          <div className="activity-list">
            {recentBookings.length > 0 ? recentBookings.map((booking) => (
              <div className="activity-item" key={booking._id}>
                <div className={`activity-indicator ${booking.status === 'paid_confirmed' || booking.status === 'confirmed' ? 'status-paid' : 'status-pending'}`}></div>
                <div className="activity-details">
                  <span className="activity-desc">
                    {booking.service?.title || 'Booking MomMate'} - <strong>{booking.status}</strong>
                  </span>
                  <span className="activity-time">{new Date(booking.createdAt || booking.scheduledAt).toLocaleString('vi-VN')}</span>
                </div>
              </div>
            )) : (
              <p className="activity-time">No real booking activity yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
