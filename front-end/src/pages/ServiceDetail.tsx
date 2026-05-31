import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, ChevronRight, Clock3, Loader2, Sparkles } from 'lucide-react';
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
  const stepCards = service?.steps || [];

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

        <section className="service-top-section">
          <div className="service-page-heading">
            <p className="section-eyebrow">Dịch vụ nổi bật</p>
            <h1>{service.title}</h1>
          </div>

          <div className="gallery-container">
            <div className="thumbnails">
              {galleryImages.slice(1, 4).map((image, index) => (
                <div key={`${image}-${index}`} className="thumb">
                  <img src={image} alt={`${service.title} ${index + 2}`} />
                </div>
              ))}
            </div>

            <div className="main-image">
              <img src={service.image} alt={service.title} />
            </div>

            <aside className="service-intro-card">
              <p className="intro-category">{service.category}</p>
              <h2>{service.title}</h2>

              <div className="intro-meta">
                <span className="meta-chip">
                  <Sparkles size={14} />
                  {service.tags?.[0] || 'Dịch vụ chăm sóc'}
                </span>
                <span className="meta-chip">
                  <Clock3 size={14} />
                  {service.duration}
                </span>
              </div>

              <p className="intro-description">{service.description}</p>

              <div className="intro-price">
                <span className="price-label">Giá từ</span>
                <strong>{servicePrice ? `${servicePrice.toLocaleString('vi-VN')} VND` : 'Liên hệ'}</strong>
              </div>

              <button type="button" onClick={handleBooking} className="btn-booking-primary">
                {carerId ? 'Xác nhận đặt' : 'Đặt ngay'}
                <ArrowRight size={16} />
              </button>
            </aside>
          </div>
        </section>

        <section className="service-benefits">
          <h3>Lợi ích của gói dịch vụ</h3>
          <p>{service.description}</p>
          <div className="action-buttons">
            <button type="button" className="btn-booking-secondary" onClick={handleBooking}>
              {carerId ? 'Xác nhận' : 'Đặt ngay'}
            </button>
            <button type="button" className="btn-consultation">
              Yêu cầu tư vấn
            </button>
          </div>
        </section>

        {stepCards.length > 0 && (
          <section className="treatment-details">
            <h3>Chi tiết liệu trình</h3>
            <div className="steps-list">
              {stepCards.map((step, index) => (
                <article key={`${step.title}-${index}`} className="treatment-step-card">
                  <div className="step-header">
                    <h4>Bước {index + 1}</h4>
                  </div>
                  <div className="step-body">
                    <div className="step-image">
                      <img src={step.image || service.image} alt={step.title || `Bước ${index + 1}`} />
                    </div>
                    <div className="step-text">
                      <h5>{step.title || `Bước ${index + 1}`}</h5>
                      <p>{step.text}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="bottom-cta">
          <div className="book-now-section">
            <button type="button" className="btn-book-now-large" onClick={handleBooking}>
              {carerId ? 'Đặt lịch' : 'Đặt ngay'}
            </button>
          </div>
          <Link to="/services" className="btn-explore">
            Xem thêm
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ServiceDetail;
