import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Calendar,
  Users,
  MapPin,
  Sparkles,
  ShieldCheck,
  Award,
  Headphones,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { hotelService } from '../../services/hotelService';
import HotelCard from '../../components/hotel/HotelCard';
import { HotelCardSkeleton } from '../../components/common/LoadingSkeleton';
import { formatINR } from '../../utils/currency';

const Home = () => {
  const navigate = useNavigate();

  // Search state
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const dayAfter = new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10);

  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState(tomorrow);
  const [checkOut, setCheckOut] = useState(dayAfter);
  const [guests, setGuests] = useState(2);

  const [featuredHotels, setFeaturedHotels] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [featuredRes, destsRes] = await Promise.all([
          hotelService.getFeaturedHotels(),
          hotelService.getPopularDestinations()
        ]);

        if (featuredRes.success) setFeaturedHotels(featuredRes.data.hotels || []);
        if (destsRes.success) setDestinations(destsRes.data.destinations || []);
      } catch (err) {
        console.error('Home data load error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const queryParams = new URLSearchParams();
    if (destination.trim()) queryParams.set('destination', destination.trim());
    if (checkIn) queryParams.set('checkIn', checkIn);
    if (checkOut) queryParams.set('checkOut', checkOut);
    if (guests) queryParams.set('guests', guests);

    navigate(`/hotels?${queryParams.toString()}`);
  };

  return (
    <div>
      {/* HERO SECTION */}
      <section
        style={{
          position: 'relative',
          padding: '5rem 0 7rem 0',
          background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          overflow: 'hidden'
        }}
      >
        {/* Subtle background glow */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '800px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(37, 99, 235, 0.25) 0%, rgba(15, 23, 42, 0) 70%)',
            pointerEvents: 'none'
          }}
        ></div>

        <div className="container" style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
          <div
            className="badge badge-gold"
            style={{ marginBottom: '1.25rem', padding: '0.4rem 0.85rem' }}
          >
            <Sparkles size={14} /> The World's Finest Architectural Stays
          </div>

          <h1
            style={{
              color: '#ffffff',
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontWeight: 800,
              maxWidth: '850px',
              margin: '0 auto 1.25rem auto',
              lineHeight: 1.15
            }}
          >
            Discover Extraordinary Stays, Curated for the Discerning Traveler.
          </h1>

          <p
            style={{
              color: '#94a3b8',
              fontSize: '1.15rem',
              maxWidth: '620px',
              margin: '0 auto 3rem auto'
            }}
          >
            From penthouses overlooking Manhattan to sacred rainforest retreats in Bali, reserve verified luxury accommodations worldwide.
          </p>

          {/* HERO SEARCH ENGINE WIDGET */}
          <form
            onSubmit={handleSearch}
            style={{
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-xl)',
              padding: '1rem',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
              display: 'grid',
              gridTemplateColumns: '1.4fr 1fr 1fr 0.8fr auto',
              gap: '0.75rem',
              alignItems: 'center',
              maxWidth: '1050px',
              margin: '0 auto',
              textAlign: 'left'
            }}
          >
            {/* Destination Input */}
            <div style={{ padding: '0.5rem 0.75rem', borderRight: '1px solid var(--color-border)' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  marginBottom: '0.2rem'
                }}
              >
                <MapPin size={13} color="var(--color-accent)" /> Destination
              </label>
              <input
                type="text"
                placeholder="Where to? (e.g. Paris, Tokyo, Bali)"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  fontWeight: 600,
                  color: 'var(--color-primary)',
                  background: 'transparent',
                  fontSize: '0.95rem'
                }}
              />
            </div>

            {/* Check In */}
            <div style={{ padding: '0.5rem 0.75rem', borderRight: '1px solid var(--color-border)' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  marginBottom: '0.2rem'
                }}
              >
                <Calendar size={13} color="var(--color-accent)" /> Check-in
              </label>
              <input
                type="date"
                value={checkIn}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setCheckIn(e.target.value)}
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  fontWeight: 600,
                  color: 'var(--color-primary)',
                  background: 'transparent',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            {/* Check Out */}
            <div style={{ padding: '0.5rem 0.75rem', borderRight: '1px solid var(--color-border)' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  marginBottom: '0.2rem'
                }}
              >
                <Calendar size={13} color="var(--color-accent)" /> Check-out
              </label>
              <input
                type="date"
                value={checkOut}
                min={checkIn}
                onChange={(e) => setCheckOut(e.target.value)}
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  fontWeight: 600,
                  color: 'var(--color-primary)',
                  background: 'transparent',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            {/* Guests */}
            <div style={{ padding: '0.5rem 0.75rem' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  marginBottom: '0.2rem'
                }}
              >
                <Users size={13} color="var(--color-accent)" /> Guests
              </label>
              <select
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  fontWeight: 600,
                  color: 'var(--color-primary)',
                  background: 'transparent',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'Guest' : 'Guests'}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Submit */}
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ padding: '1rem 1.75rem', borderRadius: 'var(--radius-lg)' }}
            >
              <Search size={20} />
              <span>Search</span>
            </button>
          </form>
        </div>
      </section>

      {/* POPULAR DESTINATIONS */}
      <section style={{ padding: '5rem 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
            <div>
              <div className="badge badge-blue" style={{ marginBottom: '0.5rem' }}>
                Featured Destinations
              </div>
              <h2 style={{ fontSize: '2.25rem' }}>Trending Global Escapes</h2>
            </div>
            <button
              onClick={() => navigate('/hotels')}
              className="btn btn-ghost"
              style={{ fontWeight: 700, color: 'var(--color-accent)' }}
            >
              View All Locations <ArrowRight size={16} />
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1.5rem'
            }}
          >
            {destinations.map((dest, idx) => (
              <div
                key={idx}
                onClick={() => navigate(`/hotels?destination=${encodeURIComponent(dest.city)}`)}
                style={{
                  position: 'relative',
                  height: '280px',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'transform var(--transition-fast)'
                }}
                className="destination-card"
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <img
                  src={dest.image}
                  alt={dest.city}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.1) 60%)'
                  }}
                ></div>
                <div style={{ position: 'absolute', bottom: '1.25rem', left: '1.25rem', color: '#ffffff' }}>
                  <h3 style={{ color: '#ffffff', fontSize: '1.35rem', marginBottom: '0.2rem' }}>{dest.city}</h3>
                  <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                    {dest.country} &bull; {dest.hotelCount} {dest.hotelCount === 1 ? 'property' : 'properties'}
                  </div>
                  <div style={{ fontSize: '0.82rem', marginTop: '0.4rem', fontWeight: 700, color: '#f8fafc' }}>
                    From {formatINR(dest.lowestPrice)}/night
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED LUXURY STAYS */}
      <section style={{ padding: '5rem 0', background: '#f1f5f9' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
            <div>
              <div className="badge badge-gold" style={{ marginBottom: '0.5rem' }}>
                Handpicked Collections
              </div>
              <h2 style={{ fontSize: '2.25rem' }}>Highest Rated & Iconic Hotels</h2>
            </div>
            <button
              onClick={() => navigate('/hotels?sort=rating_desc')}
              className="btn btn-ghost"
              style={{ fontWeight: 700, color: 'var(--color-accent)' }}
            >
              Explore Top Rated <ArrowRight size={16} />
            </button>
          </div>

          {loading ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.5rem'
              }}
            >
              {[...Array(4)].map((_, i) => (
                <HotelCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.5rem'
              }}
            >
              {featuredHotels.map((hotel) => (
                <HotelCard key={hotel._id} hotel={hotel} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* WHY CHOOSE STAYZIO */}
      <section style={{ padding: '5rem 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 3.5rem auto' }}>
            <h2 style={{ fontSize: '2.25rem', marginBottom: '0.75rem' }}>The Stayzio Difference</h2>
            <p>Every element of your hospitality experience has been thoughtfully designed for peace of mind.</p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '2rem'
            }}
          >
            {[
              {
                icon: <Award size={28} />,
                title: 'Hand-Curated Properties',
                desc: 'Strict quality criteria. Every hotel is inspected for design, hospitality, and comfort.'
              },
              {
                icon: <ShieldCheck size={28} />,
                title: 'Best Price Guarantee',
                desc: 'Transparent pricing with no hidden fees. If you find a lower rate, we will gladly match it.'
              },
              {
                icon: <CheckCircle size={28} />,
                title: 'Instant Real-Time Confirmation',
                desc: 'Collision-safe date availability and instant guaranteed reservations with unique references.'
              },
              {
                icon: <Headphones size={28} />,
                title: 'Dedicated 24/7 Concierge',
                desc: 'Round-the-clock priority assistance for changes, requests, and destination advice.'
              }
            ].map((feature, i) => (
              <div
                key={i}
                className="card"
                style={{ padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-accent-light)',
                    color: 'var(--color-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.25rem'
                  }}
                >
                  {feature.icon}
                </div>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>{feature.title}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section style={{ padding: '0 0 5rem 0' }}>
        <div className="container">
          <div
            style={{
              background: 'var(--color-accent-gradient)',
              borderRadius: 'var(--radius-xl)',
              padding: '3.5rem 2rem',
              color: '#ffffff',
              textAlign: 'center',
              boxShadow: 'var(--shadow-xl)'
            }}
          >
            <h2 style={{ color: '#ffffff', fontSize: '2.5rem', marginBottom: '1rem' }}>
              Ready to Reserve Your Next Unforgettable Stay?
            </h2>
            <p style={{ color: '#e0f2fe', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
              Explore luxury stays in New York, Paris, Tokyo, London, and Bali with exclusive benefits and guaranteed rates.
            </p>
            <button
              onClick={() => navigate('/hotels')}
              className="btn btn-lg"
              style={{ background: '#ffffff', color: 'var(--color-primary)', fontWeight: 800 }}
            >
              Explore All 10+ Luxury Hotels
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
