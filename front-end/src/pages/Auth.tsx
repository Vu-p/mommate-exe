import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BriefcaseMedical } from 'lucide-react';
import SignUpForm from '../components/auth/SignUpForm.tsx';
import LoginForm from '../components/auth/LoginForm.tsx';
import SocialLogins from '../components/auth/SocialLogins.tsx';
import logo from '../assets/images/logo.png';
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
      <main className="auth-main">
          <motion.div 
            className="auth-panel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            layout
          >
            <div className="auth-image-side" aria-hidden="true">
              <div className="auth-visual-copy">
                <h1>Chăm sóc mẹ bầu mà bạn có thể tin tưởng.</h1>
                <p>Tham gia cộng đồng tìm kiếm sự hỗ trợ chuyên nghiệp hoàn hảo cho hành trình làm mẹ.</p>
              </div>
            </div>
            
            <div className="auth-form-side">
              <div className="auth-brand"><img src={logo} alt="" /><strong>Mommate</strong></div>
              <div className="auth-tabs">
                <button className={isLogin ? 'active' : ''} onClick={toggleToLogin}>Đăng nhập</button>
                <button className={!isLogin ? 'active' : ''} onClick={toggleToSignup}>Đăng ký</button>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  className="auth-form-motion"
                  key={isLogin ? 'login' : 'signup'}
                  initial={{ opacity: 0, x: isLogin ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isLogin ? -20 : 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="auth-form-intro">
                    <h2>{isLogin ? 'Chào mừng quay trở lại' : 'Tạo tài khoản MaternalCare'}</h2>
                    <p>{isLogin ? 'Nhập thông tin của bạn để truy cập bảng điều khiển chăm sóc.' : 'Tìm kiếm sự hỗ trợ chuyên nghiệp mà gia đình bạn xứng đáng có được.'}</p>
                  </div>
                  {!isAdminApp && <SocialLogins isLogin={isLogin} />}
                  {isLogin ? (
                    <LoginForm onToggle={toggleToSignup} />
                  ) : (
                    <SignUpForm onToggle={toggleToLogin} />
                  )}
                </motion.div>
              </AnimatePresence>
              {!isAdminApp && (
                <>
                  <aside className="auth-expert-card">
                    <BriefcaseMedical aria-hidden="true" />
                    <span><strong>Bạn là Chuyên gia?</strong><small>Truy cập cổng thông tin chuyên gia</small></span>
                    <a href="/carer/login">Đăng nhập cho<br />Chuyên gia →</a>
                  </aside>
                  <p className="auth-copyright">© 2024 Dịch vụ Chuyên nghiệp MaternalCare. Bảo lưu mọi quyền.</p>
                </>
              )}
            </div>
          </motion.div>
      </main>
    </div>
  );
};

export default Auth;
