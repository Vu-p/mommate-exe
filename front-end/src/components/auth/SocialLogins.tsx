import { motion } from 'framer-motion';
import './SocialLogins.css';

interface SocialLoginsProps {
  isLogin?: boolean;
}

const SocialLogins = ({ isLogin }: SocialLoginsProps) => {
  return (
    <div className="social-logins">
      <p className="social-text">{isLogin ? 'Or log in with' : 'Or sign up with'}</p>
      <div className="social-buttons">
        <motion.button 
          className="social-btn google"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          Google
        </motion.button>
        <motion.button 
          className="social-btn facebook"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          facebook
        </motion.button>
      </div>
    </div>
  );
};

export default SocialLogins;
