import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import './OperationalPages.css';

const BookingChange = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [type, setType] = useState<'reschedule' | 'cancel'>('reschedule');
  const [scheduledAt, setScheduledAt] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await api.post(`/bookings/${id}/change-requests`, {
        type,
        scheduledAt: type === 'reschedule' ? new Date(scheduledAt).toISOString() : undefined,
        reason,
      });
      navigate(`/account/request/${id}`);
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Không thể gửi yêu cầu.');
    }
  };

  return (
    <div className="stitch-page booking-change-page">
      <Navbar />
      <main className="container narrow-operational">
        <section className="stitch-card booking-change-form">
          <header><h1>Đổi hoặc hủy lịch</h1></header>
          {error && <div className="form-alert">{error}</div>}
          <form onSubmit={submit}>
            <label>Yêu cầu<select value={type} onChange={(event) => setType(event.target.value as 'reschedule' | 'cancel')}><option value="reschedule">Đổi lịch</option><option value="cancel">Hủy lịch</option></select></label>
            {type === 'reschedule' && <label>Thời gian mới<input type="datetime-local" required value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} /></label>}
            <label className="full">Lý do<textarea required value={reason} onChange={(event) => setReason(event.target.value)} /></label>
            <button className="stitch-primary-button">Gửi yêu cầu</button>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default BookingChange;
