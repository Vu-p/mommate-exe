import { useState } from 'react';
import { motion } from 'framer-motion';
import { signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
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
      setError('Google login is not configured yet.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const idToken = await result.user.getIdToken();
      const { data } = await api.post('/auth/firebase-google', { idToken });

      if (!isAdminApp && data.role === 'admin') {
        if (!redirectToAdminApp()) {
          setError('Tai khoan admin can dang nhap tai trang quan tri.');
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
      setError(err.response?.data?.message || 'Khong the dang nhap bang Google. Vui long thu lai.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="social-logins">
      <p className="social-text">{isLogin ? 'Hoac dang nhap voi' : 'Dang ky nhanh voi'}</p>
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
          {isSubmitting ? 'Dang xu ly...' : 'Google'}
        </motion.button>
      </div>
    </div>
  );
};

export default SocialLogins;
