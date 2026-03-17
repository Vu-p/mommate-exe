import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar.tsx';
import Breadcrumbs from '../components/common/Breadcrumbs.tsx';
import SignUpForm from '../components/auth/SignUpForm.tsx';
import LoginForm from '../components/auth/LoginForm.tsx';
import SocialLogins from '../components/auth/SocialLogins.tsx';
import Footer from '../components/Footer.tsx';
import signupImg from '../assets/images/signup-mock.png';
import './Auth.css';
import { useAuth } from '../context/AuthContext.tsx';

const Auth = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const mode = searchParams.get('mode') || 'signup';
  const isLogin = mode === 'login';

  useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const toggleToLogin = () => setSearchParams({ mode: 'login' });
  const toggleToSignup = () => setSearchParams({ mode: 'signup' });

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: isLogin ? 'Log in' : 'Sign up', href: isLogin ? '/login' : '/signup' }
  ];

  return (
    <div className="auth-page">
      <Navbar currentMode={isLogin ? 'login' : 'signup'} />
      
      <main className="auth-main">
        <Breadcrumbs items={breadcrumbItems} />
        
        <div className="container">
          <motion.div 
            className="auth-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            layout
          >
            <div className="auth-image-side">
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
                  key={isLogin ? 'login' : 'signup'}
                  initial={{ opacity: 0, x: isLogin ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isLogin ? -20 : 20 }}
                  transition={{ duration: 0.3 }}
                  style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
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
