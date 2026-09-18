import React from 'react';
import { Shield, Sparkles, Award, Globe } from 'lucide-react';

const About = () => {
  return (
    <div className="container" style={{ padding: '4rem 1.5rem', maxWidth: '900px' }}>
      <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <div className="badge badge-gold" style={{ marginBottom: '1rem' }}>
          <Sparkles size={14} /> Our Mission & Values
        </div>
        <h1 style={{ fontSize: '2.75rem', marginBottom: '1rem' }}>Redefining Luxury Travel</h1>
        <p style={{ fontSize: '1.15rem', color: 'var(--color-text-muted)', lineHeight: '1.7' }}>
          Stayzio was founded with a singular conviction: booking extraordinary hotel experiences should be as seamless, transparent, and refined as the stays themselves.
        </p>
      </div>

      <div className="card" style={{ padding: '2.5rem', marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>FAANG-Level Architecture & Standards</h2>
        <p style={{ lineHeight: '1.8', color: 'var(--color-text-main)' }}>
          Every component within the Stayzio platform is engineered for uncompromising performance, data integrity, and resilience. Our proprietary booking engine guarantees genuine date-range overlap verification, preventing double-bookings and race conditions at the database level.
        </p>
        <p style={{ lineHeight: '1.8', color: 'var(--color-text-main)' }}>
          With WebGL-powered interactive mapping, real-time pricing synchronization, and zero-compromise security protocols (including bcrypt salted hashing, rate-limiting, and sanitized payloads), we deliver enterprise hospitality technology.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="card" style={{ padding: '1.75rem' }}>
          <Award size={28} color="var(--color-accent)" style={{ marginBottom: '0.75rem' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Curated Excellence</h3>
          <p style={{ fontSize: '0.92rem', color: 'var(--color-text-muted)' }}>
            We personally review every hotel profile, amenities catalog, and room configuration to ensure real-world accuracy.
          </p>
        </div>

        <div className="card" style={{ padding: '1.75rem' }}>
          <Globe size={28} color="var(--color-success)" style={{ marginBottom: '0.75rem' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Global Footprint</h3>
          <p style={{ fontSize: '0.92rem', color: 'var(--color-text-muted)' }}>
            Showcasing the world's most desired destinations—from iconic urban skyline penthouses to serene tropical sanctuaries.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
