import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ChevronDown, ChevronRight, Clock3, Headphones, Heart, Loader2, ShieldCheck, Star, Stethoscope } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import './ServiceDetail.css';

interface ServiceStep {
  title: string;
  text: string;
  image?: string;
}

interface Service {
  _id: string;
  title: string;
  description: string;
  image: string;
  price: number;
  basePrice?: number;
  category: string;
  duration: string;
  tags?: string[];
  steps?: ServiceStep[];
}

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  const queryParams = new URLSearchParams(location.search);
  const carerId = queryParams.get('carerId');
  const carerName = queryParams.get('carerName');

  useEffect(() => {
    const fetchService = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/services/${id}`);
        setService(data);
      } catch (error) {
        console.error('Error fetching service detail:', error);
        setService(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchService();
  }, [id]);

  const galleryImages = useMemo(() => {
    if (!service) return [];

    const images = [
      service.image,
      ...(service.steps || [])
        .map((step) => step.image)
        .filter((image): image is string => Boolean(image)),
    ].filter(Boolean);

    const uniqueImages = Array.from(new Set(images));

    while (uniqueImages.length < 4 && service.image) {
      uniqueImages.push(service.image);
    }

    return uniqueImages.slice(0, 4);
  }, [service]);

  const servicePrice = service?.price ?? service?.basePrice ?? 0;

  const handleBooking = () => {
    if (!service) return;

    if (carerId) {
      navigate('/booking', {
        state: {
          serviceId: service._id,
          serviceTitle: service.title,
          carerId,
          carerName,
        },
      });
      return;
    }

    navigate(`/carers?serviceId=${service._id}&serviceTitle=${encodeURIComponent(service.title)}`);
  };

  if (loading) {
    return (
      <div className="service-detail-page service-detail-state">
        <Navbar />
        <div className="service-detail-loading">
          <Loader2 className="spinner" />
          <p>Đang tải chi tiết dịch vụ...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="service-detail-page service-detail-state">
        <Navbar />
        <div className="service-not-found">
          <h2>Không tìm thấy dịch vụ</h2>
          <p>Dịch vụ này có thể đã bị ẩn hoặc xóa khỏi hệ thống.</p>
          <Link to="/services" className="btn-primary">
            Quay lại danh sách dịch vụ
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="service-detail-page">
      <Navbar />

      <main className="container service-detail-content">
        <nav className="breadcrumb service-detail-breadcrumb">
          <Link to="/">Trang chủ</Link>
          <ChevronRight size={14} />
          <Link to="/services">Tìm dịch vụ</Link>
          <ChevronRight size={14} />
          <span>{service.title}</span>
        </nav>

        <div className="stitch-service-layout">
          <div className="stitch-service-main">
            <section className="stitch-service-hero">
              <img src={service.image || galleryImages[0]} alt={service.title} />
              <div className="stitch-service-hero-overlay">
                <div><span>{service.category || 'Maternal Care'}</span><span><Star size={15} fill="currentColor" /> 4.9 (124 đánh giá)</span></div>
                <h1>{service.title}</h1>
              </div>
            </section>

            <section className="stitch-service-about">
              <h2>Về dịch vụ này</h2>
              <p>{service.description}</p>
            </section>

            <div className="stitch-service-info-grid">
              <section>
                <h3><CheckCircle2 size={20} /> Nội dung chăm sóc</h3>
                <ul>
                  {[
                    'Kiểm tra vết mổ, vết khâu tầng sinh môn',
                    'Massage toàn thân giảm mệt mỏi, stress',
                    'Xông hơ thảo dược phục hồi vùng kín',
                    'Hỗ trợ thông tắc tia sữa và hướng dẫn cho con bú',
                    'Chăm sóc vết rạn và làm mờ thâm nám',
                  ].map((item) => <li key={item}><CheckCircle2 size={17} />{item}</li>)}
                </ul>
              </section>
              <section>
                <h3><Clock3 size={20} /> Thời gian & Giá cả</h3>
                <div className="stitch-price-row"><span>Gói cơ bản (90 phút)</span><strong>{servicePrice.toLocaleString('vi-VN')} VNĐ</strong></div>
                <div className="stitch-price-row"><span>Gói chuyên sâu (120 phút)</span><strong>{Math.round(servicePrice * 1.5).toLocaleString('vi-VN')} VNĐ</strong></div>
                <div className="stitch-price-row"><span>Liệu trình 10 buổi</span><strong>{Math.round(servicePrice * 9).toLocaleString('vi-VN')} VNĐ</strong></div>
                <small>* Giá đã bao gồm các loại thảo dược và dụng cụ cần thiết.</small>
              </section>
            </div>

            <section className="stitch-service-faq">
              <h2>Câu hỏi thường gặp</h2>
              <details><summary>Khi nào tôi nên bắt đầu dịch vụ này?<ChevronDown size={18} /></summary><p>Mẹ có thể bắt đầu sau khi xuất viện và tình trạng sức khỏe đã ổn định. Chuyên gia sẽ trao đổi trước để điều chỉnh liệu trình phù hợp.</p></details>
              <details><summary>Người chăm sóc có chuyên môn gì?<ChevronDown size={18} /></summary><p>Đội ngũ gồm điều dưỡng và hộ sinh có hồ sơ chuyên môn được MomMate xác minh.</p></details>
            </section>
          </div>

          <aside className="stitch-service-sidebar">
            <section className="stitch-booking-card">
              <span>Giá chỉ từ</span>
              <div><strong>{servicePrice.toLocaleString('vi-VN')}</strong><b>VNĐ</b><small>/ buổi</small></div>
              <p>Hơn 1.200 mẹ đã tin tưởng và sử dụng dịch vụ này trong tháng qua.</p>
              <button onClick={handleBooking}>Đặt lịch ngay <ArrowRight size={18} /></button>
              <footer><ShieldCheck size={16} /> Cam kết chất lượng</footer>
            </section>
            <section className="stitch-trust-card">
              <h3>Tại sao chọn chúng tôi?</h3>
              <div><Stethoscope /><p><strong>Đội ngũ chuyên môn</strong><span>Chuyên gia giàu kinh nghiệm và được xác minh.</span></p></div>
              <div><Heart /><p><strong>Tận tâm & Chu đáo</strong><span>Lắng nghe nhu cầu riêng của từng gia đình.</span></p></div>
              <div><ShieldCheck /><p><strong>An toàn tuyệt đối</strong><span>Quy trình rõ ràng và minh bạch.</span></p></div>
            </section>
            <section className="stitch-support-card"><Headphones size={20} /><span>Cần hỗ trợ tư vấn?</span><button>Gọi ngay</button></section>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ServiceDetail;
