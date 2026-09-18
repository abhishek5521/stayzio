import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MapPin, Sparkles } from 'lucide-react';
import StarRating from '../common/StarRating';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { hotelService } from '../../services/hotelService';
import { formatINR } from '../../utils/currency';

const HotelCard = ({
  hotel,
  isActive = false,
  onMouseEnter = null,
  onMouseLeave = null,
  initialFavorited = false
}) => {
  const { isAuthenticated, user, updateUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const isFavorited = user?.favorites?.some((fav) =>
    typeof fav === 'string' ? fav === hotel._id : fav._id === hotel._id
  );

  const [favLoading, setFavLoading] = useState(false);

  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.info('Please sign in to save favorite hotels');
      navigate('/login');
      return;
    }

    try {
      setFavLoading(true);
      const res = await hotelService.toggleFavorite(hotel._id);
      if (res.success) {
        updateUser({ favorites: res.data.favorites });
        toast.success(res.message);
      }
    } catch (err) {
      toast.error('Failed to update favorites');
    } finally {
      setFavLoading(false);
    }
  };

  return (
    <Link
      to={`/hotels/${hotel._id}`}
      id={`hotel-card-${hotel._id}`}
      className={`hotel-card ${isActive ? 'active-marker' : ''}`}
      onMouseEnter={() => onMouseEnter && onMouseEnter(hotel._id)}
      onMouseLeave={() => onMouseLeave && onMouseLeave()}
    >
      <div className="hotel-card-image-wrap">
        <img
          src={
            hotel.images?.[0] ||
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'
          }
          alt={hotel.name}
          className="hotel-card-image"
          loading="lazy"
        />

        {hotel.featured && (
          <div className="hotel-card-badge">
            <span className="badge badge-gold">
              <Sparkles size={12} /> Featured
            </span>
          </div>
        )}

        <button
          className={`hotel-fav-btn ${isFavorited ? 'is-fav' : ''}`}
          onClick={handleToggleFavorite}
          disabled={favLoading}
          aria-label={isFavorited ? 'Remove from favorites' : 'Save to favorites'}
        >
          <Heart size={18} fill={isFavorited ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="hotel-card-content">
        <div className="hotel-card-location">
          <MapPin size={14} />
          <span>{hotel.city}, {hotel.country}</span>
        </div>

        <h3 className="hotel-card-title">{hotel.name}</h3>

        <div className="hotel-card-rating">
          <StarRating rating={hotel.rating} reviewCount={hotel.reviewCount} size={15} />
        </div>

        {hotel.amenities && hotel.amenities.length > 0 && (
          <div className="hotel-card-amenities">
            {hotel.amenities.slice(0, 3).map((amenity, idx) => (
              <span key={idx} className="amenity-chip">
                {amenity}
              </span>
            ))}
            {hotel.amenities.length > 3 && (
              <span className="amenity-chip">+{hotel.amenities.length - 3}</span>
            )}
          </div>
        )}

        <div className="hotel-card-footer">
          <div className="price-container">
            <span className="price-amount">{formatINR(hotel.priceFrom)}</span>
            <span className="price-period">/ night</span>
          </div>
          <span className="btn btn-outline btn-sm" style={{ pointerEvents: 'none' }}>
            View Details
          </span>
        </div>
      </div>
    </Link>
  );
};

export default HotelCard;
