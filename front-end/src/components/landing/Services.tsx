import { useEffect, useState } from 'react';
import { ArrowRight, Clock3, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import fallbackImage from '../../assets/stitch/service-postpartum.jpg';
import heroImage from '../../assets/stitch/hero-maternal-care.jpg';
import careImage from '../../assets/stitch/booking-parent.jpg';
import './Services.css';

const featuredFallback = [
  { _id: 'featured-postpartum', title: 'Chăm sóc mẹ sau sinh tại nhà', description: 'Theo dõi sức khỏe, hỗ trợ phục hồi và chăm sóc mẹ đúng cách.', category: 'Chăm sóc sau sinh', duration: '90 phút', price: 500000, image: fallbackImage, rating: 4.9, reviewCount: 128 },
  { _id: 'featured-baby', title: 'Tắm bé & Massage chuẩn y khoa', description: 'Chăm sóc dịu nhẹ giúp bé thư giãn và hình thành nhịp sinh hoạt tốt.', category: 'Chăm sóc em bé', duration: '60 phút', price: 350000, image: heroImage, rating: 4.8, reviewCount: 95 },
  { _id: 'featured-lactation', title: 'Tư vấn sữa mẹ và kích sữa', description: 'Hỗ trợ mẹ xử lý khó khăn trong hành trình nuôi con bằng sữa mẹ.', category: 'Tư vấn chuyên môn', duration: '75 phút', price: 450000, image: careImage, rating: 5.0, reviewCount: 64 },
  { _id: 'featured-night', title: 'Bảo mẫu chăm sóc đêm', description: 'Hỗ trợ trông bé ban đêm để mẹ có giấc ngủ trọn vẹn.', category: 'Chăm sóc em bé', duration: '8 giờ', price: 850000, image: fallbackImage, rating: 4.9, reviewCount: 42 },
];

const Services = () => {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/services')
      .then(({ data }) => {
        const items = Array.isArray(data) ? data : Array.isArray(data?.services) ? data.services : [];
        setServices((items.length ? items : featuredFallback).slice(0, 4));
      })
      .catch((error) => console.error('Error fetching services:', error))
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
              <Link to={String(service._id).startsWith('featured-') ? '/services' : `/services/${service._id}`} className="landing-service-card" key={service._id}>
                <img src={service.image || fallbackImage} alt={service.title} />
                <div>
                  <span>{service.category || 'Chăm sóc mẹ và bé'}</span>
                  <h3>{service.title}</h3>
                  <div className="service-rating-meta">
                    <span className="rating-star">★</span>
                    <span className="rating-score">{service.rating || 4.9}</span>
                    <span className="rating-count">({service.reviewCount || Math.floor(Math.random() * 100) + 20})</span>
                  </div>
                  <div className="landing-service-meta">
                    <strong>Từ {Number(service.price || service.basePrice || 0).toLocaleString('vi-VN')}đ / buổi</strong>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Services;
