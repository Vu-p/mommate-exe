import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
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

          const name = [parent.firstName, parent.lastName].filter(Boolean).join(' ') || 'Anonymous parent';
          const role = [carerUser.firstName, carerUser.lastName].filter(Boolean).join(' ');

          return {
            id: review._id,
            name,
            role: role ? `Cared by ${role}` : 'Client review',
            text: review.content || review.title || 'No review text provided.',
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
           <span className="label">HEARTFELT FEEDBACK</span>
           <h2>What our clients say</h2>
           <p>Real stories from mothers who found comfort and professional support through Mommate.</p>
        </div>
        
        <div className="testimonial-row">
          {loading && <p className="loading-text">Loading testimonials...</p>}
          {!loading && displayReviews.map((t, i) => (
            <motion.div 
              key={t.id || i} 
              className="test-card-figma"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -10 }}
            >
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
            <p className="empty-text">No reviews yet. Check back soon.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
