import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import ServiceNav from './ServiceNav';
import './Hero.css';

const Hero = () => {
  return (
    <section className="hero">
      <div 
        className="hero-bg-wrapper" 
        style={{ backgroundImage: 'url("/hero-bg.png")' }}
      >
        <div className="hero-overlay"></div>
      </div>
      
      <div className="hero-main-container">
        <ServiceNav />
        
        <div className="container hero-content">
          <motion.div 
            className="hero-text"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1><span className="text-highlight">Care</span> for all anytime!</h1>
            <p>Trusted ecosystem connecting new mothers with professional caregivers. We ensure a scientific and safe postpartum journey.</p>
            
            <div className="search-bar">
              <div className="search-input-wrapper">
                <Search className="search-icon" size={20} />
                <input type="text" placeholder="What type of care?" aria-label="Search for care services" />
              </div>
              <motion.button 
                className="btn-signup"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Sign up
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="hero-curve">
        <svg viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path 
            fill="#ffffff" 
            fillOpacity="1" 
            d="M0,160 C240,280 480,280 720,280 C960,280 1200,280 1440,160 L1440,320 L0,320 Z"
          ></path>
        </svg>
      </div>
    </section>
  );
};

export default Hero;
