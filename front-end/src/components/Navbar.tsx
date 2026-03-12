import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import './Navbar.css';

interface NavbarProps {
  currentMode?: 'login' | 'signup';
}

const Navbar = ({ currentMode }: NavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    return () => window.removeEventListener('scroll', handleScroll);
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
                <a href="#about" className="nav-link">About</a>
                <a href="#contact" className="nav-link">Contact Us</a>
              </div>

              <div className="nav-group center">
                <Link to="/" className="brand-logo" onClick={() => setIsMobileMenuOpen(false)}>
                  Mommate
                </Link>
              </div>

              <div className="nav-group right desktop-only">
                <motion.button
                  className={`auth-btn-nav ${activeMode === 'login' ? 'primary' : 'link'}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleAuth('login')}
                >
                  Log In
                </motion.button>
                <motion.button
                  className={`auth-btn-nav ${activeMode === 'signup' || (!activeMode && isLanding) ? 'primary' : 'link'}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleAuth('signup')}
                >
                  Sign Up
                </motion.button>
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
                <button className="mobile-auth-btn secondary" onClick={() => toggleAuth('login')}>Log In</button>
                <button className="mobile-auth-btn primary" onClick={() => toggleAuth('signup')}>Create Account</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
