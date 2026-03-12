import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import './Testimonials.css';

const testimonialsData = [
  {
    name: 'Thi Tran',
    role: 'One child mother',
    text: 'Lorem ipsum dolor sit amet consec tetur adipiscing lectus a nunc mauris scelerisque sed egestas pharetra et cidua pharetra arcu pharetra blandit',
    rating: 5
  },
  {
    name: 'Huong Tran',
    role: 'Mother in Ho Chi Minh City',
    text: 'Ultrices eros in cursus turpis massa tincidunt sem nulla pharetra diam sit amet nisl suscipit adipiscing at inas viverra adipiscing scelerisque integer.',
    rating: 5
  },
  {
    name: 'Nguyen Van Anh',
    role: 'Mother in Da Nang City',
    text: 'Convallis posuere morbi leo urna molestie at elementum eu facilisis sapien pellentesque habitant morbi tristique senectus et netus et urea.',
    rating: 5
  }
];

const Testimonials = () => {
  return (
    <section className="testimonials">
      <div className="container">
        <div className="testimonials-header">
           <span className="label">HELLO BLA BLA</span>
           <h2>What our clients say</h2>
           <p>Lorem ipsum dolor sit amet consectetur adipiscing elit semper dolor elementum tempus hac tellus libero</p>
        </div>
        
        <div className="testimonial-row">
          {testimonialsData.map((t, i) => (
            <div key={i} className="test-card-figma">
              <div className="star-row">
                {[...Array(t.rating)].map((_, j) => <Star key={j} size={14} fill="#FFC107" color="#FFC107" />)}
              </div>
              <p className="test-text">"{t.text}"</p>
              <div className="author-info">
                 <strong>{t.name}</strong>
                 <span>{t.role}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
