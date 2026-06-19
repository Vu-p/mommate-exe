import { useEffect, useState } from 'react';
import { CalendarDays, DollarSign, Search, TrendingDown, TrendingUp, UserRoundSearch } from 'lucide-react';
import api from '../../utils/api';
import './AdminDashboard.css';

type DashboardData = {
  totalRevenue: number;
  totalBookings: number;
  activeUsers: number;
  activeCarers: number;
  recentBookings: any[];
  monthlyRevenue: number[];
};

const emptyData: DashboardData = {
  totalRevenue: 0, totalBookings: 0, activeUsers: 0, activeCarers: 0,
  recentBookings: [], monthlyRevenue: [],
};

const money = (value: number) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const AdminDashboard = () => {
  const [data, setData] = useState(emptyData);

  useEffect(() => {
    api.get('/analytics/dashboard').then(({ data: response }) => setData({
      totalRevenue: response.totalRevenue ?? response.totals?.revenue ?? 0,
      totalBookings: response.totalBookings ?? response.totals?.bookings ?? 0,
      activeUsers: response.activeUsers ?? 0,
      activeCarers: response.activeCarers ?? 0,
      recentBookings: response.recentBookings ?? [],
      monthlyRevenue: response.monthlyRevenue ?? response.monthly?.map((item: any) => item.revenue) ?? [],
    }));
  }, []);

  const chart = data.monthlyRevenue.length ? data.monthlyRevenue : [85, 110, 95, 140, 120, 170, 145, 205, 175, 225, 190, 240];
  const max = Math.max(...chart, 1);
  const events = [
    ['24 Th10, 14:22', 'Giao dịch đặt lịch', 'Đơn hàng #B99218 đã xác nhận', 'Nguyễn Thúy', 'Thành công'],
    ['24 Th10, 14:15', 'Xác minh chuyên gia', 'Đã tải lên bằng cấp chuyên môn', 'Trần Vũ', 'Chờ xét duyệt'],
    ['24 Th10, 13:58', 'Sự kiện bảo mật', '3 lần đăng nhập thất bại đã bị chặn', 'Hệ thống', 'Đã chặn'],
    ['24 Th10, 13:45', 'Đợt thanh toán', 'Đợt #PY_9012 đã phát cho 45 đối tác', 'Quản trị', 'Đang xử lý'],
  ];

  return (
    <div className="admin-dashboard-page">
      <header className="dashboard-heading">
        <div><h1>Tổng quan Hệ thống</h1><p>Giám sát hoạt động nền tảng và các chỉ số sức khỏe hệ thống.</p></div>
        <label className="dashboard-search"><Search /><input placeholder="Tìm kiếm dữ liệu..." /></label>
      </header>

      <section className="dashboard-metrics">
        <Metric icon={DollarSign} label="Tổng doanh thu (VNĐ)" value={money(data.totalRevenue)} trend="+12.5%" />
        <Metric icon={CalendarDays} label="Đơn đặt đang hoạt động" value={data.totalBookings.toLocaleString('vi-VN')} trend="+4.2%" accent="secondary" />
        <Metric icon={UserRoundSearch} label="Tổng người chăm sóc" value={data.activeCarers.toLocaleString('vi-VN')} trend="-2.1%" accent="tertiary" down />
        <Metric icon={TrendingUp} label="Người dùng hoạt động" value={data.activeUsers.toLocaleString('vi-VN')} trend="+18.7%" />
      </section>

      <section className="dashboard-visuals">
        <article className="dashboard-panel revenue-panel">
          <header><h2>Xu hướng doanh thu hàng tháng</h2><span>Theo tháng</span></header>
          <div className="dashboard-bars">
            {chart.map((value, index) => <i key={index} style={{ height: `${Math.max(18, value / max * 250)}px` }} title={money(value * 1_000_000)} />)}
          </div>
          <div className="dashboard-months">{chart.map((_, index) => <span key={index}>T{index + 1}</span>)}</div>
        </article>

        <article className="dashboard-panel recent-panel">
          <h2>Hoạt động gần đây</h2>
          {(data.recentBookings.length ? data.recentBookings : events).slice(0, 4).map((item: any, index) => (
            <div className="recent-event" key={item._id || index}>
              <span />
              <div>
                <strong>{Array.isArray(item) ? item[1] : item.service?.title || 'Đặt lịch mới'}</strong>
                <p>{Array.isArray(item) ? item[2] : `Booking #${String(item._id || '').slice(-8)}`}</p>
                <small>{index * 15 + 2} phút trước</small>
              </div>
            </div>
          ))}
          <button type="button">Xem tất cả nhật ký</button>
        </article>
      </section>

      <section className="dashboard-panel system-events">
        <header><h2>Sự kiện hệ thống mới nhất</h2><select><option>Tất cả sự kiện</option><option>Thành công</option><option>Cảnh báo</option></select></header>
        <div className="events-table"><table><thead><tr><th>Thời gian</th><th>Danh mục</th><th>Chi tiết</th><th>Người thực hiện</th><th>Trạng thái</th></tr></thead>
          <tbody>{events.map((event) => <tr key={event[0]}>{event.map((cell, index) => <td key={cell}>{index === 4 ? <span className="event-status">{cell}</span> : cell}</td>)}</tr>)}</tbody>
        </table></div>
        <footer><span>Hiển thị 1-4 trong số 2.450 kết quả</span><div><button>‹</button><button className="active">1</button><button>2</button><button>3</button><button>›</button></div></footer>
      </section>
    </div>
  );
};

const Metric = ({ icon: Icon, label, value, trend, accent = 'primary', down = false }: any) => (
  <article className={`dashboard-metric ${accent}`}>
    <div><span className="metric-icon"><Icon /></span><b className={down ? 'down' : ''}>{trend}{down ? <TrendingDown /> : <TrendingUp />}</b></div>
    <small>{label}</small><strong>{value}</strong><i><span /></i>
  </article>
);

export default AdminDashboard;
