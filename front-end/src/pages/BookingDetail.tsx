import { ArrowRight, BriefcaseMedical, Check, CheckCircle2, Download, Headphones, Loader2, LockKeyhole, Map, MapPin, MessageSquare, Phone, PlayCircle, ShieldCheck, Stethoscope, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import { downloadBookingInvoice } from '../utils/invoice';
import { useAuth } from '../context/AuthContext';
import carerAvatar from '../assets/stitch/generated/stitch-06-ad3697d45210.png';
import motherAvatar from '../assets/stitch/generated/stitch-03-eac9bf4dc5c9.png';
import './OperationalPages.css';
import './CarerRedesign.css';

const steps = ['Chờ Carer', 'Chờ thanh toán', 'Đã thanh toán', 'Đang chăm sóc', 'Hoàn tất'];

const statusToStep: Record<string, number> = {
  pending: 0,
  pending_carer: 0,
  accepted_pending_payment: 1,
  paid_confirmed: 2,
  confirmed: 2,
  in_progress: 3,
  completed: 4,
};

const statusLabels: Record<string, string> = {
  pending: 'Chờ xác nhận',
  pending_carer: 'Chờ Carer duyệt',
  accepted_pending_payment: 'Chờ thanh toán',
  paid_confirmed: 'Đã thanh toán',
  confirmed: 'Đã xác nhận',
  in_progress: 'Đang chăm sóc',
  completed: 'Hoàn tất',
  cancelled: 'Đã hủy',
  refunded: 'Đã hoàn tiền',
};

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [journal, setJournal] = useState({ weightKg: '', notes: '', medicationChecked: false, safetyChecked: false });
  const [savingJournal, setSavingJournal] = useState(false);
  const [refund, setRefund] = useState<any>(null);
  const [incidents, setIncidents] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    api.get(`/bookings/${id}`)
      .then(({ data }) => setBooking(data))
      .catch(() => setLoadError('Không thể tải lịch hẹn này. Lịch có thể không tồn tại hoặc bạn không có quyền truy cập.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || !booking) return;
    if (user?.role === 'carer' || (user?.role === 'parent' && booking.status === 'completed')) {
      api.get(`/bookings/${id}/care-journal`).then(({ data }) => {
        if (!data) return;
        setJournal({
          weightKg: data.weightKg ? String(data.weightKg) : '',
          notes: data.notes || '',
          medicationChecked: Boolean(data.checklist?.medicationChecked),
          safetyChecked: Boolean(data.checklist?.safetyChecked),
        });
      }).catch(() => undefined);
    }
  }, [id, user?.role, booking?.status]);

  useEffect(() => {
    if (!id || user?.role === 'carer') return;
    api.get(`/bookings/${id}/refund-status`)
      .then(({ data }) => setRefund(data))
      .catch(() => undefined);
  }, [id, user?.role]);

  useEffect(() => {
    if (!id) return;
    api.get('/incidents', { params: { limit: 100 } })
      .then(({ data }) => {
        const related = (data.items || []).filter((i: any) => String(i.booking?._id || i.booking) === id);
        setIncidents(related);
      }).catch(() => undefined);
  }, [id]);

  const saveJournal = async () => {
    if (!id) return;
    setSavingJournal(true);
    try {
      await api.put(`/bookings/${id}/care-journal`, {
        weightKg: journal.weightKg ? Number(journal.weightKg) : undefined,
        notes: journal.notes,
        checklist: {
          medicationChecked: journal.medicationChecked,
          safetyChecked: journal.safetyChecked,
        },
      });
    } finally {
      setSavingJournal(false);
    }
  };

  const openConversation = async () => {
    const { data } = await api.post(`/messages/bookings/${id}/conversation`);
    navigate(`/messages/${data._id}`);
  };

  const checkIn = async () => {
    const position = await new Promise<GeolocationPosition>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 }));
    const { data } = await api.patch(`/bookings/${id}/check-in`, {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
    });
    setBooking(data);
  };

  if (loading) return <div className="stitch-page booking-detail-page booking-state-page"><Navbar /><main className="stitch-state"><Loader2 className="spinner" /><p>Đang tải chi tiết lịch hẹn...</p></main></div>;
  if (!booking) return <div className="stitch-page booking-detail-page booking-state-page"><Navbar /><main className="stitch-state booking-state-card"><BriefcaseMedical /><h1>Không tìm thấy lịch hẹn</h1><p>{loadError || 'Lịch hẹn không tồn tại hoặc đã được cập nhật.'}</p><Link to="/account/request">Quay lại danh sách yêu cầu</Link></main></div>;

  const carer = booking.carer?.user || {};
  const parent = booking.parent || {};
  const total = Number(booking.totalPrice || 0);

  if (user?.role === 'carer') {
    const carerStatusLabel = statusLabels[booking.status] || booking.status;
    const scheduledDate = booking.scheduledAt ? new Date(booking.scheduledAt) : null;
    const scheduledEnd = booking.scheduledEndAt ? new Date(booking.scheduledEndAt) : null;
    return <div className="stitch-page carer-case-page"><Navbar/><main className="container carer-case-main">
      <header className="carer-case-heading"><div><p><span>Ca chăm sóc</span> Mã đặt lịch: #{String(booking._id).slice(-8).toUpperCase()}</p><h1>{booking.service?.title}: {parent.firstName} {parent.lastName}</h1></div><div><button onClick={openConversation}>Nhắn tin cho phụ huynh</button><button className="primary" onClick={() => navigate(`/bookings/${booking._id}/change`)}>Đổi lịch</button></div></header>
      <div className="carer-case-layout"><div>
        <section className="carer-case-card care-record"><header><h2><ShieldCheck/>Hồ sơ chăm sóc</h2><small>Cập nhật lần cuối: {booking.updatedAt ? new Date(booking.updatedAt).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</small></header><div>
          <article><img src={parent.avatar || motherAvatar}/><h3>{parent.firstName} {parent.lastName}</h3><small>Mẹ</small><hr/><p>Tình trạng sức khỏe: <strong>{booking.motherCondition || 'Chưa cập nhật'}</strong></p><p>Ghi chú y tế: <strong>{booking.medicalNotes || 'Không có'}</strong></p>{booking.allergies && <span>DỊ ỨNG: {booking.allergies}</span>}</article>
          {booking.careFor !== 'postpartum_mom' && <article className="baby-record"><div className="baby-icon">☺</div><h3>{booking.babyName || 'Thông tin bé'}</h3><small>{booking.babyBirthDate ? `${Math.ceil((Date.now() - new Date(booking.babyBirthDate).getTime()) / 86400000)} ngày tuổi` : 'Chưa cập nhật'}</small><hr/><p>Hình thức bú: <strong>{booking.feedingMethod || 'Chưa cập nhật'}</strong></p><p>Cân nặng khi sinh: <strong>{booking.birthWeight ? `${booking.birthWeight}kg` : 'Chưa cập nhật'}</strong></p></article>}
        </div></section>
        {['in_progress', 'completed'].includes(booking.status) && (
          <section className="carer-case-card care-journal"><h2>Nhật ký ca chăm sóc</h2><p>Ghi lại các quan sát chuyên môn, thời gian bú và các hoạt động trong buổi làm việc. Thông tin này sẽ hiển thị cho phụ huynh sau khi kết thúc.</p><div><input placeholder="Cân nặng (kg)" value={journal.weightKg} onChange={(event) => setJournal((value) => ({ ...value, weightKg: event.target.value }))}/><textarea placeholder="Ghi chú chuyên môn, hướng dẫn của bác sĩ nhi khoa..." value={journal.notes} onChange={(event) => setJournal((value) => ({ ...value, notes: event.target.value }))}/></div><label><input type="checkbox" checked={journal.medicationChecked} onChange={(event) => setJournal((value) => ({ ...value, medicationChecked: event.target.checked }))}/>Đã cho uống thuốc</label><label><input type="checkbox" checked={journal.safetyChecked} onChange={(event) => setJournal((value) => ({ ...value, safetyChecked: event.target.checked }))}/>Đã kiểm tra an toàn tiêu chuẩn</label><button className="primary" onClick={saveJournal} disabled={savingJournal}>{savingJournal ? 'Đang lưu...' : 'Lưu nhật ký'}</button></section>
        )}
      </div><aside className="carer-case-sidebar">
        <section style={{padding: '20px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px'}}>
          <h3 style={{fontSize: '16px', marginBottom: '8px'}}>{booking.address || 'Chưa có địa chỉ'}</h3>
          <p style={{marginBottom: '12px', color: '#64748b', fontSize: '14px'}}>{booking.fullAddress || ''}</p>
          {(booking.location?.coordinates || booking.fullAddress) && (
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${booking.location?.coordinates ? `${booking.location.coordinates[1]},${booking.location.coordinates[0]}` : encodeURIComponent(booking.fullAddress || '')}`} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', textDecoration: 'none', padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '8px', fontWeight: '600', justifyContent: 'center'}}
            >
              <Map size={18} /> Mở bằng Google Maps
            </a>
          )}
        </section>
        <section><small>Ngày</small><strong>{scheduledDate ? scheduledDate.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Chưa xác định'}</strong><small>Thời gian</small><strong>{scheduledDate ? `${scheduledDate.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})} - ${scheduledEnd ? scheduledEnd.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : ''} (${booking.hours || '?'} tiếng)` : 'Chưa xác định'}</strong><small>Phí dịch vụ</small><strong>{total.toLocaleString('vi-VN')}đ • {booking.paidAt ? 'Đã thanh toán' : 'Chưa thanh toán'}</strong></section></aside></div>
      <footer className="carer-case-action"><p><strong>Trạng thái hiện tại: {carerStatusLabel}</strong><small>{new Date(booking.scheduledAt).toLocaleString('vi-VN')}</small></p><button onClick={() => navigate('/carer/bookings')}>Quay lại</button>{['paid_confirmed','confirmed'].includes(booking.status) && <button className="primary" onClick={checkIn}><PlayCircle/>Bắt đầu điểm danh</button>}</footer>
    </main><Footer/></div>;
  }

  return (
    <div className="stitch-page booking-detail-page">
      <Navbar />
      <main className="container booking-detail-main">
        <div className="booking-detail-heading">
          <div><p>Lịch hẹn của tôi&nbsp; / &nbsp;Chi tiết #{String(booking._id).slice(-8).toUpperCase()}</p><h1>Chi tiết lịch Chăm sóc</h1></div>
          <div><button className="booking-cancel-button" onClick={() => navigate(`/bookings/${booking._id}/change`)}>Đổi / Hủy lịch</button><button className="booking-support-button" onClick={() => navigate(`/incidents/new?bookingId=${booking._id}`)}><Headphones />Liên hệ hỗ trợ</button></div>
        </div>

        <section className="booking-progress">
          {steps.map((label, index) => {
            const currentStep = statusToStep[booking.status] ?? -1;
            const isDone = index < currentStep;
            const isCurrent = index === currentStep;
            return <div className={isDone ? 'done' : isCurrent ? 'current' : ''} key={label}><span>{isDone ? <Check /> : index + 1}</span><p>{label}</p></div>;
          })}
        </section>

        <div className="booking-detail-layout">
          <div className="booking-detail-left">
            <section className="booking-detail-card carer-information">
              <h2><UserRound />Thông tin Người chăm sóc (Carer)</h2>
              <div className="carer-information-body">
                <img src={carer.avatar || carerAvatar} alt="" />
                <div><h3>{booking.carer?.department === 'doctor' ? 'BS. ' : ''}{carer.firstName} {carer.lastName}</h3><p>{booking.carer?.position || booking.carer?.department || 'Chuyên gia chăm sóc'}<br />{booking.carer?.experienceYears ? `${booking.carer.experienceYears} năm kinh nghiệm` : ''}</p><span><Phone />{carer.phoneNumber || 'Chưa cập nhật'}</span><button className="message-carer" onClick={openConversation}><MessageSquare />Nhắn tin trực tiếp</button></div>
                <b><ShieldCheck />Đã xác minh</b>
              </div>
            </section>

            <section className="booking-detail-card service-schedule">
              <h2>Dịch vụ & Lịch trình chi tiết</h2>
              <div className="booking-service-package"><Stethoscope /><span><small>GÓI DỊCH VỤ</small><strong>{booking.service?.title}</strong></span></div>
              <div className="booking-date-grid"><div><small>Ngày bắt đầu</small><strong>{new Date(booking.scheduledAt).toLocaleDateString('vi-VN')}</strong></div><div><small>Khung giờ</small><strong>{new Date(booking.scheduledAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})} ({booking.hours} tiếng)</strong></div></div>
              <h3>Ghi chú từ bạn:</h3>
              <p>{booking.notes || 'Không có ghi chú'}</p>
            </section>

            <section className="booking-detail-card family-information">
              <h2>Thông tin Mẹ & Bé</h2>
              <div className="family-columns">
                <div><h3>THÔNG TIN MẸ</h3><p><span>Họ và tên:</span><strong>{booking.contactName || `${parent.firstName} ${parent.lastName}`}</strong></p><p><span>Số điện thoại:</span><strong>{booking.contactPhone}</strong></p><p><span>Tình trạng sức khỏe:</span><strong>{booking.motherCondition || 'Chưa cập nhật'}</strong></p></div>
                <div><h3>THÔNG TIN BÉ</h3><p><span>Tình trạng bé:</span><strong>{booking.babyCondition || 'Chưa cập nhật'}</strong></p><p><span>Ngày sinh:</span><strong>{booking.babyBirthDate ? new Date(booking.babyBirthDate).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</strong></p><p><span>Hình thức sinh:</span><strong>{booking.birthMethod === 'vaginal' ? 'Sinh thường' : booking.birthMethod === 'c_section' ? 'Sinh mổ' : 'Chưa cập nhật'}</strong></p></div>
              </div>
              <aside><strong>Lưu ý đặc biệt cho Carer:</strong><p>{booking.medicalNotes || booking.allergies || 'Không có lưu ý đặc biệt'}</p></aside>
            </section>

            {booking.status === 'completed' && (
              <section className="booking-detail-card">
                <h2>Nhật ký ca chăm sóc</h2>
                <div style={{ marginTop: '10px' }}>
                  <p><strong>Cân nặng của bé:</strong> {journal.weightKg ? `${journal.weightKg} kg` : 'Không cập nhật'}</p>
                  <p><strong>Ghi chú chuyên môn:</strong> {journal.notes || 'Không có ghi chú'}</p>
                  <p><strong>Uống thuốc:</strong> {journal.medicationChecked ? 'Đã thực hiện' : 'Không thực hiện'}</p>
                  <p><strong>Kiểm tra an toàn:</strong> {journal.safetyChecked ? 'Đã thực hiện' : 'Không thực hiện'}</p>
                </div>
              </section>
            )}

            {incidents.length > 0 && (
              <section className="booking-detail-card">
                <h2>Báo cáo sự cố (Incidents)</h2>
                <div style={{ marginTop: '10px' }}>
                  {incidents.map((incident) => (
                    <div key={incident._id} style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}>
                      <p><strong>Tiêu đề:</strong> {incident.title}</p>
                      <p><strong>Trạng thái:</strong> {incident.status === 'open' ? 'Mở' : incident.status === 'investigating' ? 'Đang xử lý' : incident.status === 'resolved' ? 'Đã giải quyết' : 'Đóng'}</p>
                      <p><strong>Mức độ:</strong> {incident.severity}</p>
                      <p><strong>Nội dung:</strong> {incident.description}</p>
                      {incident.resolution && <p><strong>Kết luận:</strong> {incident.resolution}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="booking-detail-right">
            <section className="booking-side-card payment-status">
              <h3>TRẠNG THÁI THANH TOÁN</h3>
              <div><span><CheckCircle2 /></span><strong>{booking.paidAt ? 'Đã thanh toán' : 'Chưa thanh toán'}</strong><small>{booking.paidAt ? 'Qua payOS' : (statusLabels[booking.status] || booking.status)}</small></div>
              {booking.priceSnapshot && <p><span>Đơn giá ({booking.hours || 1} tiếng × {booking.numSessions || 1} buổi)</span><span>{total.toLocaleString('vi-VN')}đ</span></p>}
              <p className="payment-total"><strong>Tổng cộng</strong><b>{total.toLocaleString('vi-VN')}đ</b></p>
              {['pending_payment', 'accepted_pending_payment'].includes(booking.status) && user?.role !== 'carer' && (
                <button className="btn-primary booking-pay-button" onClick={() => navigate(`/payment?bookingId=${booking._id}`)}>
                  Thanh toán ngay
                </button>
              )}
              {booking.paidAt && <button onClick={() => booking?._id && downloadBookingInvoice(booking._id)}><Download />Tải hóa đơn điện tử</button>}
              {refund?.refund && <div className="booking-refund-status"><strong>Hoàn tiền: {refund.refund.status}</strong><small>{refund.refund.providerReference ? `Mã tham chiếu: ${refund.refund.providerReference}` : refund.refund.reason}</small></div>}
              <small><LockKeyhole />Thanh toán được bảo mật bởi payOS</small>
            </section>
            <section className="booking-side-card location-card">
              <h3>ĐỊA ĐIỂM CHĂM SÓC</h3>
              <p><MapPin />{booking.fullAddress}</p>
              {(booking.location?.coordinates || booking.fullAddress) && (
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${booking.location?.coordinates ? `${booking.location.coordinates[1]},${booking.location.coordinates[0]}` : encodeURIComponent(booking.fullAddress || '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6', textDecoration: 'none', marginTop: '10px', padding: '10px', backgroundColor: '#eff6ff', borderRadius: '8px', fontWeight: '500'}}
                >
                  <Map size={18} /> Mở bằng Google Maps
                </a>
              )}
            </section>
            <section className="booking-policy-card"><strong>Cần thay đổi lịch hẹn?</strong><p>Bạn có thể dời lịch hẹn miễn phí trước 24h kể từ thời điểm bắt đầu.</p><Link to="/terms">Đọc Chính sách hoàn tiền & hủy lịch <ArrowRight /></Link></section>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BookingDetail;
