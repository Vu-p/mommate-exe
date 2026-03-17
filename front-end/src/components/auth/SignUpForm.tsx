import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Input from '../common/Input.js';
import './SignUpForm.css';
import { useAuth } from '../../context/AuthContext.js';
import api from '../../utils/api.js';

interface SignUpFormProps {
  onToggle?: () => void;
}

const SignUpForm = ({ onToggle }: SignUpFormProps) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    setIsSubmitting(true);

    try {
      const { data } = await api.post('/auth/register', {
        firstName,
        lastName,
        email,
        password,
      });
      login(data);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="signup-form-container">
      <h2 className="form-title">Create your Account</h2>
      
      <form className="signup-form" onSubmit={handleSubmit}>
        {error && <p className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input 
            label="First Name" 
            placeholder="John" 
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <Input 
            label="Last Name" 
            placeholder="Doe" 
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>

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
          placeholder="Min 8 characters" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Input 
          label="Confirm password" 
          type="password" 
          placeholder="Confirm your password" 
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        
        <motion.button 
          className="submit-btn"
          whileHover={{ scale: 1.02, backgroundColor: 'var(--primary-dark)' }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating account...' : 'Sign up'}
        </motion.button>

        <p className="toggle-auth-text">
          Already have an account? <button type="button" onClick={onToggle} className="toggle-btn">Log in</button>
        </p>
      </form>
    </div>
  );
};

export default SignUpForm;
