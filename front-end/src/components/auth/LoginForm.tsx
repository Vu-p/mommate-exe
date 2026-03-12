import { motion } from 'framer-motion';
import Input from '../common/Input';
import './LoginForm.css';

interface LoginFormProps {
  onToggle?: () => void;
}

const LoginForm = ({ onToggle }: LoginFormProps) => {
  return (
    <div className="login-form-container">
      <h2 className="form-title">Log in to your Account</h2>
      
      <form className="login-form">
        <Input 
          label="Email" 
          type="email" 
          placeholder="example@email.com" 
        />
        <Input 
          label="Password" 
          type="password" 
          placeholder="Enter your password" 
        />

        <div className="form-options">
          <label className="checkbox-container">
            <input type="checkbox" />
            <span className="checkmark"></span>
            Remember me
          </label>
          <a href="#" className="forgot-password">Forgot password?</a>
        </div>
        
        <motion.button 
          className="submit-btn"
          whileHover={{ scale: 1.02, backgroundColor: 'var(--primary-dark)' }}
          whileTap={{ scale: 0.98 }}
          type="button"
        >
          Log in
        </motion.button>

        <p className="toggle-auth-text">
          Don't have an account? <button type="button" onClick={onToggle} className="toggle-btn">Sign up</button>
        </p>
      </form>
    </div>
  );
};

export default LoginForm;
