import { useEffect, useState } from 'react';
import { CalendarDays, DollarSign, TrendingUp, UserRoundSearch } from 'lucide-react';
import api from '../../utils/api';
import './AdminDashboard.css';

const emptyData = {
  totalRevenue: 0,
  totalBookings: 0,
  activeUsers: 0,
  activeCarers: 0,
  recentBookings: [] as any[],
  monthlyRevenue: [] as number[],
};

const money = (value: number) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const AdminDashboard = () => {
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/dashboard')
      .then(({ data: response }) => setData({
        totalRevenue: response.totalRevenue ?? response.totals?.revenue ?? 0,
        totalBookings: response.totalBookings ?? response.totals?.bookings ?? 0,
        activeUsers: response.activeUsers ?? response.totals?.users ?? 0,
        activeCarers: response.activeCarers ?? response.totals?.carers ?? 0,
        recentBookings: response.recentBookings ?? [],
        monthlyRevenue: response.monthlyRevenue ?? response.monthly?.map((item: any) => Number(item.revenue || 0)) ?? [],
      }))
      .catch((error) => console.error('Cannot load admin dashboard:', error))
      .finally(() => setLoading(false));
  }, []);

  const max = Math.max(...data.monthlyRevenue, 1);

  return (
    <div className="admin-dashboard-page">
      <header className="dashboard-heading"><div><h1>Tổng quan hệ thống</h1><p>Dữ liệu vận hành được tổng hợp trực tiếp từ booking, người dùng và chuyên gia.</p></div></header>
      <section className="dashboard-metrics">
        <Metric icon={DollarSign} label="Tổng doanh thu" value={money(data.totalRevenue)} />
        <Metric icon={CalendarDays} label="Tổng booking" value={data.totalBookings.toLocaleString('vi-VN')} accent="secondary" />
        <Metric icon={UserRoundSearch} label="Chuyên gia" value={data.activeCarers.toLocaleString('vi-VN')} accent="tertiary" />
        <Metric icon={TrendingUp} label="Người dùng" value={data.activeUsers.toLocaleString('vi-VN')} />
      </section>

      <section className="dashboard-visuals">
        <article className="dashboard-panel revenue-panel">
          <header><h2>Doanh thu theo tháng</h2></header>
          {data.monthlyRevenue.length > 0 ? <>
            <div className="dashboard-bars">{data.monthlyRevenue.map((value, index) => <i key={index} style={{ height: `${Math.max(18, value / max * 250)}px` }} title={money(value)} />)}</div>
            <div className="dashboard-months">{data.monthlyRevenue.map((_, index) => <span key={index}>T{index + 1}</span>)}</div>
          </> : <p>{loading ? 'Đang tải dữ liệu...' : 'Chưa có dữ liệu doanh thu.'}</p>}
        </article>

        <article className="dashboard-panel recent-panel">
          <h2>Booking gần đây</h2>
          {data.recentBookings.slice(0, 4).map((item: any) => (
            <div className="recent-event" key={item._id}>
              <span />
              <div>
                <strong>{item.service?.title || 'Booking mới'}</strong>
                <p>Booking #{String(item._id || '').slice(-8)}</p>
                <small>{item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : ''}</small>
              </div>
            </div>
          ))}
          {!loading && !data.recentBookings.length && <p>Chưa có booking gần đây.</p>}
        </article>
      </section>
    </div>
  );
};

const Metric = ({ icon: Icon, label, value, accent = 'primary' }: any) => (
  <article className={`dashboard-metric ${accent}`}>
    <div><span className="metric-icon"><Icon /></span></div>
    <small>{label}</small><strong>{value}</strong>
  </article>
);

export default AdminDashboard;
