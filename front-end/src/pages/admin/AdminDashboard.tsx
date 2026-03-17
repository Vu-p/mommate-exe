import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
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
      const active = bookings.filter((b: any) => ['pending', 'accepted', 'paid'].includes(b.status)).length;

      setStats({
        totalBookings: bookings.length,
        activeBookings: active,
        totalRevenue: revenue,
        carerCount: carersRes.data.length,
        serviceCount: servicesRes.data.length
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
    <div className={`stat-card ${color}`}>
      <div className="stat-content">
        <span className="stat-title">{title}</span>
        <h2 className="stat-value">{value}</h2>
        {trend && (
          <div className={`stat-trend ${trend > 0 ? 'up' : 'down'}`}>
            {trend > 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            <span>{Math.abs(trend)}% from last month</span>
          </div>
        )}
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
          value={`$${stats.totalRevenue.toLocaleString()}`} 
          icon={DollarSign} 
          trend={12.5}
          color="purple"
        />
        <StatCard 
          title="Active Bookings" 
          value={stats.activeBookings} 
          icon={ShoppingBag} 
          trend={8.2}
          color="blue"
        />
        <StatCard 
          title="Service Carers" 
          value={stats.carerCount} 
          icon={Users} 
          trend={4.1}
          color="pink"
        />
        <StatCard 
          title="Total Requests" 
          value={stats.totalBookings} 
          icon={ClipboardList} 
          trend={-2.4}
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
            <button className="text-btn">View All</button>
          </div>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-indicator status-paid"></div>
              <div className="activity-details">
                <span className="activity-desc">Booking #8842 paid by <strong>Sarah J.</strong></span>
                <span className="activity-time">2 minutes ago</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-indicator status-pending"></div>
              <div className="activity-details">
                <span className="activity-desc">New carer request from <strong>Emily R.</strong></span>
                <span className="activity-time">15 minutes ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
