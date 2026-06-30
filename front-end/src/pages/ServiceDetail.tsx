import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ChevronDown, ChevronRight, Clock3, Headphones, Heart, Loader2, ShieldCheck, Star, Stethoscope } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import { trackEvent } from '../utils/analytics';
import './ServiceDetail.css';

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const params = new URLSearchParams(location.search);
  const carerId = params.get('carerId');
  const carerName = params.get('carerName');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/services/${id}`);
        setService(data);
        trackEvent('view_item', { service_category: data.category || 'service', source_screen: 'service_detail' });
      } catch (error) {
        console.error('Error fetching service detail:', error);
        setService(null);
      } finally {
        setLoading(false);
      }
    };
    if (id) void load();
  }, [id]);

  const galleryImages = useMemo(() => {
    if (!service) return [];
    return Array.from(new Set([
      service.image,
      ...(service.steps || []).map((step: any) => step.image),
    ].filter(Boolean))) as string[];
  }, [service]);

  if (loading) {
    return <div className="service-detail-page service-detail-state"><Navbar /><div className="service-detail-loading"><Loader2 className="spinner" /><p>Đang tải chi tiết dịch vụ...</p></div><Footer /></div>;
  }
  if (!service) {
    return <div className="service-detail-page service-detail-state"><Navbar /><div className="service-not-found"><h2>Không tìm thấy dịch vụ</h2><p>Dịch vụ này có thể đã ngừng hoạt động.</p><Link to="/services" className="btn-primary">Quay lại danh sách dịch vụ</Link></div><Footer /></div>;
  }

  const servicePrice = Number(service.price ?? service.basePrice ?? 0);
  const hasReviews = Number(service.reviewCount || 0) > 0 && Number(service.rating || 0) > 0;
  const sessionOptions = service.sessionOptions?.length ? service.sessionOptions : [1];

  const handleBooking = () => {
    trackEvent('select_item', { service_category: service?.category || 'service', source_screen: 'service_detail', item_list_name: 'service_detail' });
    if (carerId) {
      navigate('/booking', { state: { serviceId: service._id, serviceTitle: service.title, carerId, carerName } });
      return;
    }
    navigate(`/carers?serviceId=${service._id}&serviceTitle=${encodeURIComponent(service.title)}`);
  };

  return (
    <div className="service-detail-page">
      <Navbar />
      <main className="container service-detail-content">
        <nav className="breadcrumb service-detail-breadcrumb">
          <Link to="/">Trang chủ</Link><ChevronRight size={14} /><Link to="/services">Dịch vụ</Link><ChevronRight size={14} /><span>{service.title}</span>
        </nav>

        <div className="stitch-service-layout">
          <div className="stitch-service-main">
            <section className="stitch-service-hero">
              {service.image || galleryImages[0] ? <img src={service.image || galleryImages[0]} alt={service.title} /> : <div className="image-placeholder-inner">{service.title.slice(0, 1)}</div>}
              <div className="stitch-service-hero-overlay">
                <div>
                  <span>{service.category || 'Chăm sóc mẹ và bé'}</span>
                  <span>{hasReviews ? <><Star size={15} fill="currentColor" /> {Number(service.rating).toFixed(1)} ({service.reviewCount} đánh giá)</> : 'Chưa có đánh giá'}</span>
                </div>
                <h1>{service.title}</h1>
              </div>
            </section>

            <section className="stitch-service-about"><h2>Về dịch vụ này</h2><p>{service.description}</p></section>

            <div className="stitch-service-info-grid">
              <section>
                <h3><CheckCircle2 size={20} /> Nội dung chăm sóc</h3>
                {service.careItems?.length
                  ? <ul>{service.careItems.map((item: string) => <li key={item}><CheckCircle2 size={17} />{item}</li>)}</ul>
                  : <p>Nội dung chi tiết sẽ được chuyên gia xác nhận theo hồ sơ chăm sóc của gia đình.</p>}
              </section>
              <section>
                <h3><Clock3 size={20} /> Thời gian & Giá cả</h3>
                {sessionOptions.map((sessions: number) => <div className="stitch-price-row" key={sessions}><span>{sessions} buổi · {service.duration}</span><strong>{(servicePrice * sessions).toLocaleString('vi-VN')} VNĐ</strong></div>)}
                <small>Giá cuối cùng được backend xác nhận khi tạo báo giá đặt lịch.</small>
              </section>
            </div>

            {service.faq?.length > 0 && <section className="stitch-service-faq">
              <h2>Câu hỏi thường gặp</h2>
              {service.faq.map((item: any) => <details key={item.question}><summary>{item.question}<ChevronDown size={18} /></summary><p>{item.answer}</p></details>)}
            </section>}
          </div>

          <aside className="stitch-service-sidebar">
            <section className="stitch-booking-card">
              <span>Giá từ</span>
              <div><strong>{servicePrice.toLocaleString('vi-VN')}</strong><b>VNĐ</b><small>/ buổi</small></div>
              <p>{service.activeCarerCount > 0 ? `${service.activeCarerCount} chuyên gia đã xác minh đang cung cấp dịch vụ này.` : 'Chưa có chuyên gia khả dụng cho dịch vụ này.'}</p>
              <button type="button" onClick={handleBooking} disabled={!carerId && service.activeCarerCount === 0}>Đặt lịch ngay <ArrowRight size={18} /></button>
              <footer><ShieldCheck size={16} /> Báo giá minh bạch từ hệ thống</footer>
            </section>
            <section className="stitch-trust-card">
              <h3>Tiêu chuẩn MomMate</h3>
              <div><Stethoscope /><p><strong>Hồ sơ chuyên môn</strong><span>Chỉ kết nối với chuyên gia đã được xác minh.</span></p></div>
              <div><Heart /><p><strong>Chăm sóc phù hợp</strong><span>Dịch vụ dựa trên hồ sơ và nhu cầu thực tế.</span></p></div>
              <div><ShieldCheck /><p><strong>Quy trình minh bạch</strong><span>Lịch, giá và trạng thái được lưu trên hệ thống.</span></p></div>
            </section>
            <section className="stitch-support-card"><Headphones size={20} /><span>Cần hỗ trợ tư vấn?</span><Link to="/contact">Liên hệ hỗ trợ</Link></section>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ServiceDetail;
