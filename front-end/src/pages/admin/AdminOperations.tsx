import { BarChart3, Eye, Filter, Plus, Search, ShieldAlert, Star, UserRoundX, WalletCards } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../utils/api';
import '../OperationalPages.css';
import './AdminOperations.css';

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

export const AdminReviews = () => {
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

export const AdminIncidents = () => {
  const [items, setItems] = useState<any[]>([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const load = () => api.get('/incidents', { params: { page, limit: 20, status: status || undefined } }).then(({ data }) => { setItems(data.items); setPagination(data.pagination); });
  useEffect(() => { void load(); }, [page, status]);
  const update = async (id: string, next: string) => { await api.patch(`/incidents/${id}`, { status: next, resolution: next === 'resolved' ? 'Đã được quản trị viên xử lý' : undefined }); load(); };
  return <AdminListShell icon={ShieldAlert} eyebrow="AN TOÀN VẬN HÀNH" title="Quản lý sự cố" subtitle={`${pagination.total} báo cáo`}>
    <div className="admin-filter-row"><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Tất cả</option><option value="open">Mới</option><option value="investigating">Đang xử lý</option><option value="resolved">Đã giải quyết</option></select></div>
    <AdminTable headers={['Sự cố', 'Booking', 'Mức độ', 'Người báo cáo', 'Trạng thái', 'Thao tác']}>{items.map((item) => <tr key={item._id}><td><strong>{item.title}</strong><small>{item.category}</small></td><td>#{String(item.booking?._id || '').slice(-8)}</td><td><Status value={item.severity} /></td><td>{item.reportedBy?.firstName} {item.reportedBy?.lastName}</td><td><Status value={item.status} /></td><td><select value={item.status} onChange={(e) => update(item._id, e.target.value)}><option value="open">Mới</option><option value="investigating">Đang xử lý</option><option value="resolved">Đã giải quyết</option><option value="closed">Đóng</option></select></td></tr>)}</AdminTable>
    <PageNav pagination={pagination} onChange={setPage} />
  </AdminListShell>;
};

export const AdminRevenue = () => {
  const [data, setData] = useState<any>(null);
  useEffect(() => { api.get('/analytics/dashboard').then(({ data }) => setData(data)); }, []);
  const maxRevenue = Math.max(1, ...(data?.monthly || []).map((item: any) => item.revenue));
  return <AdminListShell icon={BarChart3} eyebrow="BÁO CÁO VẬN HÀNH" title="Doanh thu chuyên sâu" subtitle="Tổng hợp trực tiếp từ booking đã thanh toán">
    <div className="analytics-stat-grid"><Metric label="Tổng doanh thu" value={money(data?.totals?.revenue)} /><Metric label="Phí nền tảng" value={money(data?.totals?.platformFees)} /><Metric label="Chi trả chuyên gia" value={money(data?.totals?.carerPayouts)} /><Metric label="Booking" value={data?.totals?.bookings || 0} /></div>
    <section className="admin-operation-card revenue-chart"><h2>Doanh thu theo tháng</h2><div>{(data?.monthly || []).map((item: any) => <span key={item.month}><i style={{ height: `${Math.max(8, item.revenue / maxRevenue * 220)}px` }} /><small>{item.month}</small><b>{money(item.revenue)}</b></span>)}</div></section>
  </AdminListShell>;
};

export const AdminReconciliation = () => {
  const [data, setData] = useState<any>({ items: [], summary: {} });
  const [status, setStatus] = useState('');
  const load = () => api.get('/analytics/reconciliation', { params: { status: status || undefined } }).then(({ data }) => setData(data));
  useEffect(() => { void load(); }, [status]);
  const pay = async (id: string) => { const reference = prompt('Mã giao dịch đối soát') || ''; await api.patch(`/bookings/${id}/payout`, { reference }); load(); };
  return <AdminListShell icon={WalletCards} eyebrow="TÀI CHÍNH" title="Đối soát & thanh toán" subtitle="Theo dõi khoản phải trả cho chuyên gia">
    <div className="analytics-stat-grid"><Metric label="Tổng giá trị" value={money(data.summary.total)} /><Metric label="Phí nền tảng" value={money(data.summary.platformFees)} /><Metric label="Phải trả" value={money(data.summary.payable)} /><Metric label="Đã trả" value={money(data.summary.paid)} /></div>
    <div className="admin-filter-row"><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Tất cả</option><option value="ready">Chờ chi trả</option><option value="paid">Đã chi trả</option></select></div>
    <AdminTable headers={['Booking', 'Chuyên gia', 'Dịch vụ', 'Giá trị', 'Phải trả', 'Trạng thái', 'Thao tác']}>{data.items.map((item: any) => <tr key={item._id}><td>#{String(item._id).slice(-8)}</td><td>{item.carer?.user?.firstName} {item.carer?.user?.lastName}</td><td>{item.service?.title}</td><td>{money(item.totalPrice)}</td><td>{money(item.carerPayoutAmount)}</td><td><Status value={item.carerPayoutStatus} /></td><td>{item.carerPayoutStatus !== 'paid' && <button className="admin-inline-action" onClick={() => pay(item._id)}>Đánh dấu đã trả</button>}</td></tr>)}</AdminTable>
  </AdminListShell>;
};

export const AdminBookingDetail = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState<any>(null);
  useEffect(() => { api.get(`/bookings/${id}`).then(({ data }) => setBooking(data)); }, [id]);
  if (!booking) return <div className="admin-page-content">Đang tải booking...</div>;
  return <AdminListShell icon={Eye} eyebrow="CHI TIẾT ĐẶT LỊCH" title={`Booking #${String(booking._id).slice(-8).toUpperCase()}`} subtitle={booking.service?.title}>
    <div className="admin-detail-grid"><section className="admin-operation-card"><h2>Thông tin chăm sóc</h2><Detail label="Khách hàng" value={`${booking.parent?.firstName || ''} ${booking.parent?.lastName || ''}`} /><Detail label="Chuyên gia" value={`${booking.carer?.user?.firstName || ''} ${booking.carer?.user?.lastName || ''}`} /><Detail label="Lịch hẹn" value={new Date(booking.scheduledAt).toLocaleString('vi-VN')} /><Detail label="Địa chỉ" value={booking.fullAddress || booking.address} /><Detail label="Ghi chú y tế" value={booking.medicalNotes || 'Không có'} /></section><section className="admin-operation-card"><h2>Thanh toán & trạng thái</h2><Detail label="Trạng thái" value={booking.status} /><Detail label="Tổng tiền" value={money(booking.totalPrice)} /><Detail label="Phí nền tảng" value={money(booking.platformFeeAmount)} /><Detail label="Chi trả carer" value={money(booking.carerPayoutAmount)} /><Detail label="payOS" value={booking.payosStatus || 'Chưa tạo'} /></section></div>
  </AdminListShell>;
};

const AdminListShell = ({ icon: Icon, eyebrow, title, subtitle, action, children }: any) => <div className="admin-page-content admin-operations"><header className="admin-operations-heading">{Icon && <div className="admin-title-icon"><Icon /></div>}<div><p>{eyebrow}</p><h1>{title}</h1><span>{subtitle}</span></div>{action}</header>{children}</div>;
const SearchBox = ({ value, onChange, placeholder }: any) => <label className="admin-search"><Search /><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} /></label>;
const Status = ({ value }: { value: string }) => <span className={`operation-status ${value}`}>{value}</span>;
const Metric = ({ label, value }: any) => <article><small>{label}</small><strong>{value}</strong></article>;
const Detail = ({ label, value }: any) => <p className="admin-detail-row"><span>{label}</span><strong>{value}</strong></p>;
const AdminTable = ({ headers, children }: any) => <div className="admin-operation-table"><table><thead><tr>{headers.map((header: string) => <th key={header}>{header}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
