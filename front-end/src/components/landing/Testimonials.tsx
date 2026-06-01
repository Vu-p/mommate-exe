import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Quote, Star } from 'lucide-react';
import api from '../../utils/api';
import './Testimonials.css';

type ReviewCard = {
  id: string;
  name: string;
  role: string;
  text: string;
  rating: number;
};

const Testimonials = () => {
  const [reviews, setReviews] = useState<ReviewCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data } = await api.get('/reviews', { params: { limit: 4 } });
        const mapped: ReviewCard[] = data.map((review: any) => {
          const parent = review.parent || {};
          const carerUser = review.carer?.user || {};

          const name = [parent.firstName, parent.lastName].filter(Boolean).join(' ') || 'Phụ huynh ẩn danh';
          const role = [carerUser.firstName, carerUser.lastName].filter(Boolean).join(' ');

          return {
            id: review._id,
            name,
            role: role ? `Được chăm sóc bởi ${role}` : 'Đánh giá từ khách hàng',
            text: review.content || review.title || 'Không có nội dung đánh giá.',
            rating: review.score || 5,
          };
        });
        setReviews(mapped);
      } catch (error) {
        console.error('Failed to load reviews for landing page:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const displayReviews = reviews.length ? reviews : [];

  return (
    <section className="testimonials">
      <div className="container">
        <div className="testimonials-header">
           <span className="label">CÂU CHUYỆN THỰC</span>
           <h2>Khách hàng nói về chúng tôi</h2>
           <p>Vài sự chia sẻ của các gia đình nhỏ chân thực tham gia trải nghiệm cùng Mommate.</p>
           <div className="testimonial-summary">
              <div className="summary-pill">
                <strong>4.9/5</strong>
                <span>điểm hài lòng trung bình</span>
              </div>
              <div className="summary-pill">
                <strong>500+</strong>
                <span>gia đình đã tin chọn</span>
              </div>
           </div>
        </div>
        
        <div className="testimonial-row">
          {loading && <p className="loading-text">Đang tải đánh giá...</p>}
          {!loading && displayReviews.map((t, i) => (
            <motion.div 
              key={t.id || i} 
              className="test-card-figma"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.28, delay: i * 0.04, ease: 'easeOut' }}
              whileHover={{ y: -4 }}
            >
              <Quote size={20} className="quote-icon" />
              <div className="star-row">
                {[...Array(Math.round(t.rating || 5))].map((_, j) => <Star key={j} size={14} fill="#FFC107" color="#FFC107" />)}
              </div>
              <p className="test-text">"{t.text}"</p>
              <div className="author-info">
                 <strong>{t.name}</strong>
                 <span>{t.role}</span>
              </div>
            </motion.div>
          ))}
          {!loading && displayReviews.length === 0 && (
            <p className="empty-text">Chưa có đánh giá nào. Hãy quay lại sau.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
