import { Star, MapPin, User, Briefcase, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import './CarerListItem.css';

interface CarerListItemProps {
  carer: any;
  onSelect?: () => void;
  serviceId?: string | null;
  serviceTitle?: string | null;
}

const CarerListItem = ({ carer, onSelect, serviceId, serviceTitle }: CarerListItemProps) => {
  const carerId = carer._id || carer.id;
  const firstName = carer.user?.firstName || carer.name?.split(' ')[0] || 'Chuyên gia';
  const lastName = carer.user?.lastName || carer.name?.split(' ').slice(1).join(' ') || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const avatar = carer.user?.avatar || carer.avatar || carer.img || 'https://images.pexels.com/photos/15752232/pexels-photo-15752232.jpeg?auto=compress&cs=tinysrgb&w=800';
  
  const displayRating = carer.rating || 5.0;
  const displayReviews = Number(carer.reviewCount || carer.numReviews || 0);
  const displayLoc = carer.location || carer.loc || 'Hồ Chí Minh';
  const displayAge = carer.age ? `${carer.age} tuổi` : '27 tuổi';
  const displayExp = carer.experienceYears ? `${carer.experienceYears} năm kinh nghiệm` : (carer.exp || '4 năm kinh nghiệm');
  const displayPrice = typeof carer.hourlyRate === 'number' 
    ? `${carer.hourlyRate.toLocaleString()} VNĐ/giờ` 
    : (carer.hourlyRate || carer.price || '150 000 VNĐ/giờ');

  const profileUrl = `/carers/${carerId}${serviceId ? `?serviceId=${serviceId}&serviceTitle=${encodeURIComponent(serviceTitle || '')}` : ''}`;

  const CardWrapper = onSelect ? 'div' : Link;
  const wrapperProps = onSelect ? { onClick: onSelect, className: "carer-list-item clickable" } : { to: profileUrl, className: "carer-list-item" };

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
              <Star size={18} fill="#FACC15" color="#FACC15" />
              <span>{displayRating.toFixed(1)}</span>
              <span className="reviews">{displayReviews} Bình luận</span>
            </div>
          </div>
          <p className="carer-bio">
            {carer.bio || 'Với hơn 4 năm kinh nghiệm trong lĩnh vực chăm sóc hậu sản và sơ sinh, tôi hiểu rằng giai đoạn đầu đời của bé và quá trình phục hồi của mẹ là vô cùng quan trọng. Phương châm làm việc của tôi là sự tận tâm, tỉ mỉ và luôn ưu tiên sức khỏe y khoa làm đầu.'}
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
