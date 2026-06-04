import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, LayoutDashboard, LogOut, Menu, User as UserIcon, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import logo from '../assets/images/logo.png';
import './Navbar.css';
import './NavbarAdmin.css';

interface NavbarProps {
  currentMode?: 'login' | 'signup';
}

const secondaryLinks = [
  { label: 'Về chúng tôi', href: '/#about' },
  { label: 'Tìm dịch vụ', href: '/services' },
  { label: 'Tìm chuyên gia chăm sóc', href: '/carers' },
  { label: 'Cộng đồng', href: '/#community' },
  { label: 'Tin tức & Sự kiện', href: '/#news' },
];

const Navbar = ({ currentMode }: NavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const { user, logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const isLanding = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      if (isMobileMenuOpen) return;

      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY.current;
      const hasScrolled = currentScrollY > 24;

      setIsScrolled(hasScrolled);

      if (isLanding) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      if (scrollDelta > 8 && currentScrollY > 120) {
        setIsVisible(false);
      } else if (scrollDelta < -5) {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLanding, isMobileMenuOpen]);

  useEffect(() => {
    setIsVisible(true);
    setIsMobileMenuOpen(false);
    setIsUserDropdownOpen(false);
  }, [location.pathname, location.search]);

  const searchParams = new URLSearchParams(location.search);
  const activeMode = currentMode || (searchParams.get('mode') as 'login' | 'signup');
  const navbarTone = isLanding ? (isScrolled ? 'scrolled' : 'transparent') : 'scrolled';

  const toggleAuth = (mode: 'login' | 'signup') => {
    setIsMobileMenuOpen(false);
    navigate(`/auth?mode=${mode}`);
  };

  const handleLogout = () => {
    logout();
    setIsUserDropdownOpen(false);
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.nav
            className={`navbar ${isLanding ? 'has-secondary' : ''} ${navbarTone} ${isMobileMenuOpen ? 'menu-open' : ''}`}
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="navbar-main">
              <div className="container navbar-content">
                <div className="nav-group left desktop-only">
                  <Link to="/" className="nav-link">Trang chủ</Link>
                  <a href="#contact" className="nav-link">Liên hệ</a>
                </div>

                <div className="nav-group center">
                  <Link to="/" className="brand-logo">
                    <img src={logo} alt="Mommate" className="logo-img" />
                    <span>Mommate</span>
                  </Link>
                </div>

                <div className="nav-group right desktop-only">
                  {user ? (
                    <div className="user-profile-nav" ref={dropdownRef}>
                      <button
                        className="user-dropdown-toggle"
                        onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                      >
                        <div className="user-avatar">
                          <UserIcon size={18} />
                        </div>
                        <span className="user-name">{user.firstName}</span>
                        <ChevronDown size={16} className={isUserDropdownOpen ? 'rotate' : ''} />
                      </button>

                      <AnimatePresence>
                        {isUserDropdownOpen && (
                          <motion.div
                            className="user-dropdown-menu"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                          >
                            <Link to="/account/profile" className="dropdown-item">
                              <UserIcon size={16} /> Hồ sơ cá nhân
                            </Link>
                            {user.role === 'admin' && (
                              <Link to="/admin" className="dropdown-item admin-link">
                                <LayoutDashboard size={16} /> Admin Panel
                              </Link>
                            )}
                            <Link to="/account/request" className="dropdown-item">
                              <UserIcon size={16} /> Bảng điều khiển
                            </Link>
                            <button className="dropdown-item logout" onClick={handleLogout}>
                              <LogOut size={16} /> Đăng xuất
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <>
                      <button
                        className={`auth-btn-nav ${activeMode === 'login' ? 'primary' : 'link'}`}
                        onClick={() => toggleAuth('login')}
                      >
                        Đăng nhập
                      </button>
                      <button
                        className={`auth-btn-nav ${activeMode === 'signup' || (!activeMode && isLanding) ? 'primary' : 'link'}`}
                        onClick={() => toggleAuth('signup')}
                      >
                        Đăng kí
                      </button>
                    </>
                  )}
                </div>

                <button
                  className="mobile-menu-toggle"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label="Toggle menu"
                >
                  {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
                </button>
              </div>
            </div>

            {isLanding && (
              <div className="navbar-secondary desktop-only">
                <div className="container navbar-secondary-content">
                  {secondaryLinks.map((link) => (
                    <Link key={link.label} to={link.href} className="secondary-nav-link">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </motion.nav>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="mobile-menu-overlay"
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className="mobile-menu-content">
              <div className="mobile-nav-links">
                <Link to="/" className="mobile-nav-link">Trang chủ</Link>
                <Link to="/services" className="mobile-nav-link">Tìm dịch vụ</Link>
                <Link to="/carers" className="mobile-nav-link">Tìm chuyên gia</Link>
                <a href="#contact" className="mobile-nav-link">Liên hệ</a>
              </div>

              <div className="mobile-auth-actions">
                {user ? (
                  <div className="mobile-user-info">
                    <div className="user-profile-info">
                      <div className="user-avatar-large">
                        <UserIcon size={30} />
                      </div>
                      <div className="user-text-info">
                        <span className="user-full-name">{user.firstName} {user.lastName}</span>
                        <span className="user-email">{user.email}</span>
                      </div>
                    </div>
                    <button className="mobile-auth-btn primary" onClick={() => navigate('/account/request')}>
                      Bảng điều khiển
                    </button>
                    <button className="mobile-auth-btn secondary" onClick={() => navigate('/account/profile')}>
                      Hồ sơ cá nhân
                    </button>
                    <button className="mobile-auth-btn secondary logout" onClick={handleLogout}>
                      Đăng xuất
                    </button>
                  </div>
                ) : (
                  <>
                    <button className="mobile-auth-btn secondary" onClick={() => toggleAuth('login')}>Đăng nhập</button>
                    <button className="mobile-auth-btn primary" onClick={() => toggleAuth('signup')}>Tạo tài khoản</button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
