import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import Input from '../common/Input.js';
import './LoginForm.css';
import { useAuth } from '../../context/AuthContext.js';
import api from '../../utils/api.js';
import { isAdminApp, redirectToAdminApp } from '../../config/appMode.js';

interface LoginFormProps {
  onToggle?: () => void;
}

const LoginForm = ({ onToggle }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setIsSubmitting(true);

    try {
      const { data } = await api.post('/auth/login', { email, password });

      if (isAdminApp && data.role !== 'admin') {
        setError('Tài khoản này không có quyền truy cập trang quản trị.');
        return;
      }

      if (!isAdminApp && data.role === 'admin') {
        if (!redirectToAdminApp()) {
          setError('Tài khoản admin cần đăng nhập tại trang quản trị.');
        }
        return;
      }

      login(data);

      if (isAdminApp && data.role === 'admin') {
        navigate('/admin/dashboard');
        return;
      }
      if (data.role === 'carer' && data.mustChangePassword) {
        navigate('/change-password');
        return;
      }
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setNotice('');

    try {
      await api.post('/auth/forgot-password', { email });
      setNotice('Nếu email tồn tại, MomMate sẽ gửi hướng dẫn đặt lại mật khẩu.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể gửi yêu cầu đặt lại mật khẩu.');
    }
  };

  return (
    <div className="login-form-container">
      <h2 className="form-title">Đăng nhập tài khoản</h2>

      <form className="login-form" onSubmit={handleSubmit}>
        {error && <p className="auth-message error-message">{error}</p>}
        {notice && <p className="auth-message success-message">{notice}</p>}

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Mật khẩu"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          endAdornment={
            <button
              type="button"
              className="input-icon-button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />

        <div className="form-options">
          <label className="checkbox-container">
            <input type="checkbox" />
            <span className="checkmark"></span>
            Nhớ mật khẩu
          </label>
          <button type="button" className="forgot-password" onClick={handleForgotPassword}>
            Quên mật khẩu?
          </button>
        </div>

        <div className="auth-submit-row">
          <motion.button
            className="submit-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Đang đăng nhập...' : 'Log in'}
          </motion.button>
        </div>

        <p className="toggle-auth-text">
          Chưa có tài khoản? <button type="button" onClick={onToggle}>Đăng kí</button>
        </p>
      </form>
    </div>
  );
};

export default LoginForm;
