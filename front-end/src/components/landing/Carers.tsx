import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Loader2, ShieldCheck, Star } from 'lucide-react';
import api from '../../utils/api';
import {
  formatLocation,
  formatReviewLabel,
  getCarerAvatar,
  getCarerFullName,
  getDisplayRating,
} from '../../utils/carerDisplay';
import './Carers.css';

const Carers = () => {
  const [carers, setCarers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCarers = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/carers');
        setCarers(data.slice(0, 4));
      } catch (error) {
        console.error('Error fetching carers for landing:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCarers();
  }, []);

  return (
    <section className="carers">
      <div className="container">
        <div className="carers-heading">
          <span className="section-label">ĐỘI NGŨ CHUYÊN GIA ĐÁNG TIN CẬY</span>
          <h2 className="section-title">Gặp gỡ các chuyên gia của chúng tôi</h2>
          <p>Những bảo mẫu và chuyên gia chăm sóc được tuyển chọn để đồng hành cùng mẹ và bé.</p>
        </div>
        
        {loading ? (
          <div className="landing-loading">
            <Loader2 className="spinner" />
            <p>Đang tải danh sách chuyên gia...</p>
          </div>
        ) : carers.length > 0 ? (
          <div className="carer-track">
            {carers.map((carer) => {
              const fullName = getCarerFullName(carer);
              const avatar = getCarerAvatar(carer);
              const rating = getDisplayRating(carer);

              return (
                <Link to={`/carers/${carer._id}`} key={carer._id} className="carer-link-wrapper">
                  <motion.div 
                    className="carer-card"
                    whileHover={{ y: -15, scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <img src={avatar} alt={fullName} className="carer-img" />
                    <div className="carer-info">
                      <div className="carer-info-top">
                        <span className="carer-badge">
                          <ShieldCheck size={12} />
                          Đã xác minh
                        </span>
                        <span className="carer-rating">
                          {rating ? (
                            <>
                              <Star size={12} fill="currentColor" />
                              {rating}
                            </>
                          ) : (
                            formatReviewLabel(carer)
                          )}
                        </span>
                      </div>
                      <h4>{fullName}</h4>
                      <p>{formatLocation(carer.location)}</p>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <p>Hiện chưa có chuyên gia nào rảnh. Vui lòng quay lại sau!</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Carers;
