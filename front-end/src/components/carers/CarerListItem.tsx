import { Star, MapPin, User, Briefcase, DollarSign } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import './CarerListItem.css';

interface CarerListItemProps {
  carer: any;
  onSelect?: () => void;
  serviceId?: string | null;
  serviceTitle?: string | null;
}

const CarerListItem = ({ carer, onSelect, serviceId, serviceTitle }: CarerListItemProps) => {
  const navigate = useNavigate();

  const handleAction = () => {
    if (onSelect) {
      onSelect();
    } else {
      const query = serviceId ? `?serviceId=${serviceId}&serviceTitle=${encodeURIComponent(serviceTitle || '')}` : '';
      navigate(`/carers/${carer._id}${query}`);
    }
  };

  const carerId = carer._id || carer.id;
  const firstName = carer.user?.firstName || carer.name?.split(' ')[0] || 'Carer';
  const lastName = carer.user?.lastName || carer.name?.split(' ').slice(1).join(' ') || '';
  const fullName = `${firstName} ${lastName}`;
  const avatar = carer.user?.avatar || carer.avatar || carer.img;
  
  const displayRating = carer.rating || 5.0;
  const displayLoc = carer.location || carer.loc || 'Unknown';
  const displayAge = carer.age ? `${carer.age} years old` : 'N/A';
  const displayExp = carer.experienceYears ? `${carer.experienceYears} years exp` : (carer.exp || 'N/A');
  const displayPrice = typeof carer.hourlyRate === 'number' 
    ? `${carer.hourlyRate.toLocaleString()} VND/hour` 
    : (carer.hourlyRate || carer.price || 'N/A');

  const profileUrl = `/carers/${carerId}${serviceId ? `?serviceId=${serviceId}&serviceTitle=${encodeURIComponent(serviceTitle || '')}` : ''}`;

  return (
    <div className="carer-list-item">
      <Link to={profileUrl} className="carer-main-info">
        <div className="carer-avatar">
          <img src={avatar} alt={fullName} />
        </div>
        <div className="carer-details">
          <div className="name-rating">
            <h3>{fullName}</h3>
            <div className="rating">
              <Star size={16} fill="var(--warning)" color="var(--warning)" />
              <span>{displayRating.toFixed(1)}</span>
              <button className="btn-view-profile" onClick={handleAction}>
              {onSelect ? 'Select Carer' : 'View Profile'}
            </button>
            </div>
          </div>
          <p className="carer-bio">{carer.bio || 'Experienced medical professional dedicated to providing compassionate care for mothers and babies.'}</p>
        </div>
      </Link>

      <div className="carer-info-blocks">
        <div className="info-block">
          <MapPin size={18} />
          <span>{displayLoc}</span>
        </div>
        <div className="info-block">
          <User size={18} />
          <span>{displayAge}</span>
        </div>
        <div className="info-block">
          <Briefcase size={18} />
          <span>{displayExp}</span>
        </div>
        <div className="info-block">
          <DollarSign size={18} />
          <span>{displayPrice}</span>
        </div>
      </div>
    </div>
  );
};

export default CarerListItem;
