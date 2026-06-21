import { useEffect, useState } from 'react';
import { ArrowRight, Clock3, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import './Services.css';

const Services = () => {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api.get('/services', { params: { page: 1, limit: 4, area: 'Đà Nẵng' } })
      .then(({ data }) => {
        const items = Array.isArray(data) ? data : data.items || [];
        setServices(items.slice(0, 4));
      })
      .catch((error) => {
        console.error('Error fetching services:', error);
        setFailed(true);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="services" id="services">
      <div className="container">
        <div className="public-section-heading public-section-heading-row">
          <div><span>DỊCH VỤ NỔI BẬT</span><h2>Lựa chọn hàng đầu của các mẹ</h2></div>
          <Link to="/services">Xem tất cả dịch vụ <ArrowRight size={17} /></Link>
        </div>
        {loading ? <div className="landing-loading"><Loader2 className="spinner" /><p>Đang tải dịch vụ...</p></div> : (
          <div className="landing-service-grid">
            {services.map((service) => (
              <Link to={`/services/${service._id}`} className="landing-service-card" key={service._id}>
                {service.image ? <img src={service.image} alt={service.title} /> : <div className="image-placeholder-inner">{service.title.slice(0, 1)}</div>}
                <div>
                  <span>{service.category || 'Chăm sóc mẹ và bé'}</span>
                  <h3>{service.title}</h3>
                  <div className="service-rating-meta">
                    <span className="rating-star">★</span>
                    {service.reviewCount > 0 ? <><span className="rating-score">{Number(service.rating).toFixed(1)}</span><span className="rating-count">({service.reviewCount})</span></> : <span className="rating-count">Chưa có đánh giá</span>}
                  </div>
                  <div className="landing-service-meta">
                    <strong>Từ {Number(service.price || service.basePrice || 0).toLocaleString('vi-VN')}đ / buổi</strong>
                  </div>
                </div>
              </Link>
            ))}
            {!services.length && <p className="empty-text">{failed ? 'Không thể tải dịch vụ lúc này.' : 'Chưa có dịch vụ khả dụng tại Đà Nẵng.'}</p>}
          </div>
        )}
      </div>
    </section>
  );
};

export default Services;
