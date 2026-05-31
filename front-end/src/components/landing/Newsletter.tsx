import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import './Newsletter.css';

const Newsletter = () => {
  return (
    <section className="newsletter-figma">
      <div className="container">
        <div className="newsletter-box-figma">
          <span className="newsletter-label">
            <ShieldCheck size={14} />
            Nhận thông tin chăm sóc mới nhất
          </span>
          <h2>Đăng ký để nhận tư vấn!</h2>
          <p>Cập nhật các thông tin, ưu đãi mới nhất nhanh chóng và kiến thức phòng ngừa dịch bệnh cho bé.</p>
          <div className="subscribe-form-figma">
            <input type="email" placeholder="Email của bạn" aria-label="Địa chỉ email" />
            <motion.button 
              className="btn-subscribe"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Đăng ký
            </motion.button>
          </div>
          <small className="newsletter-note">Chúng tôi chỉ gửi nội dung hữu ích, không spam hộp thư của bạn.</small>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
