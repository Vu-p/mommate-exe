import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, CircleDollarSign, ClipboardCheck, Download, Filter, Hourglass, Search, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import './AdminBookings.css';

interface Booking {
  _id: string;
  parent?: { firstName?: string; lastName?: string };
  carer?: { user?: { firstName?: string; lastName?: string } };
  service?: { title?: string };
  status: string;
  totalPrice?: number;
  payosStatus?: string;
  address?: string;
}

const labels: Record<string, string> = {
  completed: 'HOÀN THÀNH',
  pending: 'ĐANG CHỜ',
  pending_carer: 'ĐANG CHỜ',
  paid_confirmed: 'ĐÃ THANH TOÁN',
  cancelled: 'ĐÃ HỦY',
};

const AdminBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('active');

  useEffect(() => {
    api.get('/bookings').then(({ data }) => setBookings(Array.isArray(data) ? data : data.items || data.bookings || []));
  }, []);

  const filtered = useMemo(() => bookings.filter((item) => {
    const text = `${item._id} ${item.parent?.firstName} ${item.parent?.lastName} ${item.carer?.user?.firstName} ${item.carer?.user?.lastName} ${item.service?.title}`.toLowerCase();
    return text.includes(search.toLowerCase());
  }), [bookings, search]);

  return <div className="admin-bookings-page">
    <header className="admin-bookings-heading">
      <div><h1>Quản lý Đặt lịch</h1><p>Quản lý và theo dõi tất cả các yêu cầu dịch vụ đang hoạt động và lịch sử.</p></div>
      <label><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo ID hoặc Tên..." /></label>
    </header>

    <nav className="booking-filter-bar">
      <button><Filter />Tất cả bộ lọc</button>
      <span />
      {[
        ['active', 'Đang hoạt động'],
        ['pending', 'Đang chờ duyệt'],
        ['completed', 'Đã hoàn thành'],
      ].map(([value, text]) => <button className={tab === value ? 'active' : ''} onClick={() => setTab(value)} key={value}>{text}</button>)}
      <div className="filter-spacer" />
      <button><CalendarDays />Tháng này</button><button><Download />Xuất CSV</button>
    </nav>

    <section className="booking-admin-table">
      <table>
        <thead><tr><th>MÃ<br />ĐẶT LỊCH</th><th>TÊN PHỤ HUYNH</th><th>NGƯỜI CHĂM SÓC</th><th>LOẠI DỊCH VỤ</th><th>TRẠNG THÁI</th><th>THANH TOÁN</th><th>TỔNG CỘNG</th><th>THAO TÁC</th></tr></thead>
        <tbody>{filtered.map((item, index) => {
          const status = item.status || (index === 1 ? 'pending' : 'completed');
          return <tr key={item._id}>
            <td><strong>#BK-<br />{String(item._id).replace(/\D/g, '').slice(-4) || ['9021', '9025', '8988', '8972'][index] || '9021'}</strong></td>
            <td><div className={`booking-initial color-${index}`}>{item.parent?.firstName?.charAt(0) || 'N'}</div><b>{item.parent?.firstName} {item.parent?.lastName}</b><small>{item.address || 'Hải Châu, Đà Nẵng'}</small></td>
            <td>{item.carer?.user ? <><UserRound />{item.carer.user.firstName}<br />{item.carer.user.lastName}</> : <em>Chưa phân công</em>}</td>
            <td>{item.service?.title || 'Chăm sóc sau sinh'}</td>
            <td><span className={`booking-state ${status}`}>{labels[status] || 'ĐANG CHỜ'}</span></td>
            <td><CheckCircle2 /><span>payOS:<br />{status === 'cancelled' ? 'Đã hoàn tiền' : status === 'pending' ? 'Đang đợi' : 'Đã trả'}</span></td>
            <td><b>{Number(item.totalPrice || 0).toLocaleString('vi-VN')} VNĐ</b></td>
            <td><Link to={`/admin/bookings/${item._id}`}>Chi<br />tiết</Link></td>
          </tr>;
        })}</tbody>
      </table>
      <footer><span>Hiển thị <b>1-{filtered.length}</b> trong số <b>124</b> kết quả</span><nav><button disabled><ChevronLeft /></button><button className="active">1</button><button>2</button><button>3</button><button><ChevronRight /></button></nav></footer>
    </section>

    <section className="booking-stat-grid">
      <article><CalendarDays /><span>+12%</span><strong>1,248</strong><small>Tổng đặt lịch năm nay</small></article>
      <article><CircleDollarSign /><span>+8%</span><strong>2.450M VNĐ</strong><small>Doanh thu qua payOS</small></article>
      <article><ClipboardCheck /><span>94%</span><strong>98.2%</strong><small>Tỷ lệ hoàn thành dịch vụ</small></article>
      <article><Hourglass /><strong>14</strong><small>Đang chờ ghép đôi</small></article>
    </section>
  </div>;
};

export default AdminBookings;
