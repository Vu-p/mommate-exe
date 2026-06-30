import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, CalendarDays, ChevronLeft, ChevronRight, CircleAlert, Database, Pause, Play, RefreshCw, Search, Users } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../../utils/api';
import './AdminGa4.css';

type Row = { dimensions: Record<string, string>; metrics: Record<string, number> };
type Report = { dimensions: string[]; metrics: { name: string; type?: string }[]; rows: Row[]; rowCount: number; quota?: any };
type NamedReports = Record<string, Report>;
type MetadataItem = { apiName: string; uiName?: string; description?: string; category?: string; customDefinition?: boolean };

const iso = (date: Date) => date.toISOString().slice(0, 10);
const initialRange = () => ({ from: iso(new Date(Date.now() - 27 * 86400000)), to: iso(new Date()) });
const number = (value: number) => Number(value || 0).toLocaleString('vi-VN');
const errorMessage = (error: any) => {
  const code = error.response?.data?.error?.code;
  if (code === 'GA4_NOT_CONFIGURED') return 'GA4 chưa được cấu hình trên backend. Hãy thêm property ID và service-account credential.';
  if (code === 'GA4_CREDENTIALS_INVALID') return 'Credential GA4 trên backend không hợp lệ. Hãy kiểm tra lại GA4_SERVICE_ACCOUNT_BASE64 và xóa GA4_SERVICE_ACCOUNT_PATH trên production.';
  if (error.response?.status === 403) return 'Tài khoản không có quyền xem dữ liệu Google Analytics.';
  if (/quota/i.test(error.response?.data?.error?.message || '')) return 'GA4 đã chạm giới hạn quota. Vui lòng thử lại sau.';
  return error.response?.data?.error?.message || 'Không thể tải dữ liệu Google Analytics.';
};

const Empty = ({ children = 'Chưa có dữ liệu trong khoảng thời gian này.' }: { children?: React.ReactNode }) => <div className="ga4-empty"><Database size={24} /><p>{children}</p></div>;
const ErrorState = ({ message, retry }: { message: string; retry: () => void }) => <div className="ga4-error" role="alert"><CircleAlert /><div><strong>Không thể hiển thị báo cáo</strong><p>{message}</p></div><button onClick={retry}><RefreshCw size={16} /> Thử lại</button></div>;
const Skeleton = () => <div className="ga4-skeleton" aria-label="Đang tải dữ liệu">{Array.from({ length: 8 }, (_, i) => <i key={i} />)}</div>;

const ReportTable = ({ report, labels = {} }: { report?: Report; labels?: Record<string, string> }) => {
  if (!report?.rows?.length) return <Empty />;
  return <div className="ga4-table-wrap"><table><thead><tr>{report.dimensions.map((key) => <th key={key}>{labels[key] || key}</th>)}{report.metrics.map(({ name }) => <th key={name}>{labels[name] || name}</th>)}</tr></thead><tbody>{report.rows.map((row, index) => <tr key={index}>{report.dimensions.map((key) => <td key={key}>{row.dimensions[key] || '(not set)'}</td>)}{report.metrics.map(({ name }) => <td key={name}>{number(row.metrics[name])}</td>)}</tr>)}</tbody></table></div>;
};

const Overview = ({ range, setRange }: { range: ReturnType<typeof initialRange>; setRange: (value: ReturnType<typeof initialRange>) => void }) => {
  const [data, setData] = useState<{ reports: NamedReports; generatedAt: string; cached?: boolean }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(() => {
    setLoading(true); setError('');
    api.get('/analytics/ga4/overview', { params: range }).then(({ data }) => setData(data)).catch((e) => setError(errorMessage(e))).finally(() => setLoading(false));
  }, [range]);
  useEffect(load, [load]);
  const totals = data?.reports?.totals?.rows?.[0]?.metrics || {};
  const timeline = (data?.reports?.timeline?.rows || []).map((row) => ({ date: row.dimensions.date ? `${row.dimensions.date.slice(6, 8)}/${row.dimensions.date.slice(4, 6)}` : '', users: row.metrics.activeUsers, sessions: row.metrics.sessions }));
  return <>
    <div className="ga4-toolbar"><DateRange range={range} setRange={setRange} /><button onClick={load}><RefreshCw size={16} /> Làm mới</button><span>{data?.cached ? 'Dữ liệu cache' : 'Dữ liệu mới'}{data?.generatedAt ? ` · ${new Date(data.generatedAt).toLocaleTimeString('vi-VN')}` : ''}</span></div>
    {loading ? <Skeleton /> : error ? <ErrorState message={error} retry={load} /> : <>
      <section className="ga4-kpis">
        <Kpi icon={Users} label="Người dùng hoạt động" value={number(totals.activeUsers)} />
        <Kpi icon={Activity} label="Phiên truy cập" value={number(totals.sessions)} />
        <Kpi icon={BarChart3} label="Phiên tương tác" value={number(totals.engagedSessions)} />
        <Kpi icon={CalendarDays} label="Sự kiện chuyển đổi" value={number(totals.keyEvents)} />
      </section>
      <section className="ga4-grid">
        <article className="ga4-panel ga4-chart"><header><div><h2>Xu hướng truy cập</h2><p>Người dùng và phiên theo ngày</p></div></header>{timeline.length ? <ResponsiveContainer width="100%" height={290}><LineChart data={timeline}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" /><YAxis /><Tooltip /><Line type="monotone" dataKey="users" name="Người dùng" stroke="#7357b4" strokeWidth={3} dot={false} /><Line type="monotone" dataKey="sessions" name="Phiên" stroke="#df9fbd" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer> : <Empty />}</article>
        <Panel title="Kênh thu hút"><ReportTable report={data?.reports.acquisition} labels={{ sessionDefaultChannelGroup: 'Kênh', sessions: 'Phiên', activeUsers: 'Người dùng', keyEvents: 'Chuyển đổi' }} /></Panel>
        <Panel title="Trang được xem nhiều"><ReportTable report={data?.reports.pages} labels={{ pagePath: 'Đường dẫn', screenPageViews: 'Lượt xem', activeUsers: 'Người dùng', averageSessionDuration: 'Thời lượng TB' }} /></Panel>
        <Panel title="Sự kiện nổi bật"><ReportTable report={data?.reports.events} labels={{ eventName: 'Sự kiện', eventCount: 'Số lần', totalUsers: 'Người dùng' }} /></Panel>
        <Panel title="Khu vực"><ReportTable report={data?.reports.geography} labels={{ country: 'Quốc gia', city: 'Thành phố', activeUsers: 'Người dùng', sessions: 'Phiên' }} /></Panel>
        <Panel title="Thiết bị và trình duyệt"><ReportTable report={data?.reports.technology} labels={{ deviceCategory: 'Thiết bị', browser: 'Trình duyệt', activeUsers: 'Người dùng', sessions: 'Phiên' }} /></Panel>
      </section>
    </>}
  </>;
};

const Realtime = () => {
  const [data, setData] = useState<{ reports: NamedReports; generatedAt: string }>();
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(() => { setError(''); api.get('/analytics/ga4/realtime').then(({ data }) => setData(data)).catch((e) => setError(errorMessage(e))).finally(() => setLoading(false)); }, []);
  useEffect(() => { load(); if (paused) return; const timer = window.setInterval(load, 30000); return () => window.clearInterval(timer); }, [load, paused]);
  const active = data?.reports.totals?.rows?.[0]?.metrics.activeUsers || 0;
  return <>
    <div className="ga4-toolbar"><span className="ga4-live"><i /> 30 phút gần nhất</span><button onClick={() => setPaused((value) => !value)}>{paused ? <Play size={16} /> : <Pause size={16} />}{paused ? 'Tiếp tục' : 'Tạm dừng'}</button><button onClick={load}><RefreshCw size={16} /> Làm mới</button><span>{data?.generatedAt ? new Date(data.generatedAt).toLocaleTimeString('vi-VN') : ''}</span></div>
    {loading ? <Skeleton /> : error ? <ErrorState message={error} retry={load} /> : <><section className="ga4-realtime-hero"><Activity /><div><strong>{number(active)}</strong><span>người dùng đang hoạt động</span></div></section><section className="ga4-grid"><Panel title="Trang đang xem"><ReportTable report={data?.reports.pages} /></Panel><Panel title="Sự kiện trực tiếp"><ReportTable report={data?.reports.events} /></Panel><Panel title="Nguồn truy cập"><ReportTable report={data?.reports.sources} /></Panel><Panel title="Thiết bị"><ReportTable report={data?.reports.devices} /></Panel></section></>}
  </>;
};

const Explorer = ({ range, setRange }: { range: ReturnType<typeof initialRange>; setRange: (value: ReturnType<typeof initialRange>) => void }) => {
  const [metadata, setMetadata] = useState<{ dimensions: MetadataItem[]; metrics: MetadataItem[] }>();
  const [dimensions, setDimensions] = useState(['pagePath']);
  const [metrics, setMetrics] = useState(['screenPageViews']);
  const [filterName, setFilterName] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [report, setReport] = useState<Report & { offset: number; limit: number; cached?: boolean }>();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { api.get('/analytics/ga4/metadata').then(({ data }) => setMetadata(data)).catch((e) => setError(errorMessage(e))); }, []);
  const runReport = useCallback((targetPage = page) => {
    setLoading(true); setError('');
    const dimensionFilter = filterName && filterValue ? { filter: { fieldName: filterName, stringFilter: { matchType: 'CONTAINS', value: filterValue, caseSensitive: false } } } : undefined;
    api.post('/analytics/ga4/report', { ...range, dimensions, metrics, dimensionFilter, offset: targetPage * limit, limit })
      .then(({ data }) => { setReport(data); setPage(targetPage); }).catch((e) => setError(errorMessage(e))).finally(() => setLoading(false));
  }, [range, dimensions, metrics, filterName, filterValue, page, limit]);
  const select = (setter: (value: string[]) => void) => (event: React.ChangeEvent<HTMLSelectElement>) => setter(Array.from(event.target.selectedOptions, (option) => option.value));
  const canNext = Boolean(report && (page + 1) * limit < report.rowCount);
  return <>
    <section className="ga4-explorer-controls">
      <div className="ga4-explorer-top"><DateRange range={range} setRange={setRange} /><button className="primary" disabled={!metrics.length || loading} onClick={() => runReport(0)}><Search size={16} /> {loading ? 'Đang truy vấn...' : 'Chạy báo cáo'}</button></div>
      <div className="ga4-field-grid"><label>Dimensions<select multiple value={dimensions} onChange={select(setDimensions)}>{metadata?.dimensions.map((item) => <option key={item.apiName} value={item.apiName}>{item.uiName || item.apiName} · {item.apiName}</option>)}</select><small>Chọn tối đa 9 mục bằng Ctrl/Cmd.</small></label><label>Metrics<select multiple value={metrics} onChange={select(setMetrics)}>{metadata?.metrics.map((item) => <option key={item.apiName} value={item.apiName}>{item.uiName || item.apiName} · {item.apiName}</option>)}</select><small>Chọn từ 1 đến 10 mục.</small></label></div>
      <div className="ga4-filter-row"><label>Lọc dimension<select value={filterName} onChange={(e) => setFilterName(e.target.value)}><option value="">Không lọc</option>{dimensions.map((name) => <option key={name}>{name}</option>)}</select></label><label>Giá trị chứa<input value={filterValue} onChange={(e) => setFilterValue(e.target.value)} disabled={!filterName} /></label><label>Số dòng<select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>{[10,25,50,100].map((value) => <option key={value}>{value}</option>)}</select></label></div>
    </section>
    {error && <ErrorState message={error} retry={() => runReport(page)} />}
    {!error && (loading ? <Skeleton /> : report ? <section className="ga4-panel ga4-explorer-result"><header><div><h2>Kết quả báo cáo</h2><p>{number(report.rowCount)} dòng{report.cached ? ' · cache' : ''}</p></div><div className="ga4-pagination"><button disabled={!page} onClick={() => runReport(page - 1)}><ChevronLeft /></button><span>Trang {page + 1}</span><button disabled={!canNext} onClick={() => runReport(page + 1)}><ChevronRight /></button></div></header><ReportTable report={report} />{report.quota && <details><summary>Quota của property</summary><pre>{JSON.stringify(report.quota, null, 2)}</pre></details>}</section> : <Empty>Chọn dimensions và metrics, sau đó chạy báo cáo.</Empty>)}
  </>;
};

const DateRange = ({ range, setRange }: { range: ReturnType<typeof initialRange>; setRange: (value: ReturnType<typeof initialRange>) => void }) => <div className="ga4-date-range"><label>Từ ngày<input type="date" value={range.from} max={range.to} onChange={(e) => setRange({ ...range, from: e.target.value })} /></label><label>Đến ngày<input type="date" value={range.to} min={range.from} max={iso(new Date())} onChange={(e) => setRange({ ...range, to: e.target.value })} /></label></div>;
const Kpi = ({ icon: Icon, label, value }: any) => <article className="ga4-kpi"><span><Icon /></span><small>{label}</small><strong>{value}</strong></article>;
const Panel = ({ title, children }: { title: string; children: React.ReactNode }) => <article className="ga4-panel"><header><h2>{title}</h2></header>{children}</article>;

const AdminGa4 = () => {
  const [tab, setTab] = useState<'overview' | 'realtime' | 'explorer'>('overview');
  const [range, setRange] = useState(initialRange);
  const tabs = useMemo(() => ([['overview', 'Tổng quan', BarChart3], ['realtime', 'Realtime', Activity], ['explorer', 'Data Explorer', Database]] as const), []);
  return <div className="admin-ga4-page"><header className="ga4-heading"><div><span>Google Analytics 4</span><h1>Phân tích hành vi người dùng</h1><p>Dữ liệu tổng hợp từ website MomMate, tách biệt với báo cáo vận hành nội bộ.</p></div></header><nav className="ga4-tabs" aria-label="Các báo cáo GA4">{tabs.map(([key, label, Icon]) => <button key={key} className={tab === key ? 'active' : ''} aria-selected={tab === key} onClick={() => setTab(key)}><Icon size={17} />{label}</button>)}</nav>{tab === 'overview' && <Overview range={range} setRange={setRange} />}{tab === 'realtime' && <Realtime />}{tab === 'explorer' && <Explorer range={range} setRange={setRange} />}</div>;
};

export default AdminGa4;
