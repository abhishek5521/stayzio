import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Hotel,
  Compass,
  Heart,
  CalendarCheck,
  User,
  Star,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className={`header-navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container navbar-inner">
        {/* Brand Logo */}
        <Link to="/" className="brand-logo">
          <div className="brand-icon">
            <Hotel size={20} strokeWidth={2.5} />
          </div>
          <span>Stayzio</span>
        </Link>

        {/* Desktop Navigation */}
        <nav>
          <ul className="nav-menu">
            <li>
              <Link to="/hotels" className={`nav-link ${location.pathname === '/hotels' ? 'active' : ''}`}>
                <Compass size={16} /> Explore Hotels
              </Link>
            </li>
            <li>
              <Link to="/about" className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}>
                About
              </Link>
            </li>
            <li>
              <Link to="/contact" className={`nav-link ${location.pathname === '/contact' ? 'active' : ''}`}>
                Contact
              </Link>
            </li>
            {isAdmin && (
              <li>
                <Link
                  to="/admin"
                  className="badge badge-gold"
                  style={{ textDecoration: 'none', padding: '0.35rem 0.75rem' }}
                >
                  <ShieldAlert size={14} /> Admin Portal
                </Link>
              </li>
            )}
          </ul>
        </nav>

        {/* User Auth Actions */}
        <div className="nav-actions">
          {isAuthenticated ? (
            <div className="nav-user-dropdown" ref={dropdownRef}>
              <button
                className="user-avatar-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-expanded={dropdownOpen}
              >
                <img
                  src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                  alt={user?.name}
                  className="user-avatar-img"
                />
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user?.name?.split(' ')[0]}</span>
                <ChevronDown size={14} color="var(--color-text-muted)" />
              </button>

              {dropdownOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <div className="dropdown-user-name">{user?.name}</div>
                    <div className="dropdown-user-email">{user?.email}</div>
                  </div>

                  <Link to="/dashboard" className="dropdown-item">
                    <User size={16} /> User Dashboard
                  </Link>
                  <Link to="/my-bookings" className="dropdown-item">
                    <CalendarCheck size={16} /> My Reservations
                  </Link>
                  <Link to="/favorites" className="dropdown-item">
                    <Heart size={16} /> Saved Hotels
                  </Link>
                  <Link to="/profile" className="dropdown-item">
                    <User size={16} /> Account Profile
                  </Link>
                  <Link to="/reviews" className="dropdown-item">
                    <Star size={16} /> My Reviews
                  </Link>

                  {isAdmin && (
                    <>
                      <div className="dropdown-divider"></div>
                      <Link to="/admin" className="dropdown-item" style={{ color: 'var(--color-accent)' }}>
                        <ShieldAlert size={16} /> Admin Dashboard
                      </Link>
                    </>
                  )}

                  <div className="dropdown-divider"></div>
                  <button onClick={handleLogout} className="dropdown-item" style={{ color: 'var(--color-danger)' }}>
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Link to="/login" className="btn btn-ghost btn-sm">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </div>
          )}

          {/* Mobile menu hamburger */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            background: 'var(--color-surface)',
            borderBottom: '1px solid var(--color-border)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          <Link to="/hotels" className="nav-link">
            <Compass size={18} /> Explore Hotels
          </Link>
          <Link to="/about" className="nav-link">
            About Stayzio
          </Link>
          <Link to="/contact" className="nav-link">
            Contact Us
          </Link>

          {isAuthenticated ? (
            <>
              <div className="dropdown-divider"></div>
              <Link to="/dashboard" className="nav-link">
                <User size={18} /> Dashboard
              </Link>
              <Link to="/my-bookings" className="nav-link">
                <CalendarCheck size={18} /> My Bookings
              </Link>
              <Link to="/favorites" className="nav-link">
                <Heart size={18} /> Favorites
              </Link>
              {isAdmin && (
                <Link to="/admin" className="nav-link" style={{ color: 'var(--color-accent)' }}>
                  <ShieldAlert size={18} /> Admin Dashboard
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="btn btn-outline btn-sm btn-block"
                style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)', marginTop: '0.5rem' }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <Link to="/login" className="btn btn-secondary btn-block">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary btn-block">
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
