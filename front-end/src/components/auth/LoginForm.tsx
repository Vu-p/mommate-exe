import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Input from '../common/Input.js';
import './LoginForm.css';
import { useAuth } from '../../context/AuthContext.js';
import api from '../../utils/api.js';

interface LoginFormProps {
  onToggle?: () => void;
}

const LoginForm = ({ onToggle }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-form-container">
      <h2 className="form-title">Log in to your Account</h2>
      
      <form className="login-form" onSubmit={handleSubmit}>
        {error && <p className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}
        <Input 
          label="Email" 
          type="email" 
          placeholder="example@email.com" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input 
          label="Password" 
          type="password" 
          placeholder="Enter your password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
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
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Logging in...' : 'Log in'}
        </motion.button>

        <p className="toggle-auth-text">
          Don't have an account? <button type="button" onClick={onToggle} className="toggle-btn">Sign up</button>
        </p>
      </form>
    </div>
  );
};

export default LoginForm;
