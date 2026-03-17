import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User as UserIcon, LogOut, ChevronDown, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import logo from '../assets/images/logo.png';
import './Navbar.css';
import './NavbarAdmin.css';

interface NavbarProps {
  currentMode?: 'login' | 'signup';
}

const Navbar = ({ currentMode }: NavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const { user, logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      if (isMobileMenuOpen) return; // Don't hide navbar if mobile menu is open
      
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY.current;

      // Show/hide based on scroll direction
      if (scrollDelta > 8 && currentScrollY > 100) {
        setIsVisible(false);
      } else if (scrollDelta < -5) {
        setIsVisible(true);
      }

      // Solid background after 80px
      setIsScrolled(currentScrollY > 80);
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const searchParams = new URLSearchParams(location.search);
  const activeMode = currentMode || (searchParams.get('mode') as 'login' | 'signup');

  const toggleAuth = (mode: 'login' | 'signup') => {
    setIsMobileMenuOpen(false);
    navigate(`/auth?mode=${mode}`);
  };

  const isLanding = location.pathname === '/';
  const isTransparent = isLanding && !isScrolled && !isMobileMenuOpen;

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.nav
            className={`navbar ${isTransparent ? 'transparent' : 'solid'} ${isMobileMenuOpen ? 'menu-open' : ''}`}
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="container navbar-content">
              <div className="nav-group left desktop-only">
                <Link to="/" className="nav-link">Home</Link>
                <a href="#contact" className="nav-link">Contact us</a>
              </div>

              <div className="nav-group center">
                <Link to="/" className="brand-logo" onClick={() => setIsMobileMenuOpen(false)}>
                  <img src={logo} alt="Mommate" className="logo-img" />
                  Mommate
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
                        <UserIcon size={20} />
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
                          {user.role === 'admin' && (
                            <Link to="/admin" className="dropdown-item admin-link" onClick={() => setIsUserDropdownOpen(false)}>
                              <LayoutDashboard size={16} /> Admin Panel
                            </Link>
                          )}
                          <Link to="/account/request" className="dropdown-item">
                            <UserIcon size={16} /> Dashboard
                          </Link>
                          <button 
                            className="dropdown-item logout" 
                            onClick={() => {
                              logout();
                              setIsUserDropdownOpen(false);
                              navigate('/');
                            }}
                          >
                            <LogOut size={16} /> Log out
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <>
                    <motion.button
                      className={`auth-btn-nav ${activeMode === 'login' ? 'primary' : 'link'}`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleAuth('login')}
                    >
                      Log in
                    </motion.button>
                    <motion.button
                      className={`auth-btn-nav ${activeMode === 'signup' || (!activeMode && isLanding) ? 'primary' : 'link'}`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleAuth('signup')}
                    >
                      Sign Up
                    </motion.button>
                  </>
                )}
              </div>

              <button 
                className="mobile-menu-toggle" 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
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
                <Link to="/" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
                <a href="#about" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>About Account</a>
                <a href="#contact" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Contact Us</a>
              </div>
              
              <div className="mobile-auth-actions">
                {user ? (
                  <div className="mobile-user-info">
                    <div className="user-profile-info">
                      <div className="user-avatar-large">
                        <UserIcon size={32} />
                      </div>
                      <div className="user-text-info">
                        <span className="user-full-name">{user.firstName} {user.lastName}</span>
                        <span className="user-email">{user.email}</span>
                      </div>
                    </div>
                    <button 
                      className="mobile-auth-btn primary" 
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        navigate('/account/request');
                      }}
                    >
                      Dashboard
                    </button>
                    <button 
                      className="mobile-auth-btn secondary logout" 
                      onClick={() => {
                        logout();
                        setIsMobileMenuOpen(false);
                        navigate('/');
                      }}
                    >
                      Log Out
                    </button>
                  </div>
                ) : (
                  <>
                    <button className="mobile-auth-btn secondary" onClick={() => toggleAuth('login')}>Log In</button>
                    <button className="mobile-auth-btn primary" onClick={() => toggleAuth('signup')}>Create Account</button>
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
