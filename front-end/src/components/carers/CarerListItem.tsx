import { Briefcase, CreditCard, MapPin, Star, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  formatAge,
  formatExperience,
  formatHourlyRate,
  formatLocation,
  formatReviewLabel,
  getCarerAvatar,
  getCarerFullName,
  getDisplayRating,
} from '../../utils/carerDisplay';
import './CarerListItem.css';

interface CarerListItemProps {
  carer: any;
  onSelect?: () => void;
  serviceId?: string | null;
  serviceTitle?: string | null;
}

const CarerListItem = ({ carer, onSelect, serviceId, serviceTitle }: CarerListItemProps) => {
  const carerId = carer._id || carer.id;
  const fullName = getCarerFullName(carer);
  const avatar = getCarerAvatar(carer);
  const displayRating = getDisplayRating(carer);
  const displayReviews = formatReviewLabel(carer);
  const displayLoc = formatLocation(carer.location || carer.loc);
  const displayAge = formatAge(carer.age);
  const displayExp = formatExperience(carer.experienceYears);
  const displayPrice = formatHourlyRate(carer.hourlyRate || carer.price);

  const profileUrl = `/carers/${carerId}${serviceId ? `?serviceId=${serviceId}&serviceTitle=${encodeURIComponent(serviceTitle || '')}` : ''}`;

  const CardWrapper = onSelect ? 'div' : Link;
  const wrapperProps = onSelect
    ? { onClick: onSelect, className: 'carer-list-item clickable' }
    : { to: profileUrl, className: 'carer-list-item' };

  return (
    // @ts-ignore
    <CardWrapper {...wrapperProps}>
      <div className="carer-main-info">
        <div className="carer-avatar">
          <img src={avatar} alt={fullName} />
        </div>
        <div className="carer-details">
          <div className="name-rating">
            <h3>{fullName}</h3>
            <div className="rating">
              {displayRating && (
                <>
                  <Star size={18} fill="#FACC15" color="#FACC15" />
                  <span>{displayRating}</span>
                </>
              )}
              <span className="reviews">{displayReviews}</span>
            </div>
          </div>
          <p className="carer-bio">
            {carer.bio || 'Chuyên gia chưa cập nhật giới thiệu cá nhân.'}
          </p>
        </div>
      </div>

      <div className="carer-info-blocks">
        <div className="info-block">
          <MapPin size={20} strokeWidth={1.5} />
          <span>{displayLoc}</span>
        </div>
        <div className="info-block">
          <User size={20} strokeWidth={1.5} />
          <span>{displayAge}</span>
        </div>
        <div className="info-block">
          <Briefcase size={20} strokeWidth={1.5} />
          <span>{displayExp}</span>
        </div>
        <div className="info-block">
          <CreditCard size={20} strokeWidth={1.5} />
          <span>{displayPrice}</span>
        </div>
      </div>
    </CardWrapper>
  );
};

export default CarerListItem;
