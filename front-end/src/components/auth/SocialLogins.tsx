import { useState } from 'react';
import { motion } from 'framer-motion';
import { signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Apple } from 'lucide-react';
import './SocialLogins.css';
import { useAuth } from '../../context/AuthContext.js';
import api from '../../utils/api.js';
import { firebaseAuth, googleProvider, hasFirebaseConfig } from '../../config/firebase.js';
import { isAdminApp, redirectToAdminApp } from '../../config/appMode.js';

interface SocialLoginsProps {
  isLogin?: boolean;
}

const SocialLogins = ({ isLogin }: SocialLoginsProps) => {
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setError('');

    if (!firebaseAuth || !hasFirebaseConfig) {
      setError('Đăng nhập Google chưa được cấu hình.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const idToken = await result.user.getIdToken();
      const { data } = await api.post('/auth/firebase-google', { idToken });

      if (!isAdminApp && data.role === 'admin') {
        if (!redirectToAdminApp()) {
          setError('Tài khoản admin cần đăng nhập tại trang quản trị.');
        }
        return;
      }

      login(data);

      if (data.role === 'carer' && data.mustChangePassword) {
        navigate('/change-password');
        return;
      }

      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể đăng nhập bằng Google. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="social-logins">
      {error && <p className="social-error">{error}</p>}
      <div className="social-buttons">
        <motion.button
          className="social-btn google"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={handleGoogleLogin}
          disabled={isSubmitting}
        >
          <span className="google-mark">G</span>{isSubmitting ? 'Đang xử lý...' : 'Google'}
        </motion.button>
        <button className="social-btn apple" type="button"><Apple size={18} fill="currentColor" />Apple</button>
      </div>
      <p className="social-text"><span />{isLogin ? 'HOẶC ĐĂNG NHẬP BẰNG EMAIL' : 'HOẶC ĐĂNG KÝ BẰNG EMAIL'}<span /></p>
    </div>
  );
};

export default SocialLogins;
