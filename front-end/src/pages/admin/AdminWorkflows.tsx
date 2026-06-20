import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Clock3, History, RotateCcw, XCircle } from 'lucide-react';
import api from '../../utils/api';
import './AdminWorkflows.css';

type Tab = 'changes' | 'refunds' | 'audit';
type Pagination = { page: number; total: number; totalPages: number };

const emptyPagination: Pagination = { page: 1, total: 0, totalPages: 1 };
const money = (value: unknown) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;
const dateTime = (value?: string) => value ? new Date(value).toLocaleString('vi-VN') : '—';

const AdminWorkflows = () => {
  const [tab, setTab] = useState<Tab>('changes');
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<any[]>([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const endpoint = tab === 'changes'
        ? '/admin/booking-change-requests'
        : tab === 'refunds'
          ? '/admin/refunds'
          : '/admin/audit-logs';
      const { data } = await api.get(endpoint, {
        params: { page, limit: 20, status: tab === 'audit' ? undefined : status || undefined },
      });
      setItems(data.items || []);
      setPagination(data.pagination || emptyPagination);
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Không thể tải hàng đợi xử lý.');
    } finally {
      setLoading(false);
    }
  }, [page, status, tab]);

  useEffect(() => { void load(); }, [load]);

  const switchTab = (next: Tab) => {
    setTab(next);
    setPage(1);
    setStatus(next === 'audit' ? '' : 'pending');
  };

  const reviewChange = async (id: string, nextStatus: 'approved' | 'rejected') => {
    const note = window.prompt(nextStatus === 'approved' ? 'Ghi chú duyệt' : 'Lý do từ chối');
    if (note === null || (nextStatus === 'rejected' && !note.trim())) return;
    await api.patch(`/admin/booking-change-requests/${id}`, { status: nextStatus, note: note.trim() });
    await load();
  };

  const reviewRefund = async (id: string, nextStatus: 'processing' | 'completed' | 'rejected') => {
    const providerReference = nextStatus === 'completed'
      ? window.prompt('Nhập mã giao dịch hoàn tiền từ PayOS/ngân hàng')
      : '';
    if (nextStatus === 'completed' && !providerReference?.trim()) return;
    await api.patch(`/admin/refunds/${id}`, { status: nextStatus, providerReference: providerReference?.trim() });
    await load();
  };

  return (
    <div className="admin-workflows">
      <header>
        <div>
          <p>VẬN HÀNH & KIỂM SOÁT</p>
          <h1>Trung tâm xử lý yêu cầu</h1>
          <span>Duyệt đổi lịch, hủy lịch, hoàn tiền và theo dõi audit log.</span>
        </div>
      </header>

      <nav className="workflow-tabs">
        <button className={tab === 'changes' ? 'active' : ''} onClick={() => switchTab('changes')}><Clock3 />Đổi / hủy lịch</button>
        <button className={tab === 'refunds' ? 'active' : ''} onClick={() => switchTab('refunds')}><RotateCcw />Hoàn tiền</button>
        <button className={tab === 'audit' ? 'active' : ''} onClick={() => switchTab('audit')}><History />Audit log</button>
      </nav>

      {tab !== 'audit' && (
        <div className="workflow-filter">
          <label>Trạng thái
            <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
              <option value="">Tất cả</option>
              <option value="pending">Chờ xử lý</option>
              {tab === 'changes' ? (
                <>
                  <option value="approved">Đã duyệt</option>
                  <option value="rejected">Từ chối</option>
                  <option value="auto_approved">Tự động duyệt</option>
                </>
              ) : (
                <>
                  <option value="processing">Đang xử lý</option>
                  <option value="completed">Hoàn tất</option>
                  <option value="failed">Thất bại</option>
                  <option value="rejected">Từ chối</option>
                </>
              )}
            </select>
          </label>
          <strong>{pagination.total} yêu cầu</strong>
        </div>
      )}

      {error && <div className="workflow-error">{error}</div>}
      {loading ? <div className="workflow-empty">Đang tải...</div> : items.length === 0 ? <div className="workflow-empty">Không có dữ liệu phù hợp.</div> : (
        <div className="workflow-table-wrap">
          {tab === 'changes' && <ChangeTable items={items} onReview={reviewChange} />}
          {tab === 'refunds' && <RefundTable items={items} onReview={reviewRefund} />}
          {tab === 'audit' && <AuditTable items={items} />}
        </div>
      )}

      <footer className="workflow-pagination">
        <button disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Trang trước</button>
        <span>Trang {pagination.page} / {Math.max(1, pagination.totalPages)}</span>
        <button disabled={page >= pagination.totalPages} onClick={() => setPage((value) => value + 1)}>Trang sau</button>
      </footer>
    </div>
  );
};

const ChangeTable = ({ items, onReview }: { items: any[]; onReview: (id: string, status: 'approved' | 'rejected') => void }) => (
  <table>
    <thead><tr><th>Booking</th><th>Người yêu cầu</th><th>Loại</th><th>Thời gian mới / lý do</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
    <tbody>{items.map((item) => <tr key={item._id}>
      <td><strong>#{String(item.booking?._id || item.booking).slice(-8).toUpperCase()}</strong><small>{item.booking?.service?.title}</small></td>
      <td>{item.requestedBy?.firstName} {item.requestedBy?.lastName}<small>{item.requestedBy?.role}</small></td>
      <td>{item.type === 'cancel' ? 'Hủy lịch' : 'Đổi lịch'}</td>
      <td>{item.requestedScheduledAt && <strong>{dateTime(item.requestedScheduledAt)}</strong>}<small>{item.reason}</small></td>
      <td><span className={`workflow-status ${item.status}`}>{item.status}</span></td>
      <td>{item.status === 'pending' && <div className="workflow-actions"><button className="approve" onClick={() => onReview(item._id, 'approved')}><CheckCircle2 />Duyệt</button><button className="reject" onClick={() => onReview(item._id, 'rejected')}><XCircle />Từ chối</button></div>}</td>
    </tr>)}</tbody>
  </table>
);

const RefundTable = ({ items, onReview }: { items: any[]; onReview: (id: string, status: 'processing' | 'completed' | 'rejected') => void }) => (
  <table>
    <thead><tr><th>Booking</th><th>Khách hàng</th><th>Số tiền</th><th>Lý do</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
    <tbody>{items.map((item) => <tr key={item._id}>
      <td><strong>#{String(item.booking?._id || item.booking).slice(-8).toUpperCase()}</strong><small>{item.booking?.service?.title}</small></td>
      <td>{item.booking?.parent?.firstName} {item.booking?.parent?.lastName}<small>{item.booking?.parent?.email}</small></td>
      <td><strong>{money(item.amount)}</strong><small>{item.providerReference || 'Chưa có mã giao dịch'}</small></td>
      <td>{item.reason}</td>
      <td><span className={`workflow-status ${item.status}`}>{item.status}</span></td>
      <td>{!['completed', 'rejected'].includes(item.status) && <div className="workflow-actions"><button onClick={() => onReview(item._id, 'processing')}>Đang xử lý</button><button className="approve" onClick={() => onReview(item._id, 'completed')}>Hoàn tất</button><button className="reject" onClick={() => onReview(item._id, 'rejected')}>Từ chối</button></div>}</td>
    </tr>)}</tbody>
  </table>
);

const AuditTable = ({ items }: { items: any[] }) => (
  <table>
    <thead><tr><th>Thời gian</th><th>Người thực hiện</th><th>Hành động</th><th>Đối tượng</th><th>Chi tiết</th></tr></thead>
    <tbody>{items.map((item) => <tr key={item._id}>
      <td>{dateTime(item.createdAt)}</td>
      <td>{item.actor ? `${item.actor.firstName || ''} ${item.actor.lastName || ''}` : 'Hệ thống'}<small>{item.actor?.email}</small></td>
      <td><strong>{item.action}</strong></td>
      <td>{item.entityType}<small>{item.entityId ? `#${String(item.entityId).slice(-8)}` : ''}</small></td>
      <td><code>{JSON.stringify(item.metadata || item.after || {}).slice(0, 180)}</code></td>
    </tr>)}</tbody>
  </table>
);

export default AdminWorkflows;
