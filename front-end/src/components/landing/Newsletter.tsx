import { motion } from 'framer-motion';
import './Newsletter.css';

const Newsletter = () => {
  return (
    <section className="newsletter-figma">
      <div className="container">
        <div className="newsletter-box-figma">
          <h2>Subscribe for all needs!</h2>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus amet dui qui vitae quis leo.</p>
          <div className="subscribe-form-figma">
            <input type="email" placeholder="Enter your email" aria-label="Email address" />
            <motion.button 
              className="btn-subscribe"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Sign up
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
