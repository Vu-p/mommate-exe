import { useEffect, useState } from 'react';
import { Loader2, MapPin, ShieldCheck, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { formatReviewLabel, getCarerAvatar, getCarerFullName, getDisplayRating } from '../../utils/carerDisplay';
import fallbackAvatar from '../../assets/stitch/carer-profile.jpg';
import './Carers.css';

const Carers = () => {
  const [carers, setCarers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/carers')
      .then(({ data }) => {
        const items = Array.isArray(data) ? data : Array.isArray(data?.carers) ? data.carers : [];
        const featured = [...items]
          .sort((first, second) => {
            const ratingDifference = Number(second.rating || 0) - Number(first.rating || 0);
            return ratingDifference || Number(second.reviewCount || 0) - Number(first.reviewCount || 0);
          })
          .slice(0, 4);
        setCarers(featured);
      })
      .catch((error) => console.error('Error fetching carers:', error))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="carers">
      <div className="container">
        <div className="public-section-heading public-section-heading-row">
          <div><span>CHUYÊN GIA NỔI BẬT</span><h2>Đội ngũ chuyên viên</h2><p>Các hồ sơ nổi bật được lựa chọn dựa trên đánh giá tích cực từ các gia đình.</p></div>
          <Link to="/carers">Xem tất cả chuyên gia</Link>
        </div>
        {loading ? <div className="landing-loading"><Loader2 className="spinner" /><p>Đang tải chuyên gia...</p></div> : (
          <div className="landing-carer-grid">
            {carers.map((carer) => {
              const name = getCarerFullName(carer);
              const rating = getDisplayRating(carer);
              return (
                <Link to={`/carers/${carer._id}`} className="landing-carer-card" key={carer._id}>
                  <img src={getCarerAvatar(carer) || fallbackAvatar} alt={name} />
                  <div className="landing-carer-body">
                    {carer.verificationStatus === 'verified' && <span className="verified-chip"><ShieldCheck size={14} />Đã xác minh nơi làm việc</span>}
                    <h3>{name}</h3>
                    <p><MapPin size={15} />{carer.location || 'Khu vực đang cập nhật'}</p>
                    <div>{rating ? <span className="rating-value"><Star size={15} fill="currentColor" />{rating}</span> : <span>{formatReviewLabel(carer)}</span>}<strong>{Number(carer.hourlyRate || 0).toLocaleString('vi-VN')} VNĐ/giờ</strong></div>
                  </div>
                </Link>
              );
            })}
            {!carers.length && <div className="empty-state"><p>Chưa có chuyên gia đang mở lịch.</p></div>}
          </div>
        )}
      </div>
    </section>
  );
};

export default Carers;
