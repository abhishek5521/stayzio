import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, Heart, User, Sparkles, MapPin, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { bookingService } from '../../services/bookingService';
import { hotelService } from '../../services/hotelService';
import { formatINR } from '../../utils/currency';

const UserDashboard = () => {
  const { user } = useAuth();
  const [upcomingBooking, setUpcomingBooking] = useState(null);
  const [bookingsCount, setBookingsCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [bookingsRes, favsRes] = await Promise.all([
          bookingService.getMyBookings({ limit: 10 }),
          hotelService.getFavorites()
        ]);

        if (bookingsRes.success) {
          const all = bookingsRes.data.bookings || [];
          setBookingsCount(bookingsRes.data.pagination?.total || all.length);
          const upcoming = all.find(
            (b) => b.status === 'confirmed' && new Date(b.checkIn) >= new Date()
          );
          setUpcomingBooking(upcoming || all[0] || null);
        }

        if (favsRes.success) {
          setFavoritesCount(favsRes.data.favorites?.length || 0);
        }
      } catch (err) {
        console.error('Failed to load user dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 5rem 1.5rem' }}>
      {/* Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '2.5rem',
          color: '#ffffff',
          marginBottom: '2.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
            alt={user?.name}
            style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255, 255, 255, 0.2)' }}
          />
          <div>
            <div className="badge badge-gold" style={{ marginBottom: '0.4rem' }}>
              <Sparkles size={12} /> Stayzio Member
            </div>
            <h1 style={{ color: '#ffffff', fontSize: '1.85rem', margin: 0 }}>
              Hello, {user?.name}
            </h1>
            <p style={{ color: '#94a3b8', margin: '0.2rem 0 0 0', fontSize: '0.92rem' }}>
              {user?.email} &bull; Member since {new Date(user?.createdAt || Date.now()).getFullYear()}
            </p>
          </div>
        </div>

        <Link to="/hotels" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
          Explore Stays
        </Link>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <Link to="/my-bookings" className="card" style={{ padding: '1.5rem', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Reservations
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'var(--color-accent-light)', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CalendarCheck size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)' }}>
            {bookingsCount}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-accent)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            View booking history &rarr;
          </div>
        </Link>

        <Link to="/favorites" className="card" style={{ padding: '1.5rem', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Saved Hotels
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'var(--color-danger-light)', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)' }}>
            {favoritesCount}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-danger)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            View wishlist &rarr;
          </div>
        </Link>

        <Link to="/profile" className="card" style={{ padding: '1.5rem', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Profile Settings
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: '#f1f5f9', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
            Account Security
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            Update contact info & pass &rarr;
          </div>
        </Link>
      </div>

      {/* Featured Upcoming Stay */}
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.25rem' }}>Next Upcoming Stay</h2>
      {upcomingBooking ? (
        <div
          className="card"
          style={{
            display: 'grid',
            gridTemplateColumns: '320px 1fr auto',
            gap: '2rem',
            padding: '1.5rem',
            alignItems: 'center'
          }}
        >
          <img
            src={upcomingBooking.hotel?.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80'}
            alt={upcomingBooking.hotel?.name}
            style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
          />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <span className={`badge badge-${upcomingBooking.status === 'confirmed' ? 'success' : 'neutral'}`}>
                {upcomingBooking.status}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Ref: {upcomingBooking.bookingReference}
              </span>
            </div>

            <h3 style={{ fontSize: '1.35rem', marginBottom: '0.35rem' }}>{upcomingBooking.hotel?.name}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
              <MapPin size={15} color="var(--color-accent)" />
              <span>{upcomingBooking.hotel?.address}, {upcomingBooking.hotel?.city}, {upcomingBooking.hotel?.country}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', background: '#f8fafc', padding: '0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Check-in</span>
                <strong>{new Date(upcomingBooking.checkIn).toLocaleDateString()}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Check-out</span>
                <strong>{new Date(upcomingBooking.checkOut).toLocaleDateString()}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Room</span>
                <strong>{upcomingBooking.room?.name || 'Deluxe Room'}</strong>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right', borderLeft: '1px solid var(--color-border)', paddingLeft: '2rem' }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Total Amount</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '1rem' }}>
              {formatINR(upcomingBooking.totalPrice)}
            </div>
            <Link to="/my-bookings" className="btn btn-secondary btn-sm">
              Manage Reservation
            </Link>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
            You have no upcoming hotel reservations scheduled.
          </p>
          <Link to="/hotels" className="btn btn-primary btn-sm">
            Find Your Next Stay
          </Link>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
