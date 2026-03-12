import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './Navbar.css';

interface NavbarProps {
  currentMode?: 'login' | 'signup';
}

const Navbar = ({ currentMode }: NavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY.current;

      // Show/hide based on scroll direction
      if (scrollDelta > 8 && currentScrollY > 100) {
        // Scrolling down (and past 100px) — hide navbar
        setIsVisible(false);
      } else if (scrollDelta < -5) {
        // Scrolling up (even slightly) — show navbar
        setIsVisible(true);
      }

      // Solid background after 80px
      setIsScrolled(currentScrollY > 80);
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const searchParams = new URLSearchParams(location.search);
  const activeMode = currentMode || (searchParams.get('mode') as 'login' | 'signup');

  const toggleAuth = (mode: 'login' | 'signup') => {
    navigate(`/auth?mode=${mode}`);
  };

  const isLanding = location.pathname === '/';
  const isTransparent = isLanding && !isScrolled;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          className={`navbar ${isTransparent ? 'transparent' : 'solid'}`}
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="container navbar-content">
            <div className="nav-group left">
              <Link to="/" className="nav-link">Home</Link>
              <a href="#about" className="nav-link">About</a>
              <a href="#contact" className="nav-link">Contact Us</a>
            </div>

            <div className="nav-group center">
              <Link to="/" className="brand-logo">
                Mommate
              </Link>
            </div>

            <div className="nav-group right">
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
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
};

export default Navbar;
