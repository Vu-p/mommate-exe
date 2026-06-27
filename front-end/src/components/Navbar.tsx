import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, FileSignature, LayoutDashboard, LogOut, Menu, User as UserIcon, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import logo from '../assets/images/logo.png';
import './Navbar.css';
import './NavbarAdmin.css';
import NotificationBell from './NotificationBell';

interface NavbarProps {
  currentMode?: 'login' | 'signup';
}

const Navbar = ({ currentMode }: NavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchParams = new URLSearchParams(location.search);
  const activeMode = currentMode || (searchParams.get('mode') as 'login' | 'signup');
  const navClass = (path: string) => {
    const active = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
    return `nav-link${active ? ' is-active' : ''}`;
  };

  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    setMobileOpen(false);
    setAccountOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== 'undefined') {
        const currentScrollY = window.scrollY;
        if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
          setIsVisible(false);
        } else if (currentScrollY < lastScrollY.current) {
          setIsVisible(true);
        }
        lastScrollY.current = currentScrollY;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setAccountOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const accountLinks = user?.role === 'carer'
    ? [
        { to: '/carer/profile', label: 'Hồ sơ chuyên gia', icon: UserIcon },
        { to: '/carer/bookings', label: 'Lịch chăm sóc', icon: LayoutDashboard },
        { to: '/carer/contract', label: 'Hợp đồng của tôi', icon: FileSignature },
      ]
    : [
        { to: '/account/profile', label: 'Hồ sơ cá nhân', icon: UserIcon },
        { to: '/account/request', label: 'Lịch đặt của tôi', icon: LayoutDashboard },
      ];

  return (
    <>
      <nav className={`navbar scrolled ${isVisible ? '' : 'hidden-nav'}`}>
        <div className="navbar-main">
          <div className="container navbar-content">
            <div className="nav-group left">
              <Link to="/" className="brand-logo">
                <img src={logo} alt="MomMate" className="logo-img" />
                <span>Mommate</span>
              </Link>
            </div>

            <div className="nav-group center desktop-only">
              <Link to="/" className={navClass('/')}>Trang chủ</Link>
              <Link to="/about" className={navClass('/about')}>Về chúng tôi</Link>
              <Link to="/services" className={navClass('/services')}>Dịch vụ</Link>
              <Link to="/carers" className={navClass('/carers')}>Người chăm sóc</Link>
              {user && user.role === 'parent' && <Link to="/account/request" className={navClass('/account/request')}>Đơn đặt</Link>}
              {user && user.role === 'parent' && <Link to="/account/profile" className={navClass('/account/profile')}>Hồ sơ chăm sóc</Link>}
            </div>

            <div className="nav-group right desktop-only">
              {user ? (
                <div className="user-profile-nav" ref={dropdownRef}>
                  <NotificationBell />
                  <button className="user-dropdown-toggle" onClick={() => setAccountOpen(!accountOpen)}>
                    <span className="user-avatar"><UserIcon size={18} /></span>
                    <span className="user-name">{user.firstName} {user.lastName}</span>
                    <ChevronDown size={16} className={accountOpen ? 'rotate' : ''} />
                  </button>
                  <AnimatePresence>
                    {accountOpen && (
                      <motion.div className="user-dropdown-menu" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                        {accountLinks.map(({ to, label, icon: Icon }) => (
                          <Link key={to} to={to} className="dropdown-item"><Icon size={16} />{label}</Link>
                        ))}
                        <button className="dropdown-item logout" onClick={handleLogout}><LogOut size={16} />Đăng xuất</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <button className={`auth-btn-nav ${activeMode === 'login' ? 'primary' : 'link'}`} onClick={() => navigate('/login')}>Đăng nhập</button>
                  <button className={`auth-btn-nav ${activeMode === 'signup' ? 'primary' : 'link'}`} onClick={() => navigate('/signup')}>Đăng ký</button>
                </>
              )}
            </div>

            <button className="mobile-menu-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Mở menu">
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div className="mobile-menu-overlay" initial={{ opacity: 0, x: '100%' }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: '100%' }}>
            <div className="mobile-menu-content">
              <div className="mobile-nav-links">
                <Link to="/" className="mobile-nav-link">Trang chủ</Link>
                <Link to="/about" className="mobile-nav-link">Về chúng tôi</Link>
                <Link to="/services" className="mobile-nav-link">Dịch vụ</Link>
                <Link to="/carers" className="mobile-nav-link">Người chăm sóc</Link>
                {user && user.role === 'parent' && <Link to="/account/request" className="mobile-nav-link">Đơn đặt</Link>}
                {user && user.role === 'parent' && <Link to="/account/profile" className="mobile-nav-link">Hồ sơ chăm sóc</Link>}
              </div>
              <div className="mobile-auth-actions">
                {user ? (
                  <>
                    {accountLinks.map(({ to, label }) => <button key={to} className="mobile-auth-btn secondary" onClick={() => navigate(to)}>{label}</button>)}
                    <button className="mobile-auth-btn secondary logout" onClick={handleLogout}>Đăng xuất</button>
                  </>
                ) : (
                  <>
                    <button className="mobile-auth-btn secondary" onClick={() => navigate('/login')}>Đăng nhập</button>
                    <button className="mobile-auth-btn primary" onClick={() => navigate('/signup')}>Đăng ký</button>
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
