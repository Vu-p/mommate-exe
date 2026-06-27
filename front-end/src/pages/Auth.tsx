import { useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, BriefcaseMedical, HeartHandshake, ShieldCheck, Sparkles } from 'lucide-react';
import SignUpForm from '../components/auth/SignUpForm.tsx';
import LoginForm from '../components/auth/LoginForm.tsx';
import SocialLogins from '../components/auth/SocialLogins.tsx';
import logo from '../assets/images/logo.png';
import './Auth.css';
import { useAuth } from '../context/AuthContext.tsx';
import { isAdminApp, openAdminArea } from '../config/appMode.ts';

interface AuthProps {
  defaultMode?: 'login' | 'signup';
}

const Auth = ({ defaultMode = 'signup' }: AuthProps) => {
  const [searchParams] = useSearchParams();
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
      if (user.role === 'admin') {
        openAdminArea(navigate);
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
          className="auth-layout"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
        >
          <section className="auth-editorial">
            {!isAdminApp && (
              <Link to="/" className="auth-back-home">
                <ArrowLeft size={16} /> Quay lại trang chủ
              </Link>
            )}
            <div className="auth-brand">
              <img src={logo} alt="" />
              <strong>MomMate</strong>
            </div>
            <span className="auth-kicker">Bắt đầu thật nhẹ nhàng</span>
            <h1>Được chăm sóc theo cách đủ dịu dàng cho giai đoạn sau sinh.</h1>
            <p>MomMate kết nối bạn với chuyên gia chăm sóc đáng tin cậy, để từng bước trong hành trình này trở nên rõ ràng, yên tâm và riêng tư hơn.</p>

            <div className="auth-values">
              <article>
                <ShieldCheck size={18} />
                <div>
                  <strong>Xác minh rõ ràng</strong>
                  <span>Hồ sơ, kinh nghiệm và lịch làm việc đều minh bạch.</span>
                </div>
              </article>
              <article>
                <HeartHandshake size={18} />
                <div>
                  <strong>Hỗ trợ tinh tế</strong>
                  <span>Chọn đúng người cho đúng giai đoạn và đúng nhu cầu.</span>
                </div>
              </article>
              <article>
                <Sparkles size={18} />
                <div>
                  <strong>Trải nghiệm mềm</strong>
                  <span>Không áp lực, không nhiễu, chỉ còn lại sự an tâm.</span>
                </div>
              </article>
            </div>

            <div className="auth-illustration" aria-hidden="true">
              <div className="auth-orb auth-orb-a" />
              <div className="auth-orb auth-orb-b" />
              <div className="auth-portrait">
                <span>
                  <BriefcaseMedical size={16} />
                  Chăm sóc sau sinh
                </span>
                <strong>MomMate</strong>
                <p>Dẫn bạn vào một trải nghiệm chăm sóc yên tĩnh, rõ ràng, và đủ nâng đỡ.</p>
              </div>
            </div>
          </section>

          <section className="auth-form-shell">
            <div className="auth-form-panel">
              <div className="auth-mode-switch">
                <button className={isLogin ? 'active' : ''} onClick={toggleToLogin}>Đăng nhập</button>
                <button className={!isLogin ? 'active' : ''} onClick={toggleToSignup}>Đăng ký</button>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  className="auth-form-motion"
                  key={isLogin ? 'login' : 'signup'}
                  initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -18, filter: 'blur(8px)' }}
                  transition={{ duration: 0.45 }}
                >
                  <div className="auth-form-intro">
                    <h2>{isLogin ? 'Chào mừng quay trở lại' : 'Bắt đầu với MomMate'}</h2>
                    <p>{isLogin ? 'Đăng nhập để tiếp tục hành trình chăm sóc của bạn.' : 'Tạo tài khoản để mở cánh cửa cho một trải nghiệm chăm sóc an tâm hơn.'}</p>
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
                    <a href="/login">Đăng nhập cho<br />Chuyên gia <ArrowRight size={16} /></a>
                  </aside>
                  <p className="auth-copyright">© 2026 MomMate. Tất cả quyền được bảo lưu.</p>
                </>
              )}
            </div>
          </section>
        </motion.div>
      </main>
    </div>
  );
};

export default Auth;
