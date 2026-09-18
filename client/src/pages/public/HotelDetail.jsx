import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Heart,
  Sparkles,
  Share2,
  Calendar,
  Users,
  CheckCircle,
  Bed,
  Wifi,
  Coffee,
  ShieldCheck,
  Star,
  MessageSquare
} from 'lucide-react';
import { hotelService } from '../../services/hotelService';
import { reviewService } from '../../services/reviewService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import StarRating from '../../components/common/StarRating';
import MapView from '../../components/map/MapView';
import MultiStepBookingModal from '../../components/booking/MultiStepBookingModal';
import { formatINR } from '../../utils/currency';

const HotelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, updateUser } = useAuth();
  const toast = useToast();

  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  // Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState(null);

  // Review Submission State
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const isFavorited = user?.favorites?.some((fav) =>
    typeof fav === 'string' ? fav === id : fav._id === id
  );

  const fetchHotel = async () => {
    try {
      setLoading(true);
      const res = await hotelService.getHotelById(id);
      if (res.success) {
        setHotel(res.data.hotel);
      }
    } catch (err) {
      console.error('Failed to load hotel details:', err);
      toast.error('Could not load hotel information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotel();
  }, [id]);

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      toast.info('Sign in to save favorite hotels');
      navigate('/login');
      return;
    }
    try {
      const res = await hotelService.toggleFavorite(id);
      if (res.success) {
        updateUser({ favorites: res.data.favorites });
        toast.success(res.message);
      }
    } catch (err) {
      toast.error('Failed to update favorites');
    }
  };

  const handleOpenBooking = (room = null) => {
    setSelectedRoomForBooking(room);
    setBookingModalOpen(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info('Please sign in to write a review');
      navigate('/login');
      return;
    }

    if (!newComment.trim() || newComment.length < 5) {
      toast.error('Review must be at least 5 characters long');
      return;
    }

    try {
      setReviewSubmitting(true);
      const res = await reviewService.createReview({
        hotelId: id,
        rating: newRating,
        comment: newComment
      });

      if (res.success) {
        toast.success('Thank you! Your review has been published.');
        setNewComment('');
        fetchHotel(); // Refresh reviews and rating
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <div style={{ fontWeight: 600, color: 'var(--color-accent)' }}>Loading luxury property details...</div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <h2>Property Not Found</h2>
        <button onClick={() => navigate('/hotels')} className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back to Discovery
        </button>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 0 5rem 0' }}>
      {/* Title & Actions Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <span className="badge badge-gold" style={{ textTransform: 'uppercase' }}>
              {hotel.hotelType}
            </span>
            {hotel.featured && (
              <span className="badge badge-blue">
                <Sparkles size={12} /> Premier Choice
              </span>
            )}
          </div>

          <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>{hotel.name}</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.9rem' }}>
            <StarRating rating={hotel.rating} reviewCount={hotel.reviewCount} size={17} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-text-muted)' }}>
              <MapPin size={16} color="var(--color-accent)" />
              <span>{hotel.address}, {hotel.city}, {hotel.country}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={handleToggleFavorite}
            className={`btn ${isFavorited ? 'btn-danger' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Heart size={18} fill={isFavorited ? 'currentColor' : 'none'} />
            <span>{isFavorited ? 'Saved to Favorites' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* LUXURY PHOTO GALLERY */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '1rem',
          height: '460px',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          marginBottom: '3rem'
        }}
      >
        <div style={{ height: '100%', position: 'relative' }}>
          <img
            src={hotel.images?.[activeImage] || hotel.images?.[0]}
            alt={hotel.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', height: '100%' }}>
          {hotel.images?.slice(0, 4).map((img, idx) => (
            <div
              key={idx}
              onClick={() => setActiveImage(idx)}
              style={{
                position: 'relative',
                cursor: 'pointer',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                border: activeImage === idx ? '3px solid var(--color-accent)' : 'none'
              }}
            >
              <img
                src={img}
                alt={`${hotel.name} view ${idx + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 2-COLUMN MAIN CONTENT & STICKY BOOKING CARD */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '3rem', alignItems: 'start' }}>
        {/* LEFT: Overview, Rooms, Map, Reviews */}
        <div>
          {/* About Hotel */}
          <section style={{ marginBottom: '3rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>About this property</h2>
            <p style={{ fontSize: '1.05rem', lineHeight: '1.7', color: 'var(--color-primary)' }}>
              {hotel.description}
            </p>
          </section>

          {/* Amenities Checklist */}
          <section style={{ marginBottom: '3rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Featured Amenities</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              {hotel.amenities?.map((amenity, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.95rem' }}>
                  <CheckCircle size={18} color="var(--color-success)" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ROOMS & SUITES LIST */}
          <section style={{ marginBottom: '3rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Available Accommodations</h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  Select an option to reserve immediately with instant confirmation
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {hotel.rooms?.map((room) => (
                <div
                  key={room._id}
                  className="card"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '240px 1fr auto',
                    gap: '1.5rem',
                    padding: '1.25rem',
                    alignItems: 'center'
                  }}
                >
                  <img
                    src={room.images?.[0] || hotel.images?.[0]}
                    alt={room.name}
                    style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
                  />

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                      <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{room.name}</h3>
                      <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                        {room.roomType}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Bed size={15} /> {room.beds?.count} {room.beds?.type}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Users size={15} /> Up to {room.capacity?.totalGuests} Guests
                      </span>
                    </div>

                    <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                      {room.description}
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {room.amenities?.slice(0, 4).map((a, idx) => (
                        <span key={idx} className="amenity-chip">{a}</span>
                      ))}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', borderLeft: '1px solid var(--color-border)', paddingLeft: '1.5rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>From</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                      {formatINR(room.pricePerNight)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                      per night
                    </div>
                    <button
                      onClick={() => handleOpenBooking(room)}
                      className="btn btn-primary btn-sm btn-block"
                    >
                      Reserve Room
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* DEDICATED LOCATION MAP */}
          <section style={{ marginBottom: '3rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Property Location</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
              {hotel.address}, {hotel.city}, {hotel.country}
            </p>

            <div style={{ height: '360px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
              <MapView
                hotels={[hotel]}
                selectedHotelId={hotel._id}
                center={[hotel.latitude, hotel.longitude]}
                zoom={14}
              />
            </div>
          </section>

          {/* VERIFIED REVIEWS SECTION */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Guest Reviews & Ratings</h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  Verified experiences from guests who completed their stay
                </p>
              </div>
              <StarRating rating={hotel.rating} reviewCount={hotel.reviewCount} size={20} />
            </div>

            {/* Leave a Review Box */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', background: '#f8fafc' }}>
              <h4 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquare size={18} color="var(--color-accent)" /> Share Your Stay Experience
              </h4>

              <form onSubmit={handleReviewSubmit}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.88rem', fontWeight: 600 }}>Your Rating:</label>
                  <select
                    className="form-select"
                    value={newRating}
                    onChange={(e) => setNewRating(Number(e.target.value))}
                    style={{ width: '130px', padding: '0.4rem 0.75rem', fontSize: '0.88rem' }}
                  >
                    <option value={5}>5 - Extraordinary</option>
                    <option value={4}>4 - Excellent</option>
                    <option value={3}>3 - Good</option>
                    <option value={2}>2 - Fair</option>
                    <option value={1}>1 - Poor</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Describe the hospitality, cleanliness, dining, and highlights of your stay..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={reviewSubmitting}
                >
                  {reviewSubmitting ? 'Publishing...' : 'Submit Review'}
                </button>
              </form>
            </div>

            {/* Existing Reviews List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {hotel.reviews?.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No reviews published yet. Be the first to share your experience!
                </div>
              ) : (
                hotel.reviews?.map((review) => (
                  <div key={review._id} className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img
                          src={review.user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                          alt={review.user?.name}
                          style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{review.user?.name || 'Verified Traveler'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            {new Date(review.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <StarRating rating={review.rating} showNumber={false} size={15} />
                    </div>

                    <p style={{ fontSize: '0.92rem', color: 'var(--color-primary)', margin: 0 }}>
                      {review.comment}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* RIGHT: Floating Sticky Reservation Widget */}
        <div style={{ position: 'sticky', top: 'calc(var(--navbar-height) + 1.5rem)' }}>
          <div className="card" style={{ padding: '1.75rem', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                  {formatINR(hotel.priceFrom)}
                </span>
                <span style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}> / night</span>
              </div>
              <StarRating rating={hotel.rating} reviewCount={hotel.reviewCount} size={14} />
            </div>

            <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 600 }}>
                <Calendar size={16} color="var(--color-accent)" />
                <span>Instant Availability Search</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: 0 }}>
                Check live room inventory with our real-time multi-step reservation system.
              </p>
            </div>

            <button
              onClick={() => handleOpenBooking(hotel.rooms?.[0])}
              className="btn btn-primary btn-lg btn-block"
              style={{ marginBottom: '1rem' }}
            >
              Reserve Accommodation
            </button>

            <div style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
              No immediate payment required &bull; Flexible cancellation
            </div>
          </div>
        </div>
      </div>

      {/* MULTI-STEP BOOKING MODAL */}
      <MultiStepBookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        hotel={hotel}
        preselectedRoom={selectedRoomForBooking}
      />
    </div>
  );
};

export default HotelDetail;
