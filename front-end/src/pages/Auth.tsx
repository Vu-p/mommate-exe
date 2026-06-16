import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar.tsx';
import SignUpForm from '../components/auth/SignUpForm.tsx';
import LoginForm from '../components/auth/LoginForm.tsx';
import SocialLogins from '../components/auth/SocialLogins.tsx';
import Footer from '../components/Footer.tsx';
import signupImg from '../assets/images/signup-mock.png';
import './Auth.css';
import { useAuth } from '../context/AuthContext.tsx';
import { isAdminApp, redirectToAdminApp } from '../config/appMode.ts';

interface AuthProps {
  defaultMode?: 'login' | 'signup';
}

const Auth = ({ defaultMode = 'signup' }: AuthProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const mode = searchParams.get('mode') || defaultMode;
  const isLogin = mode === 'login';

  useEffect(() => {
    if (!loading && user) {
      if (isAdminApp) {
        if (user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          logout();
          navigate('/auth?mode=login');
        }
        return;
      }
      if (user.role === 'admin' && redirectToAdminApp()) {
        return;
      }
      if (user.role === 'carer' && user.mustChangePassword) {
        navigate('/change-password');
        return;
      }
      navigate('/');
    }
  }, [user, loading, navigate, logout]);

  const toggleToLogin = () => navigate('/login');
  const toggleToSignup = () => navigate('/signup');

  return (
    <div className={`auth-page ${isAdminApp ? 'admin-auth-page' : ''}`}>
      <Navbar currentMode={isLogin ? 'login' : 'signup'} />
      
      <main className="auth-main">
        <div className="container">
          <motion.div 
            className="auth-panel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            layout
          >
            <div className="auth-image-side" aria-hidden="true">
              <motion.img 
                key="hero-img"
                src={signupImg} 
                alt="Welcome to Mommate" 
                className="auth-hero-img"
                layout
              />
            </div>
            
            <div className="auth-form-side">
              <AnimatePresence mode="wait">
                <motion.div
                  className="auth-form-motion"
                  key={isLogin ? 'login' : 'signup'}
                  initial={{ opacity: 0, x: isLogin ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isLogin ? -20 : 20 }}
                  transition={{ duration: 0.3 }}
                >
                  {isLogin ? (
                    <LoginForm onToggle={toggleToSignup} />
                  ) : (
                    <SignUpForm onToggle={toggleToLogin} />
                  )}
                  <SocialLogins isLogin={isLogin} />
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Auth;
