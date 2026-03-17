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
    description?: string; // Added based on the new JSX structure
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
    ? `${service.price.toLocaleString()} VND / session` 
    : service.price;

  const handleAction = () => {
    if (onSelect) {
      onSelect();
    } else {
      const query = carerId ? `?carerId=${carerId}&carerName=${encodeURIComponent(carerName || '')}` : '';
      navigate(`/services/${serviceId}${query}`);
    }
  };

  return (
    <motion.div 
      className="service-card-premium"
      whileHover={{ y: -8 }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onClick={onSelect ? handleAction : undefined} // Allow clicking the whole card to select if onSelect is provided
    >
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
        {service.description && <p>{service.description.substring(0, 60)}...</p>}
        <p className="price">{displayPrice}</p>
        {onSelect ? (
          <button className="learn-more" onClick={(e) => {
            e.stopPropagation(); // Prevent card click from triggering twice
            handleAction();
          }}>
            Select
          </button>
        ) : (
          <button className="learn-more" onClick={handleAction}>
            Learn more <ArrowRight size={16} />
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default ServiceCard;
