import { ArrowRight } from 'lucide-react';
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
    ? `Price: ${service.price.toLocaleString()} VND / buổi`
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
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
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
        </div>

        <div className="card-content">
          <h3>{service.title}</h3>
          <p className="price">{displayPrice}</p>
          <span className="learn-more">
            {onSelect ? 'Chọn' : 'Xem thêm'} <ArrowRight size={20} />
          </span>
        </div>
      </button>
    </motion.article>
  );
};

export default ServiceCard;
