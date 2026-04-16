import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Navbar.module.css';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'What we do', path: '/services' },
    { name: 'Packages', path: '/packages' },
    { name: 'About us', path: '/about-us' },
    { name: 'Our work', path: '/our-work' },
    { name: 'Blogs', path: '/blog' },
  ];

  return (
    <nav className={`${styles.navbar} ${styles.transparent}`}>
      <div className={styles.container}>
        <div className={styles.navContent}>
          {/* Logo */}
          <Link to="/" className={styles.logo}>
            <img
              src="/assets/backgrounds/logo.webp"
              alt="XAEON"
              className={styles.logoImage}
            />
          </Link>

          {/* Desktop Navigation */}
          <div className={styles.desktopNav}>
            <div className={styles.navLinksGroup}>
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`${styles.navLink} ${
                    location.pathname === item.path ? styles.active : ''
                  }`}
                >
                  {item.name}
                  {location.pathname === item.path && (
                    <motion.div
                      layoutId="activeTab"
                      className={styles.activeIndicator}
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              ))}
            </div>

            <div className={styles.navActions}>
              {user?.role === 'user' ? (
                <Link
                  to="/dashboard"
                  className={`${styles.actionLink} ${styles.loginLink}`}
                >
                  My dashboard
                </Link>
              ) : user?.role === 'admin' ? (
                <Link to="/admin" className={`${styles.actionLink} ${styles.loginLink}`}>
                  Admin
                </Link>
              ) : (
                <Link to="/login" className={`${styles.actionLink} ${styles.loginLink}`}>
                  Log In
                </Link>
              )}
              <Link
                to={user?.role === 'user' ? '/dashboard' : '/book-now'}
                className={`${styles.actionLink} ${styles.bookNowLink}`}
              >
                {user?.role === 'user' ? 'Request' : 'Book Now'}
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={styles.mobileMenuButton}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className={styles.mobileNav}
            >
              <div className={styles.mobileNavContent}>
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`${styles.mobileNavLink} ${
                      location.pathname === item.path ? styles.active : ''
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
                <div className={styles.mobileActionGroup}>
                  {user?.role === 'user' ? (
                    <Link
                      to="/dashboard"
                      onClick={() => setIsOpen(false)}
                      className={`${styles.mobileNavLink} ${styles.mobileLoginLink}`}
                    >
                      My dashboard
                    </Link>
                  ) : user?.role === 'admin' ? (
                    <Link
                      to="/admin"
                      onClick={() => setIsOpen(false)}
                      className={`${styles.mobileNavLink} ${styles.mobileLoginLink}`}
                    >
                      Admin
                    </Link>
                  ) : (
                    <Link
                      to="/login"
                      onClick={() => setIsOpen(false)}
                      className={`${styles.mobileNavLink} ${styles.mobileLoginLink}`}
                    >
                      Log In
                    </Link>
                  )}
                  <Link
                    to={user?.role === 'user' ? '/dashboard' : '/book-now'}
                    onClick={() => setIsOpen(false)}
                    className={`${styles.mobileNavLink} ${styles.mobileBookNowLink}`}
                  >
                    {user?.role === 'user' ? 'Request' : 'Book Now'}
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;
