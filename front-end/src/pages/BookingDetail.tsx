import { ArrowRight, Check, CheckCircle2, Download, Headphones, Loader2, LockKeyhole, Map, MapPin, MessageSquare, Phone, PlayCircle, ShieldCheck, Stethoscope, UserRound } from 'lucide-react';
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

const steps = ['Chờ Carer', 'Chờ thanh toán', 'Đã thanh toán', 'Đang chăm sóc', 'Hoàn tất'];

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [journal, setJournal] = useState({ weightKg: '', notes: '', medicationChecked: false, safetyChecked: false });
  const [savingJournal, setSavingJournal] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/bookings/${id}`).then(({ data }) => setBooking(data)).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || user?.role !== 'carer') return;
    api.get(`/bookings/${id}/care-journal`).then(({ data }) => {
      if (!data) return;
      setJournal({
        weightKg: data.weightKg ? String(data.weightKg) : '',
        notes: data.notes || '',
        medicationChecked: Boolean(data.checklist?.medicationChecked),
        safetyChecked: Boolean(data.checklist?.safetyChecked),
      });
    }).catch(() => undefined);
  }, [id, user?.role]);

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

  if (loading) return <div className="stitch-page"><Navbar /><main className="stitch-state"><Loader2 className="spinner" />Đang tải chi tiết lịch hẹn...</main></div>;
  if (!booking) return <div className="stitch-page"><Navbar /><main className="stitch-state">Không tìm thấy lịch hẹn.</main></div>;

  const carer = booking.carer?.user || {};
  const parent = booking.parent || {};
  const total = Number(booking.totalPrice || 10000000);

  if (user?.role === 'carer') {
    return <div className="stitch-page carer-case-page"><Navbar/><main className="container carer-case-main">
      <header className="carer-case-heading"><div><p><span>Ca chăm sóc</span> Mã đặt lịch: #{String(booking._id).slice(-8).toUpperCase()}</p><h1>{booking.service?.title}: {parent.firstName} {parent.lastName}</h1></div><div><button onClick={openConversation}>Nhắn tin cho phụ huynh</button><button className="primary" onClick={() => navigate(`/bookings/${booking._id}/change`)}>Đổi lịch</button></div></header>
      <div className="carer-case-layout"><div>
        <section className="carer-case-card care-record"><header><h2><ShieldCheck/>Hồ sơ chăm sóc</h2><small>Cập nhật lần cuối: 2 ngày trước</small></header><div>
          <article><img src={motherAvatar}/><h3>Lê Thùy Dương</h3><small>Mẹ • 32 tuổi</small><hr/><p>Tình trạng phục hồi: <strong>Sau mổ lấy thai (Ngày 12)</strong></p><p>Ghi chú y tế: <strong>Thiếu sắt, theo dõi vết mổ</strong></p><span>DỊ ỨNG: PENICILLIN</span> <span className="orange">CẦN HỖ TRỢ KÍCH SỮA</span></article>
          <article className="baby-record"><div className="baby-icon">☺</div><h3>Bé Bơ (Baby Avocado)</h3><small>Trẻ sơ sinh • 12 ngày tuổi</small><hr/><p>Hình thức bú: <strong>Bú mẹ hoàn toàn</strong></p><p>Cân nặng khi sinh: <strong>3.4kg (Khỏe mạnh)</strong></p><span>ĐANG THEO DÕI GIẤC NGỦ</span> <span className="green">THEO DÕI VÀNG DA NHẸ</span></article>
        </div></section>
        <section className="carer-case-card care-journal"><h2>Nhật ký ca chăm sóc</h2><p>Ghi lại các quan sát chuyên môn, thời gian bú và các hoạt động trong buổi làm việc. Thông tin này sẽ hiển thị cho phụ huynh sau khi kết thúc.</p><div><input placeholder="Cân nặng (kg)" value={journal.weightKg} onChange={(event) => setJournal((value) => ({ ...value, weightKg: event.target.value }))}/><textarea placeholder="Ghi chú chuyên môn, hướng dẫn của bác sĩ nhi khoa..." value={journal.notes} onChange={(event) => setJournal((value) => ({ ...value, notes: event.target.value }))}/></div><label><input type="checkbox" checked={journal.medicationChecked} onChange={(event) => setJournal((value) => ({ ...value, medicationChecked: event.target.checked }))}/>Đã cho uống thuốc</label><label><input type="checkbox" checked={journal.safetyChecked} onChange={(event) => setJournal((value) => ({ ...value, safetyChecked: event.target.checked }))}/>Đã kiểm tra an toàn tiêu chuẩn</label><button className="primary" onClick={saveJournal} disabled={savingJournal}>{savingJournal ? 'Đang lưu...' : 'Lưu nhật ký'}</button></section>
      </div><aside className="carer-case-sidebar"><div className="map-cover"><Map/></div><section><h3>123 Bạch Đằng</h3><p>Hải Châu, Đà Nẵng</p></section><section><small>Ngày</small><strong>Thứ Năm, 14 Th11, 2024</strong><small>Thời gian</small><strong>08:00 AM - 17:00PM (8 tiếng)</strong><small>Phí dịch vụ</small><strong>10.000.000 đ • Đã thanh toán qua thẻ</strong></section></aside></div>
      <footer className="carer-case-action"><p><strong>Trạng thái hiện tại: {booking.status}</strong><small>{new Date(booking.scheduledAt).toLocaleString('vi-VN')}</small></p><button onClick={() => navigate('/carer/bookings')}>Quay lại</button>{['paid_confirmed','confirmed'].includes(booking.status) && <button className="primary" onClick={checkIn}><PlayCircle/>Bắt đầu điểm danh</button>}</footer>
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
          {steps.map((label, index) => <div className={index < 2 ? 'done' : index === 2 ? 'current' : ''} key={label}><span>{index < 2 ? <Check /> : index + 1}</span><p>{label}</p></div>)}
        </section>

        <div className="booking-detail-layout">
          <div className="booking-detail-left">
            <section className="booking-detail-card carer-information">
              <h2><UserRound />Thông tin Người chăm sóc (Carer)</h2>
              <div className="carer-information-body">
                <img src={carerAvatar} alt="" />
                <div><h3>BS. {carer.firstName || 'Nguyễn Thị'} {carer.lastName || 'Minh Anh'}</h3><p>Bác sĩ Sản phụ khoa & Chuyên gia chăm sóc sau sinh<br />10 năm kinh nghiệm</p><span><Phone />{carer.phoneNumber || 'Chưa cập nhật'}</span><button className="message-carer" onClick={openConversation}><MessageSquare />Nhắn tin trực tiếp</button></div>
                <b><ShieldCheck />Đã xác minh</b>
              </div>
            </section>

            <section className="booking-detail-card service-schedule">
              <h2>Dịch vụ & Lịch trình chi tiết</h2>
              <div className="booking-service-package"><Stethoscope /><span><small>GÓI DỊCH VỤ</small><strong>{booking.service?.title || 'Chăm sóc mẹ sau sinh cao cấp - 14 ngày'}</strong></span></div>
              <div className="booking-date-grid"><div><small>Ngày bắt đầu</small><strong>Thứ Hai, 24/06/2026</strong></div><div><small>Khung giờ</small><strong>08:00 - 17:00 hàng ngày</strong></div></div>
              <h3>Nội dung chăm sóc dự kiến:</h3>
              <p><CheckCircle2 />Kiểm tra vết mổ/vết khâu tầng sinh môn cho mẹ.</p>
              <p><CheckCircle2 />Tắm bé, vệ sinh rốn và massage kích thích vận động cho trẻ sơ sinh.</p>
              <p><CheckCircle2 />Hỗ trợ tư vấn dinh dưỡng và phương pháp nuôi con bằng sữa mẹ.</p>
            </section>

            <section className="booking-detail-card family-information">
              <h2>Thông tin Mẹ & Bé</h2>
              <div className="family-columns">
                <div><h3>THÔNG TIN MẸ</h3><p><span>Họ và tên:</span><strong>{parent.firstName || 'Lê Thùy'} {parent.lastName || 'Dương'}</strong></p><p><span>Ngày sinh:</span><strong>12/08/1995</strong></p><p><span>Tình trạng sức khỏe:</span><strong>Sinh mổ lần 1, ổn định</strong></p></div>
                <div><h3>THÔNG TIN BÉ</h3><p><span>Biệt danh:</span><strong>Bé Bơ (Baby Avocado)</strong></p><p><span>Ngày sinh:</span><strong>20/05/2024</strong></p><p><span>Cân nặng sinh:</span><strong>3.2 kg</strong></p></div>
              </div>
              <aside><strong>Lưu ý đặc biệt cho Carer:</strong><p>Mẹ bị dị ứng với hải sản và cần chú trọng hỗ trợ tư thế bế bé bú không ảnh hưởng vết mổ.</p></aside>
            </section>
          </div>

          <aside className="booking-detail-right">
            <section className="booking-side-card payment-status">
              <h3>TRẠNG THÁI THANH TOÁN</h3>
              <div><span><CheckCircle2 /></span><strong>Đã thanh toán</strong><small>Qua payOS</small></div>
              <p><span>Giá gói (14 ngày)</span><span>{(total + 500000).toLocaleString('vi-VN')}đ</span></p>
              <p className="payment-total"><strong>Tổng cộng</strong><b>{total.toLocaleString('vi-VN')}đ</b></p>
              <button onClick={() => booking?._id && downloadBookingInvoice(booking._id)}><Download />Tải hóa đơn điện tử</button>
              <small><LockKeyhole />Thanh toán được bảo mật bởi payOS</small>
            </section>
            <section className="booking-side-card location-card"><h3>ĐỊA ĐIỂM CHĂM SÓC</h3><p><MapPin />123 Bạch Đằng, Hải Châu,<br />Đà Nẵng</p><div><Map /></div></section>
            <section className="booking-policy-card"><strong>Cần thay đổi lịch hẹn?</strong><p>Bạn có thể dời lịch hẹn miễn phí trước 24h kể từ thời điểm bắt đầu.</p><Link to="/terms">Đọc Chính sách hoàn tiền & hủy lịch <ArrowRight /></Link></section>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BookingDetail;
