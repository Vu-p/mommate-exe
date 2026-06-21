import { AlertCircle, BarChart3, Building2, CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, CircleDollarSign, Clock3, Download, Eye, Filter, Mail, MapPin, MoreVertical, Pencil, Phone, Plus, ReceiptText, Search, ShieldAlert, Smile, Star, TrendingUp, UserRoundX, WalletCards, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import '../OperationalPages.css';
import './AdminOperations.css';
import { downloadBookingInvoice } from '../../utils/invoice';

type Pagination = { page: number; limit: number; total: number; totalPages: number };
const emptyPagination: Pagination = { page: 1, limit: 20, total: 0, totalPages: 1 };
const money = (value: unknown) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const PageNav = ({ pagination, onChange }: { pagination: Pagination; onChange: (page: number) => void }) => (
  <div className="admin-page-nav">
    <button disabled={pagination.page <= 1} onClick={() => onChange(pagination.page - 1)}>‹</button>
    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, index) => index + Math.max(1, pagination.page - 2))
      .filter((page) => page <= pagination.totalPages)
      .map((page) => <button className={page === pagination.page ? 'active' : ''} key={page} onClick={() => onChange(page)}>{page}</button>)}
    <button disabled={pagination.page >= pagination.totalPages} onClick={() => onChange(pagination.page + 1)}>›</button>
  </div>
);

export const AdminUsers = () => {
  const [items, setItems] = useState<any[]>([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');

  const load = () => api.get('/users', { params: { page, limit: 20, search: search || undefined, role: role || undefined } })
    .then(({ data }) => { setItems(data.items); setPagination(data.pagination); });
  useEffect(() => { void load(); }, [page, search, role]);

  const toggle = async (user: any) => {
    await api.put(`/users/${user._id}`, { accountStatus: user.accountStatus === 'suspended' ? 'active' : 'suspended', suspendedReason: 'Cập nhật bởi quản trị viên' });
    load();
  };

  return <AdminListShell eyebrow="QUẢN TRỊ TÀI KHOẢN" title="Quản lý Người dùng Admin" subtitle="Quản lý tài khoản phụ huynh và quản trị viên hệ thống trong hệ sinh thái MomMate." action={<button className="admin-primary-action"><Plus />Thêm người dùng mới</button>}>
    <div className="admin-filter-row"><SearchBox value={search} onChange={setSearch} placeholder="Tìm kiếm người dùng theo tên, email hoặc ID..." /><select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}><option value="">Tất cả vai trò</option><option value="parent">Phụ huynh</option><option value="carer">Chuyên gia</option><option value="admin">Admin</option></select><select defaultValue=""><option value="">Tất cả trạng thái</option><option>Hoạt động</option><option>Tạm khóa</option></select><button className="admin-advanced-filter"><Filter size={18} />Bộ lọc nâng cao</button></div>
    <AdminTable headers={['Thông tin người dùng', 'Liên hệ & địa chỉ', 'Vai trò', 'Ngày tham gia', 'Trạng thái', 'Thao tác']}>
      {items.map((user) => <tr key={user._id}><td><strong>{user.firstName} {user.lastName}</strong><small>ID: {String(user._id).toUpperCase()}</small></td><td><strong>{user.email}</strong><small>{user.phoneNumber || 'Chưa cập nhật'} · Đà Nẵng</small></td><td>{user.role === 'admin' ? 'ADMIN' : 'PHỤ HUYNH'}</td><td>12/10/2023</td><td><Status value={user.accountStatus || 'active'} /></td><td><button className="admin-inline-action" onClick={() => toggle(user)}>{user.accountStatus === 'suspended' ? 'Mở khóa' : 'Tạm khóa'}</button></td></tr>)}
    </AdminTable><PageNav pagination={pagination} onChange={setPage} />
    <div className="admin-user-metrics"><Metric label="Tổng phụ huynh đang hoạt động" value="1,248" /><Metric label="Quản trị viên hệ thống" value="12" /><article><UserRoundX /><small>Tài khoản tạm khóa/vô hiệu hóa</small><strong>45</strong></article></div>
  </AdminListShell>;
};

const LegacyAdminReviews = () => {
  const [items, setItems] = useState<any[]>([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const load = () => api.get('/reviews', { params: { admin: true, page, limit: 20, status: status || undefined } }).then(({ data }) => { setItems(data.items); setPagination(data.pagination); });
  useEffect(() => { void load(); }, [page, status]);
  const moderate = async (id: string, moderationStatus: string) => { await api.patch(`/reviews/${id}/moderation`, { moderationStatus }); load(); };
  return <AdminListShell icon={Star} eyebrow="CHẤT LƯỢNG DỊCH VỤ" title="Quản lý đánh giá" subtitle="Kiểm duyệt phản hồi từ gia đình">
    <div className="admin-filter-row"><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Tất cả trạng thái</option><option value="published">Đang hiển thị</option><option value="hidden">Đã ẩn</option></select></div>
    <div className="moderation-grid">{items.map((review) => <article className="admin-operation-card" key={review._id}><div className="review-score"><Star fill="currentColor" />{review.score}/5</div><h3>{review.title}</h3><p>{review.content}</p><small>{review.parent?.firstName} {review.parent?.lastName}</small><div><Status value={review.moderationStatus || 'published'} /><button onClick={() => moderate(review._id, review.moderationStatus === 'hidden' ? 'published' : 'hidden')}>{review.moderationStatus === 'hidden' ? 'Hiện lại' : 'Ẩn'}</button></div></article>)}</div>
    <PageNav pagination={pagination} onChange={setPage} />
  </AdminListShell>;
};

const LegacyAdminIncidents = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const load = () => api.get('/incidents', { params: { page, limit: 20, status: status || undefined } }).then(({ data }) => { setItems(data.items); setPagination(data.pagination); });
  useEffect(() => { void load(); }, [page, status]);
  const update = async (item: any, next: string) => {
    const resolution = ['resolved', 'closed'].includes(next)
      ? prompt('Nhập kết quả xử lý sự cố') || ''
      : undefined;
    if (['resolved', 'closed'].includes(next) && !resolution?.trim()) return;
    const internalNote = prompt('Ghi chú nội bộ cho lần cập nhật này') || '';
    await api.patch(`/incidents/${item._id}`, { status: next, resolution, internalNote });
    load();
  };
  const assignSelf = async (item: any) => {
    await api.patch(`/incidents/${item._id}`, { assignedTo: 'self', internalNote: `Admin ${user?.firstName || ''} nhận xử lý` });
    load();
  };
  const openIncidentChat = async (item: any) => {
    const { data } = await api.post(`/messages/incidents/${item._id}/conversation`);
    navigate(`/admin/messages/${data._id}`);
  };
  return <AdminListShell icon={ShieldAlert} eyebrow="AN TOÀN VẬN HÀNH" title="Quản lý sự cố" subtitle={`${pagination.total} báo cáo`}>
    <div className="admin-filter-row"><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Tất cả</option><option value="open">Mới</option><option value="investigating">Đang xử lý</option><option value="resolved">Đã giải quyết</option></select></div>
    <AdminTable headers={['Sự cố', 'Booking', 'Mức độ', 'Người báo cáo', 'Phụ trách', 'Trạng thái', 'Thao tác']}>{items.map((item) => <tr key={item._id}><td><strong>{item.title}</strong><small>{item.category}</small></td><td>#{String(item.booking?._id || '').slice(-8)}</td><td><Status value={item.severity} /></td><td>{item.reportedBy?.firstName} {item.reportedBy?.lastName}</td><td>{item.assignedTo ? `${item.assignedTo.firstName} ${item.assignedTo.lastName}` : <button className="admin-inline-action" onClick={() => assignSelf(item)}>Nhận xử lý</button>}</td><td><Status value={item.status} /></td><td><div className="workflow-actions"><button onClick={() => openIncidentChat(item)}>Chat</button><select value={item.status} onChange={(e) => update(item, e.target.value)}><option value="open">Mới</option><option value="investigating">Đang xử lý</option><option value="resolved">Đã giải quyết</option><option value="closed">Đóng</option></select></div></td></tr>)}</AdminTable>
    <PageNav pagination={pagination} onChange={setPage} />
  </AdminListShell>;
};

const LegacyAdminRevenue = () => {
  const [data, setData] = useState<any>(null);
  useEffect(() => { api.get('/analytics/dashboard').then(({ data }) => setData(data)); }, []);
  const maxRevenue = Math.max(1, ...(data?.monthly || []).map((item: any) => item.revenue));
  return <AdminListShell icon={BarChart3} eyebrow="BÁO CÁO VẬN HÀNH" title="Doanh thu chuyên sâu" subtitle="Tổng hợp trực tiếp từ booking đã thanh toán">
    <div className="analytics-stat-grid"><Metric label="Tổng doanh thu" value={money(data?.totals?.revenue)} /><Metric label="Phí nền tảng" value={money(data?.totals?.platformFees)} /><Metric label="Chi trả chuyên gia" value={money(data?.totals?.carerPayouts)} /><Metric label="Booking" value={data?.totals?.bookings || 0} /></div>
    <section className="admin-operation-card revenue-chart"><h2>Doanh thu theo tháng</h2><div>{(data?.monthly || []).map((item: any) => <span key={item.month}><i style={{ height: `${Math.max(8, item.revenue / maxRevenue * 220)}px` }} /><small>{item.month}</small><b>{money(item.revenue)}</b></span>)}</div></section>
  </AdminListShell>;
};

const LegacyAdminReconciliation = () => {
  const [data, setData] = useState<any>({ items: [], summary: {} });
  const [status, setStatus] = useState('');
  const load = () => api.get('/analytics/reconciliation', { params: { status: status || undefined } }).then(({ data }) => setData(data));
  useEffect(() => { void load(); }, [status]);
  const pay = async (id: string) => { const reference = prompt('Mã giao dịch đối soát') || ''; if (!reference.trim()) return; await api.patch(`/bookings/${id}/payout`, { reference }); load(); };
  const payBatch = async () => {
    const bookingIds = data.items.filter((item: any) => item.carerPayoutStatus === 'ready').map((item: any) => item._id);
    if (!bookingIds.length) return;
    const reference = prompt('Mã giao dịch cho lô đối soát') || '';
    if (!reference.trim()) return;
    await api.post('/admin/payout-batches', { bookingIds, reference });
    load();
  };
  const exportCsv = async () => {
    const response = await api.get('/analytics/reconciliation/export.csv', { params: { status: status || undefined }, responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mommate-reconciliation-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const exportPdf = async () => {
    const response = await api.get('/analytics/reconciliation/export.pdf', { params: { status: status || undefined }, responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mommate-reconciliation-${new Date().toISOString().slice(0, 10)}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const readyCount = data.items.filter((item: any) => item.carerPayoutStatus === 'ready').length;
  return <AdminListShell icon={WalletCards} eyebrow="TÀI CHÍNH" title="Đối soát & thanh toán" subtitle="Theo dõi khoản phải trả cho chuyên gia" action={<div className="admin-filter-row"><button className="admin-advanced-filter" onClick={exportCsv}><Download size={18} />CSV</button><button className="admin-advanced-filter" onClick={exportPdf}><Download size={18} />PDF</button><button className="admin-primary-action" disabled={!readyCount} onClick={payBatch}>Chi trả lô ({readyCount})</button></div>}>
    <div className="analytics-stat-grid"><Metric label="Tổng giá trị" value={money(data.summary.total)} /><Metric label="Phí nền tảng" value={money(data.summary.platformFees)} /><Metric label="Phải trả" value={money(data.summary.payable)} /><Metric label="Đã trả" value={money(data.summary.paid)} /></div>
    <div className="admin-filter-row"><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Tất cả</option><option value="ready">Chờ chi trả</option><option value="paid">Đã chi trả</option></select></div>
    <AdminTable headers={['Booking', 'Chuyên gia', 'Dịch vụ', 'Giá trị', 'Phải trả', 'Trạng thái', 'Thao tác']}>{data.items.map((item: any) => <tr key={item._id}><td>#{String(item._id).slice(-8)}</td><td>{item.carer?.user?.firstName} {item.carer?.user?.lastName}</td><td>{item.service?.title}</td><td>{money(item.totalPrice)}</td><td>{money(item.carerPayoutAmount)}</td><td><Status value={item.carerPayoutStatus} /></td><td>{item.carerPayoutStatus !== 'paid' && <button className="admin-inline-action" onClick={() => pay(item._id)}>Đánh dấu đã trả</button>}</td></tr>)}</AdminTable>
  </AdminListShell>;
};
void LegacyAdminReviews;
void LegacyAdminIncidents;
void LegacyAdminRevenue;
void LegacyAdminReconciliation;

const OperationsHeader = ({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) =>
  <header className="ops-page-heading"><div><h1>{title}</h1><p>{subtitle}</p></div>{action}</header>;

const OpsMetric = ({ icon: Icon, label, value, note, tone = 'green' }: any) =>
  <article className={`ops-metric ${tone}`}><div><Icon /></div><small>{label}</small><strong>{value}</strong>{note && <span>{note}</span>}</article>;

const StitchAdminRevenue = () => {
  const [data, setData] = useState<any>({ totals: {}, monthly: [], serviceBreakdown: [], districtBreakdown: [], topCarers: [] });
  useEffect(() => { api.get('/analytics/dashboard').then(({ data }) => setData(data)); }, []);
  const maxRevenue = Math.max(1, ...data.monthly.map((item: any) => Number(item.revenue || 0)));
  const revenueBars = data.monthly.length ? data.monthly.map((item: any) => Math.max(8, Number(item.revenue || 0) / maxRevenue * 86)) : [8, 8, 8, 8, 8, 8];
  const downloadReport = async (format: 'csv' | 'pdf') => {
    const response = await api.get(`/analytics/reconciliation/export.${format}`, { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mommate-report.${format}`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const services = data.serviceBreakdown.length ? data.serviceBreakdown : [{ label: 'Chưa có dữ liệu', percent: 0 }];
  const districts = data.districtBreakdown.length ? data.districtBreakdown : [{ label: 'Chưa có dữ liệu', revenue: 0 }];
  const maxDistrict = Math.max(1, ...districts.map((item: any) => Number(item.revenue || 0)));
  const topCarers = data.topCarers.length ? data.topCarers : [{ name: 'Chưa có dữ liệu', revenue: 0, bookings: 0, rating: 0 }];
  return <div className="admin-ops-page revenue-page">
    <OperationsHeader title="Báo cáo & Phân tích" subtitle="Theo dõi doanh thu thời gian thực và thông tin hiệu suất." action={<div className="ops-actions"><button><CalendarDays />30 ngày qua</button><button className="primary" onClick={() => downloadReport('pdf')}><Download />Xuất PDF</button><button onClick={() => downloadReport('csv')}>CSV</button></div>} />
    <section className="ops-metrics four"><OpsMetric icon={CircleDollarSign} label="Tổng doanh thu gộp" value={Number(data.totals.revenue || 0).toLocaleString('vi-VN')} note="VNĐ" /><OpsMetric icon={Building2} label="Hoa hồng nền tảng" value={Number(data.totals.platformFees || 0).toLocaleString('vi-VN')} note="VNĐ" tone="orange" /><OpsMetric icon={BarChart3} label="Giá trị đơn hàng TB (AOV)" value={Number(data.totals.bookings ? data.totals.revenue / data.totals.bookings : 0).toLocaleString('vi-VN')} note="VNĐ" tone="pink" /><OpsMetric icon={TrendingUp} label="Tổng booking" value={data.totals.bookings || 0} note="Đã ghi nhận" /></section>
    <section className="ops-panel revenue-trend"><header><div><h2>Xu hướng tăng trưởng doanh thu</h2><p>Doanh thu gộp vs. Phí nền tảng (Hàng tuần)</p></div><span>● Doanh thu gộp　 <i>●</i> Phí nền tảng</span></header><div className="trend-grid">{revenueBars.map((height, index) => <div key={index}><span className="gross" style={{ height: `${height}%` }} /><span className="fee" style={{ height: `${height * .28}%` }} /><small>T{index + 1}</small></div>)}</div></section>
    <section className="revenue-bottom-grid">
      <article className="ops-panel category-card"><h2>Theo danh mục dịch vụ</h2><div className="donut"><span>CAO NHẤT<strong>{services[0].label}</strong></span></div>{services.slice(0, 3).map((item: any) => <p key={item.label}><i />{item.label} <b>{item.percent}%</b></p>)}</article>
      <article className="ops-panel district-card"><h2>Doanh thu theo quận</h2>{districts.slice(0, 4).map((item: any) => <div key={item.label}><span>{item.label}<b>{Number(item.revenue || 0).toLocaleString('vi-VN')} VNĐ</b></span><i><em style={{ width: `${Number(item.revenue || 0) / maxDistrict * 90}%` }} /></i></div>)}<div className="map-placeholder">Xem bản đồ nhiệt</div></article>
      <article className="ops-panel top-carers"><h2>Người chăm sóc tiêu biểu</h2>{topCarers.slice(0, 3).map((item: any, index: number) => <div key={`${item.name}-${index}`}><i>{index + 1}</i><span><strong>{item.name}</strong><small>{item.bookings} lượt đặt</small></span><b>{Number(item.revenue || 0).toLocaleString('vi-VN')} VNĐ<small>ĐÁNH GIÁ {item.rating}%</small></b></div>)}</article>
    </section>
  </div>;
};

const StitchAdminReviews = () => {
  const [items, setItems] = useState<any[]>([]);
  const [pagination, setPagination] = useState(emptyPagination);
  useEffect(() => { api.get('/reviews', { params: { admin: true, page: 1, limit: 10 } }).then(({ data }) => { setItems(data.items || []); setPagination(data.pagination || emptyPagination); }); }, []);
  const average = items.length ? items.reduce((sum, item) => sum + Number(item.score || 0), 0) / items.length : 0;
  const pending = items.filter((item) => item.moderationStatus === 'pending').length;
  const moderate = async (id: string, moderationStatus: string) => {
    await api.patch(`/reviews/${id}/moderation`, { moderationStatus });
    setItems((current) => current.map((item) => item._id === id ? { ...item, moderationStatus } : item));
  };
  return <div className="admin-ops-page reviews-page">
    <OperationsHeader title="Quản lý Đánh giá" subtitle="Theo dõi và kiểm duyệt phản hồi từ khách hàng sau khi sử dụng dịch vụ." action={<button className="outline-action"><Download />Xuất báo cáo</button>} />
    <section className="review-metrics"><article><small>Tổng đánh giá</small><strong>{pagination.total}</strong><span>Dữ liệu thời gian thực</span></article><article><small>Điểm trung bình</small><strong>{average.toFixed(1)} <i>★★★★★</i></strong><span>Từ booking hoàn tất</span></article><article><small>Chờ kiểm duyệt</small><strong>{pending}</strong><span className="pink-pill">Yêu cầu phản hồi</span></article><article><small>Tỷ lệ hài lòng</small><strong>{Math.round(average / 5 * 100)}%</strong><i className="satisfaction"><em /></i></article></section>
    <section className="review-filters"><label><Search /><input placeholder="Tìm kiếm mã booking, tên khách" /></label><button>Tất cả số sao⌄</button><button>Tất cả chuyên gia⌄</button><button>Trạng thái: Tất cả⌄</button><a><Filter /> Xóa bộ lọc</a></section>
    <section className="review-table"><table><thead><tr><th>Khách hàng / Booking</th><th>Chuyên gia</th><th>Đánh giá & Nội dung</th><th>Trạng thái</th><th>Hành động</th></tr></thead><tbody>{items.map((item,index) => <tr key={item._id}><td><strong>{item.parent?.firstName} {item.parent?.lastName}</strong><small>#{String(item.booking?._id || item.booking).slice(-8)}</small></td><td><i className="mini-avatar">{index+1}</i>{item.carer?.user?.firstName} {item.carer?.user?.lastName}</td><td><b className="stars">{'★'.repeat(Number(item.score))}{'☆'.repeat(5-Number(item.score))}</b><p>"{item.content}"</p><small>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : ''}</small></td><td><span className={item.moderationStatus === 'pending' ? 'pending' : ''}>{item.moderationStatus}</span></td><td>{item.moderationStatus === 'pending' && <><button onClick={() => moderate(item._id, 'published')}>Duyệt</button><XCircle onClick={() => moderate(item._id, 'hidden')} /></>}</td></tr>)}</tbody></table><footer>Hiển thị {items.length} trên {pagination.total} đánh giá <nav><button disabled><ChevronLeft /></button><button className="active">1</button><button disabled><ChevronRight /></button></nav></footer></section>
  </div>;
};

const StitchAdminReconciliation = () => {
  const [data, setData] = useState<any>({ items: [], summary: {} });
  const load = () => api.get('/analytics/reconciliation').then(({ data }) => setData(data));
  useEffect(() => { void load(); }, []);
  const pay = async (item: any) => {
    const reference = prompt('Mã giao dịch đối soát') || '';
    if (!reference.trim()) return;
    await api.patch(`/bookings/${item._id}/payout`, { reference });
    load();
  };
  return <div className="admin-ops-page reconciliation-page">
    <OperationsHeader title="Đối soát & Thanh toán" subtitle="" action={<nav className="recon-tabs"><b>Tổng quan</b><span>Lịch sử</span><span>Hồ sơ thuế</span></nav>} />
    <section className="recon-metrics"><OpsMetric icon={TrendingUp} label="Thanh toán chờ" value={`${Number(data.summary.payable || 0).toLocaleString('vi-VN')} VNĐ`} note="Booking đã hoàn thành" /><OpsMetric icon={BarChart3} label="Phí nền tảng (Ròng)" value={`${Number(data.summary.platformFees || 0).toLocaleString('vi-VN')} VNĐ`} note="Tính từ giá snapshot" tone="orange" /><OpsMetric icon={CheckCircle2} label="Đã quyết toán" value={`${Number(data.summary.paid || 0).toLocaleString('vi-VN')} VNĐ`} note="Dữ liệu đối soát thực" /><article className="next-batch"><small>Đợt xử lý tiếp theo</small><strong>{data.items.filter((item: any) => item.carerPayoutStatus === 'ready').length} khoản chờ</strong><button onClick={() => data.items.filter((item: any) => item.carerPayoutStatus === 'ready').forEach(pay)}>Xử lý sớm</button></article></section>
    <section className="ops-panel payment-queue"><header><div><h2>Hàng đợi thanh toán</h2><p>Các khoản chuyển tiền đang chờ cho các dịch vụ chăm sóc đã hoàn thành.</p></div><label><Search /><input placeholder="Tìm người chăm sóc..." /></label><button><Filter />Bộ lọc</button></header><table><thead><tr><th>Tên người chăm sóc</th><th>Tổng thu nhập</th><th>Phí nền tảng</th><th>Thực nhận</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{data.items.map((item: any,index: number) => <tr key={item._id}><td><i>{index+1}</i><strong>{item.carer?.user?.firstName} {item.carer?.user?.lastName}</strong><small>{item.service?.title}</small></td><td>{Number(item.totalPrice || 0).toLocaleString('vi-VN')}<br />VNĐ</td><td className="fee-red">-{Number(item.platformFeeAmount || 0).toLocaleString('vi-VN')}<br />VNĐ</td><td><b>{Number(item.carerPayoutAmount || 0).toLocaleString('vi-VN')}<br />VNĐ</b></td><td><span className={`pay-status p${index}`}>{item.carerPayoutStatus}</span></td><td>{item.carerPayoutStatus === 'ready' ? <button onClick={() => pay(item)}>Đã thanh toán</button> : <ReceiptText />}</td></tr>)}</tbody></table><footer>Hiển thị {data.items.length} khoản thanh toán <span>‹　 Trang 1　 ›</span></footer></section>
    <section className="recon-bottom"><article className="ops-panel volume-chart"><header><h2>Lịch sử khối lượng thanh toán</h2><button>30 ngày qua⌄</button></header><div>{[45,62,38,78,55,88,70].map((height,index) => <span key={index}><i style={{height:`${height}%`}}><em /></i><small>{index===6?'CN':`T${index+2}`}</small></span>)}</div></article><article className="ops-panel recent-activity"><h2>Hoạt động gần đây</h2><p><CheckCircle2 /><span><b>Lô hàng #A429 đã xử lý</b><small>42 giao dịch đã quyết toán thành công.</small></span></p><p><AlertCircle /><span><b>Thanh toán bị gắn cờ</b><small>Sai lệch tài khoản cho Nguyễn Thị Elena.</small></span></p><p><Download /><span><b>Đã xuất báo cáo thuế</b><small>Tệp CSV tóm tắt thu nhập Q3 đã được tạo.</small></span></p><button>Xem tất cả nhật ký</button></article></section>
  </div>;
};

const StitchAdminIncidents = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const load = () => api.get('/incidents', { params: { page: 1, limit: 20, status: status || undefined, search: search || undefined } }).then(({ data }) => setItems(data.items || []));
  useEffect(() => { void load(); }, [status, search]);
  const openChat = async (item: any) => {
    const { data } = await api.post(`/messages/incidents/${item._id}/conversation`);
    navigate(`/admin/messages/${data._id}`);
  };
  const updateStatus = async (item: any) => {
    const resolution = prompt('Kết quả hoặc ghi chú xử lý') || '';
    if (!resolution.trim()) return;
    await api.patch(`/incidents/${item._id}`, { status: item.status === 'open' ? 'investigating' : 'resolved', resolution, internalNote: resolution });
    load();
  };
  const openCount = items.filter((item) => item.status === 'open').length;
  const resolvedCount = items.filter((item) => ['resolved', 'closed'].includes(item.status)).length;
  return <div className="admin-ops-page incidents-page">
    <OperationsHeader title="Quản lý Sự cố & Khiếu nại" subtitle="" action={<div className="incident-actions"><label><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm ID, Người chăm sóc..." /></label><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Tất cả trạng thái</option><option value="open">Mới</option><option value="investigating">Đang xử lý</option><option value="resolved">Đã giải quyết</option></select><button><Filter />Lọc nâng cao</button><button className="primary"><Plus />Tạo sự cố mới</button></div>} />
    <section className="incident-metrics"><article className="new"><small>Sự cố mới</small><strong>{openCount}</strong><span>Cần phân loại</span><AlertCircle /></article><article><small>Đang xử lý</small><strong>{items.filter((item) => item.status === 'investigating').length}</strong><span>Đã có người phụ trách</span><Clock3 /></article><article><small>Đã giải quyết</small><strong>{resolvedCount}</strong><span>Từ dữ liệu thực</span><Smile /></article></section>
    <section className="incident-table"><table><thead><tr><th>Mã sự cố</th><th>Loại</th><th>Mã đặt lịch</th><th>Người báo cáo</th><th>Khu vực<br />(Đà Nẵng)</th><th>Mức độ</th><th>Trạng thái</th><th>Phụ trách</th><th>Hành động</th></tr></thead><tbody>{items.map((item,index) => <tr key={item._id}><td><strong>#INC-{String(item._id).slice(-4).toUpperCase()}</strong></td><td><span className={`incident-pill i${index}-1`}>{item.category}</span></td><td><strong>#BK-{String(item.booking?._id || item.booking).slice(-4).toUpperCase()}</strong></td><td>{item.reportedBy?.firstName} {item.reportedBy?.lastName}</td><td>{item.booking?.district || 'Đà Nẵng'}</td><td><span className={`incident-pill i${index}-5`}>{item.severity}</span></td><td><span className={`incident-pill i${index}-6`}>{item.status}</span></td><td>{item.assignedTo ? `${item.assignedTo.firstName} ${item.assignedTo.lastName}` : 'Chưa phân công'}</td><td><button aria-label="Chat sự cố" onClick={() => openChat(item)}><Eye /></button><button aria-label="Cập nhật sự cố" onClick={() => updateStatus(item)}><MoreVertical /></button></td></tr>)}</tbody></table></section>
  </div>;
};
void StitchAdminRevenue;
void StitchAdminReviews;
void StitchAdminReconciliation;
void StitchAdminIncidents;

export {
  StitchAdminRevenue as AdminRevenue,
  StitchAdminReviews as AdminReviews,
  StitchAdminReconciliation as AdminReconciliation,
  StitchAdminIncidents as AdminIncidents,
};

const LegacyAdminBookingDetail = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState<any>(null);
  useEffect(() => { api.get(`/bookings/${id}`).then(({ data }) => setBooking(data)); }, [id]);
  if (!booking) return <div className="admin-page-content">Đang tải booking...</div>;
  return <AdminListShell icon={Eye} eyebrow="CHI TIẾT ĐẶT LỊCH" title={`Booking #${String(booking._id).slice(-8).toUpperCase()}`} subtitle={booking.service?.title}>
    <div className="admin-detail-grid"><section className="admin-operation-card"><h2>Thông tin chăm sóc</h2><Detail label="Khách hàng" value={`${booking.parent?.firstName || ''} ${booking.parent?.lastName || ''}`} /><Detail label="Chuyên gia" value={`${booking.carer?.user?.firstName || ''} ${booking.carer?.user?.lastName || ''}`} /><Detail label="Lịch hẹn" value={new Date(booking.scheduledAt).toLocaleString('vi-VN')} /><Detail label="Địa chỉ" value={booking.fullAddress || booking.address} /><Detail label="Ghi chú y tế" value={booking.medicalNotes || 'Không có'} /></section><section className="admin-operation-card"><h2>Thanh toán & trạng thái</h2><Detail label="Trạng thái" value={booking.status} /><Detail label="Tổng tiền" value={money(booking.totalPrice)} /><Detail label="Phí nền tảng" value={money(booking.platformFeeAmount)} /><Detail label="Chi trả carer" value={money(booking.carerPayoutAmount)} /><Detail label="payOS" value={booking.payosStatus || 'Chưa tạo'} /></section></div>
  </AdminListShell>;
};
void LegacyAdminBookingDetail;

export const AdminBookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any>(null);
  const loadBooking = () => api.get(`/bookings/${id}`).then(({ data }) => setBooking(data));
  useEffect(() => { void loadBooking(); }, [id]);
  if (!booking) return <div className="admin-page-content">Đang tải booking...</div>;
  const parentName = `${booking.parent?.firstName || 'Lê Thùy'} ${booking.parent?.lastName || 'Dương'}`;
  const carerName = `${booking.carer?.user?.firstName || 'Nguyễn Thị'} ${booking.carer?.user?.lastName || 'Minh Anh'}`;
  const total = Number(booking.totalPrice || 36000000);
  const fee = Number(booking.platformFeeAmount || total * .15);
  const payout = Number(booking.carerPayoutAmount || total - fee);
  const updateStatus = async (forcedStatus?: string) => {
    const status = forcedStatus || prompt('Trạng thái mới') || '';
    if (!status.trim()) return;
    const reason = prompt('Lý do cập nhật/override trạng thái') || '';
    if (!reason.trim()) return;
    await api.patch(`/bookings/${booking._id}/status`, { status: status.trim(), override: true, reason: reason.trim() });
    await loadBooking();
  };
  const openConversation = async () => {
    const { data } = await api.post(`/messages/bookings/${booking._id}/conversation`);
    navigate(`/admin/messages/${data._id}`);
  };
  return <div className="admin-page-content admin-booking-detail-page">
    <header className="booking-detail-heading">
      <div><div className="booking-title-line"><h1>Đơn đặt chỗ #BK-9021</h1><span>ĐÃ HOÀN THÀNH</span></div><p>Ngày tạo: 12 Th10, 2024 • Quản lý bởi Hệ thống Admin</p></div>
      <div className="booking-detail-actions"><button onClick={() => updateStatus()}><Pencil />Cập nhật trạng thái</button><button className="danger" onClick={() => updateStatus('cancelled')}><XCircle />Hủy/Hoàn tiền</button><button className="message" onClick={openConversation}><Mail />Nhắn tin các bên</button></div>
    </header>
    <section className="booking-progress-card">
      {['Yêu cầu', 'Đã chấp nhận', 'Đã thanh toán', 'Đang thực hiện', 'Đã hoàn thành'].map((label, index) =>
        <div key={label}><i className={index === 4 ? 'final' : ''}>{index === 4 ? <Star /> : <Check />}</i><strong>{label}</strong></div>)}
    </section>
    <div className="booking-detail-layout">
      <main>
        <div className="booking-people-grid">
          <section className="booking-detail-card person-card"><header><h2>Thông tin phụ huynh</h2><a>Hồ sơ ↗</a></header><div className="person-content"><div className="person-avatar">LD</div><div><h3>{parentName}</h3><p><MapPin />{booking.fullAddress || booking.address || '123 Bạch Đằng, Hải Châu, Đà Nẵng'}</p><p><Phone />{booking.parent?.phoneNumber || '+84 90 1234 567'}</p></div></div></section>
          <section className="booking-detail-card person-card"><header><h2>Thông tin chăm sóc</h2><a>Hồ sơ đầy đủ ↗</a></header><div className="person-content"><div className="person-avatar carer-avatar">MA</div><div><h3>{carerName}</h3><p><Building2 />BV Phụ sản - Nhi Đà Nẵng</p><a className="person-message">Nhắn tin cho chuyên gia</a></div></div></section>
        </div>
        <section className="booking-detail-card service-schedule-card"><h2>Dịch vụ & Lịch trình</h2><div className="service-facts"><div><small>TÊN GÓI DỊCH VỤ</small><strong>{booking.service?.title || 'Hỗ trợ sau sinh'}</strong></div><div><small>THỜI GIAN</small><strong>14 Ngày (15 Th10 - 29 Th10)</strong></div><div><small>LỊCH TRÌNH HÀNG NGÀY</small><strong>08:00 - 17:00 (9 tiếng)</strong></div></div><div className="care-note"><small>YÊU CẦU CHĂM SÓC / GHI CHÚ</small><p>{booking.medicalNotes || 'Phụ huynh cần hỗ trợ kỹ thuật tắm trẻ sơ sinh và tư vấn kích sữa. Ưu tiên hướng dẫn thói quen ngủ đêm cho trẻ. Lưu ý: Gia đình có nuôi một chú chó nhỏ, rất thân thiện.'}</p></div></section>
        <section className="booking-detail-card activity-card"><h2>Lịch sử hoạt động</h2>{[
          ['Đơn đặt chỗ được tạo bởi Phụ huynh', '12 Th10, 2024 • 10:24 AM'],
          [`Điều dưỡng ${carerName} đã chấp nhận yêu cầu`, '12 Th10, 2024 • 11:45 AM'],
          ['Thanh toán được xác nhận qua payOS (Mã: #POS-99210)', '12 Th10, 2024 • 01:15 PM'],
          ['Bắt đầu dịch vụ: Check-in Ngày 1', '15 Th10, 2024 • 07:58 AM'],
          ['Điều dưỡng đã check-out & Hoàn thành dịch vụ', '29 Th10, 2024 • 05:05 PM'],
        ].map(([title, time], index) => <div className="activity-row" key={title}><i>{index === 4 ? <Check /> : null}</i><p><strong>{title}</strong><small>{time}</small></p></div>)}</section>
      </main>
      <aside className="booking-finance-card"><h2>Tổng kết tài chính</h2><Detail label="Tổng cộng" value={money(total)} /><Detail label="Phí nền tảng (15%)" value={money(fee)} /><div className="net-income"><span>Thu nhập ròng</span><strong>{money(payout)}</strong></div><div className="payos-card"><header><strong>Tích hợp payOS</strong><span>{booking.payosStatus || booking.status}</span></header><p>Mã giao dịch: <b>{booking.payosPaymentLinkId || booking.payosOrderCode || 'Chưa có'}</b></p><p>Trạng thái: <b>{booking.payosStatus || 'Chưa thanh toán'}</b></p></div><button className="invoice-button" onClick={() => downloadBookingInvoice(booking._id)}><ReceiptText />Tải hóa đơn chi tiết</button><small>Trạng thái đối soát: {booking.carerPayoutStatus || 'unpaid'}</small></aside>
    </div>
  </div>;
};

const AdminListShell = ({ icon: Icon, eyebrow, title, subtitle, action, children }: any) => <div className="admin-page-content admin-operations"><header className="admin-operations-heading">{Icon && <div className="admin-title-icon"><Icon /></div>}<div><p>{eyebrow}</p><h1>{title}</h1><span>{subtitle}</span></div>{action}</header>{children}</div>;
const SearchBox = ({ value, onChange, placeholder }: any) => <label className="admin-search"><Search /><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} /></label>;
const Status = ({ value }: { value: string }) => <span className={`operation-status ${value}`}>{value}</span>;
const Metric = ({ label, value }: any) => <article><small>{label}</small><strong>{value}</strong></article>;
const Detail = ({ label, value }: any) => <p className="admin-detail-row"><span>{label}</span><strong>{value}</strong></p>;
const AdminTable = ({ headers, children }: any) => <div className="admin-operation-table"><table><thead><tr>{headers.map((header: string) => <th key={header}>{header}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
