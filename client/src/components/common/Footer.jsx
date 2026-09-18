import React from 'react';
import { Link } from 'react-router-dom';
import { Hotel, Heart, Globe, Shield, Award } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="main-footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Col */}
          <div className="footer-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  background: 'var(--color-accent-gradient)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff'
                }}
              >
                <Hotel size={18} />
              </div>
              <h3 style={{ margin: 0, letterSpacing: '-0.02em' }}>Stayzio</h3>
            </div>
            <p>
              Curating exceptional hotel stays and architectural retreats across the world's most captivating destinations.
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem', color: '#64748b' }}>
              <Globe size={18} />
              <Shield size={18} />
              <Award size={18} />
            </div>
          </div>

          {/* Col 1 */}
          <div className="footer-col">
            <h4>Explore Destinations</h4>
            <ul className="footer-links">
              <li><Link to="/hotels?destination=New+York">New York City</Link></li>
              <li><Link to="/hotels?destination=Paris">Paris, France</Link></li>
              <li><Link to="/hotels?destination=Tokyo">Tokyo, Japan</Link></li>
              <li><Link to="/hotels?destination=London">London, UK</Link></li>
              <li><Link to="/hotels?destination=Bali">Bali, Indonesia</Link></li>
            </ul>
          </div>

          {/* Col 2 */}
          <div className="footer-col">
            <h4>Platform</h4>
            <ul className="footer-links">
              <li><Link to="/hotels">All Accommodations</Link></li>
              <li><Link to="/about">About Stayzio</Link></li>
              <li><Link to="/contact">Support & Help</Link></li>
              <li><Link to="/dashboard">Guest Dashboard</Link></li>
              <li><Link to="/admin/login">Management Portal</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="footer-col">
            <h4>Security & Trust</h4>
            <ul className="footer-links">
              <li><span style={{ color: '#94a3b8' }}>Best Rate Guarantee</span></li>
              <li><span style={{ color: '#94a3b8' }}>Verified Guest Reviews</span></li>
              <li><span style={{ color: '#94a3b8' }}>SSL 256-bit Encryption</span></li>
              <li><span style={{ color: '#94a3b8' }}>Flexible Cancellation</span></li>
              <li><span style={{ color: '#94a3b8' }}>Privacy Policy</span></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div>
            &copy; {new Date().getFullYear()} Stayzio Inc. All rights reserved. Crafted for excellence.
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <span>Terms of Service</span>
            <span>Cookie Settings</span>
            <span>Accessibility</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
