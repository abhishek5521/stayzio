import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Sparkles } from 'lucide-react';
import { hotelService } from '../../services/hotelService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import HotelCard from '../../components/hotel/HotelCard';
import { HotelCardSkeleton } from '../../components/common/LoadingSkeleton';

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const toast = useToast();

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const res = await hotelService.getFavorites();
      if (res.success) {
        setFavorites(res.data.favorites || []);
      }
    } catch (err) {
      console.error('Failed to load favorites:', err);
      toast.error('Could not load saved hotels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 5rem 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>Saved Properties</h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
          Your personal wishlist of architectural retreats and luxury stays
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {[...Array(3)].map((_, i) => (
            <HotelCardSkeleton key={i} />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
          <Heart size={44} color="var(--color-danger)" style={{ margin: '0 auto 1rem auto' }} />
          <h3>Your wishlist is empty</h3>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            Tap the heart icon on any hotel card to save it here for later.
          </p>
          <Link to="/hotels" className="btn btn-primary">
            Explore Hotels
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {favorites.map((hotel) => (
            <HotelCard key={hotel._id} hotel={hotel} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;
