import { BadgeCheck, BriefcaseBusiness, Languages, MapPin, Star } from 'lucide-react';
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
  const subtitle = carer.position
    ? `${carer.position}${carer.workplaceName ? ` tại ${carer.workplaceName}` : ''}`
    : 'Chuyên gia chăm sóc sau sinh';
  const specialty = carer.skills?.[0] || carer.services?.[0]?.category || 'Chăm sóc trẻ sơ sinh';

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
          {Number(carer.rating || 0) >= 4.8 && Number(carer.reviewCount || 0) >= 5 && <span className="top-rated-label">Được đánh giá cao</span>}
        </div>
        <div className="carer-details">
          <div className="name-rating">
            <div>
              <div className="carer-name-line">
                <h3>{fullName}</h3>
                <span className="verified-label"><BadgeCheck />Đã xác thực</span>
              </div>
              <p className="carer-subtitle">{subtitle}</p>
            </div>
            <div className="rating">
              {displayRating ? <><Star size={18} fill="currentColor" /><span>{displayRating}</span><span className="reviews">({displayReviews.replace('bình luận', 'đánh giá')})</span></> : <span className="reviews">{displayReviews}</span>}
            </div>
          </div>
          <div className="carer-card-facts">
            <span><BriefcaseBusiness />{displayExp}</span>
            <span><MapPin />Khu vực: {displayLoc}</span>
            <span><BriefcaseBusiness />Chuyên khoa: {specialty}</span>
            <span><Languages />Ngôn ngữ: {(carer.languages || ['Tiếng Việt']).join(', ')}</span>
          </div>
          <div className="carer-card-footer">
            <div><small>Giá thuê theo giờ</small><strong>{displayPrice}</strong></div>
            <div>
              <button type="button">Xem hồ sơ</button>
              <span>{serviceId ? 'Tiếp tục đặt lịch' : 'Đặt lịch ngay'}</span>
            </div>
          </div>
        </div>
      </div>

    </CardWrapper>
  );
};

export default CarerListItem;
