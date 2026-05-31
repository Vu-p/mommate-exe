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
      return setError('Mật khẩu không khớp');
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
      setError(err.response?.data?.message || 'Đăng kí thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="signup-form-container">
      <h2 className="form-title">Đăng kí tài khoản</h2>

      <form className="signup-form" onSubmit={handleSubmit}>
        {error && <p className="auth-message error-message">{error}</p>}

        <div className="signup-name-grid">
          <Input
            label="Tên"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <Input
            label="Họ"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Mật khẩu"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Input
          label="Confirm password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <div className="auth-submit-row">
          <motion.button
            className="submit-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Đang tạo...' : 'Đăng kí'}
          </motion.button>
        </div>

        <p className="toggle-auth-text">
          Bạn đã có tài khoản? <button type="button" onClick={onToggle}>Đăng nhập</button>
        </p>
      </form>
    </div>
  );
};

export default SignUpForm;
