import { Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './ServiceCard.css';

interface ServiceCardProps {
  service: {
    _id?: string;
    id?: number | string;
    title: string;
    price?: number | string;
    image?: string;
    img?: string;
    description?: string;
    category?: string;
    rating?: number;
    reviewCount?: number;
    priceUnit?: string;
  };
  onSelect?: () => void;
  carerId?: string | null;
  carerName?: string | null;
}

const ServiceCard = ({ service, onSelect, carerId, carerName }: ServiceCardProps) => {
  const navigate = useNavigate();
  const serviceId = service._id || service.id;
  const serviceImage = service.image || service.img;
  const displayPrice = typeof service.price === 'number'
    ? service.price.toLocaleString('vi-VN')
    : service.price;

  const handleAction = () => {
    if (onSelect) {
      onSelect();
      return;
    }

    const query = carerId ? `?carerId=${carerId}&carerName=${encodeURIComponent(carerName || '')}` : '';
    navigate(`/services/${serviceId}${query}`);
  };

  return (
    <motion.article
      className="service-card-premium"
      whileHover={{ y: -4 }}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      <button className="service-card-hitarea" type="button" onClick={handleAction} aria-label={`Xem ${service.title}`}>
        <div className="card-image">
          {serviceImage ? (
            <img src={serviceImage} alt={service.title} />
          ) : (
            <div className="image-placeholder-inner">
              <span>{service.title.substring(0, 1)}</span>
            </div>
          )}
          <span className={`service-category-tag ${service.category === 'Mẹ bầu' ? 'pregnant' : service.category === 'Mẹ sau sinh' ? 'postpartum' : ''}`}>
            {service.category || 'Dịch vụ'}
          </span>
        </div>

        <div className="card-content">
          <h3>{service.title}</h3>
          <p className="service-rating"><Star fill="currentColor" /> <strong>{service.rating || 4.9}</strong> <span>({service.reviewCount || 0} đánh giá)</span></p>
          <div className="service-card-bottom">
            <p className="price"><small>Giá từ</small><strong>{displayPrice}đ</strong><span>/{service.priceUnit || 'buổi'}</span></p>
            <span className="learn-more">{carerId ? 'Chọn' : 'Xem chi tiết'}</span>
          </div>
        </div>
      </button>
    </motion.article>
  );
};

export default ServiceCard;
