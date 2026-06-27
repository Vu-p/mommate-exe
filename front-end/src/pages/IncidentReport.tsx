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
  const [form, setForm] = useState({ category: 'care_quality', severity: 'medium', title: '', description: '', evidence: '' as string | string[] });
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const { data } = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const currentEvidence = Array.isArray(form.evidence) ? form.evidence : form.evidence ? form.evidence.split('\n') : [];
      setForm({ ...form, evidence: [...currentEvidence, data.url] });
    } catch {
      setError('Lỗi tải ảnh/video lên.');
    } finally {
      setUploading(false);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!params.get('bookingId')) {
      setError('Thiếu mã đặt lịch. Không thể báo cáo sự cố.');
      return;
    }
    try {
      const evidenceArray = Array.isArray(form.evidence) ? form.evidence : form.evidence.split('\n').map((item) => item.trim()).filter(Boolean);
      await api.post('/incidents', {
        bookingId: params.get('bookingId'),
        ...form,
        evidence: evidenceArray,
      });
      navigate(`/account/request/${params.get('bookingId')}`);
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.message : 'Không thể gửi báo cáo.');
    }
  };

  return <div className="stitch-page incident-report-page"><Navbar /><main className="container narrow-operational">
    <Link to={-1 as any} className="back-link"><ChevronLeft />Quay lại</Link>
    <section className="stitch-card incident-form"><AlertTriangle className="incident-symbol" /><p className="stitch-eyebrow">HỖ TRỢ AN TOÀN</p><h1>Báo cáo sự cố</h1><p>MomMate sẽ tiếp nhận và phản hồi theo mức độ ưu tiên.</p>
      {error && <div className="form-alert">{error}</div>}
      <form onSubmit={submit}>
        <label>Loại sự cố<select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}><option value="care_quality">Chất lượng chăm sóc</option><option value="safety">An toàn</option><option value="payment">Thanh toán</option><option value="conduct">Ứng xử</option><option value="other">Khác</option></select></label>
        <label>Mức độ<select value={form.severity} onChange={(e) => setForm({...form, severity: e.target.value})}><option value="low">Thấp</option><option value="medium">Trung bình</option><option value="high">Cao</option><option value="critical">Khẩn cấp</option></select></label>
        <label className="full">Tiêu đề<input required value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} /></label>
        <label className="full">Mô tả<textarea required rows={6} value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} /></label>
        <label className="full">Bằng chứng (Hình ảnh/Video)
          <input type="file" accept="image/*,video/*" onChange={handleFileUpload} disabled={uploading} />
          {uploading && <span className="incident-uploading">Đang tải lên...</span>}
        </label>
        {Array.isArray(form.evidence) && form.evidence.length > 0 && (
          <ul className="incident-evidence-list">
            {form.evidence.map((url, idx) => (
              <li key={idx}><a href={url} target="_blank" rel="noreferrer">Bằng chứng {idx + 1}</a></li>
            ))}
          </ul>
        )}
        <button className="stitch-primary-button" type="submit">Gửi báo cáo</button>
      </form>
    </section>
  </main><Footer /></div>;
};

export default IncidentReport;
