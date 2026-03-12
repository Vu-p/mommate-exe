import { motion } from 'framer-motion';
import Input from '../common/Input';
import './SignUpForm.css';

interface SignUpFormProps {
  onToggle?: () => void;
}

const SignUpForm = ({ onToggle }: SignUpFormProps) => {
  return (
    <div className="signup-form-container">
      <h2 className="form-title">Create your Account</h2>
      
      <form className="signup-form">
        <Input 
          label="Email" 
          type="email" 
          placeholder="example@email.com" 
        />
        <Input 
          label="Password" 
          type="password" 
          placeholder="Min 8 characters" 
        />
        <Input 
          label="Confirm password" 
          type="password" 
          placeholder="Confirm your password" 
        />
        
        <motion.button 
          className="submit-btn"
          whileHover={{ scale: 1.02, backgroundColor: 'var(--primary-dark)' }}
          whileTap={{ scale: 0.98 }}
          type="button"
        >
          Sign up
        </motion.button>

        <p className="toggle-auth-text">
          Already have an account? <button type="button" onClick={onToggle} className="toggle-btn">Log in</button>
        </p>
      </form>
    </div>
  );
};

export default SignUpForm;
