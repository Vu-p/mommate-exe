import axios from 'axios';
import { AlertTriangle, ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import './OperationalPages.css';

const IncidentReport = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ category: 'care_quality', severity: 'medium', title: '', description: '', evidence: '' });
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await api.post('/incidents', {
        bookingId: params.get('bookingId'),
        ...form,
        evidence: form.evidence.split('\n').map((item) => item.trim()).filter(Boolean),
      });
      navigate(`/account/request/${params.get('bookingId')}`);
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.message : 'Không thể gửi báo cáo.');
    }
  };

  return <div className="stitch-page"><Navbar /><main className="container narrow-operational">
    <Link to={-1 as any} className="back-link"><ChevronLeft />Quay lại</Link>
    <section className="stitch-card incident-form"><AlertTriangle className="incident-symbol" /><p className="stitch-eyebrow">HỖ TRỢ AN TOÀN</p><h1>Báo cáo sự cố</h1><p>MomMate sẽ tiếp nhận và phản hồi theo mức độ ưu tiên.</p>
      {error && <div className="form-alert">{error}</div>}
      <form onSubmit={submit}>
        <label>Loại sự cố<select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}><option value="care_quality">Chất lượng chăm sóc</option><option value="safety">An toàn</option><option value="payment">Thanh toán</option><option value="conduct">Ứng xử</option><option value="other">Khác</option></select></label>
        <label>Mức độ<select value={form.severity} onChange={(e) => setForm({...form, severity: e.target.value})}><option value="low">Thấp</option><option value="medium">Trung bình</option><option value="high">Cao</option><option value="critical">Khẩn cấp</option></select></label>
        <label className="full">Tiêu đề<input required value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} /></label>
        <label className="full">Mô tả<textarea required rows={6} value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} /></label>
        <label className="full">Link bằng chứng, mỗi dòng một link<textarea rows={3} value={form.evidence} onChange={(e) => setForm({...form, evidence: e.target.value})} /></label>
        <button className="stitch-primary-button" type="submit">Gửi báo cáo</button>
      </form>
    </section>
  </main><Footer /></div>;
};

export default IncidentReport;
