import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Trash2, MessageSquare, Building } from 'lucide-react';
import { reviewService } from '../../services/reviewService';
import { useToast } from '../../context/ToastContext';
import StarRating from '../../components/common/StarRating';

const UserReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await reviewService.getUserReviews();
      if (res.success) {
        setReviews(res.data.reviews || []);
      }
    } catch (err) {
      console.error('Failed to load user reviews:', err);
      toast.error('Could not load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await reviewService.deleteReview(id);
      toast.success('Review removed');
      fetchReviews();
    } catch (err) {
      toast.error('Failed to remove review');
    }
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 5rem 1.5rem', maxWidth: '850px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>My Published Reviews</h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
          Manage the ratings and feedback you've shared with the Stayzio guest community
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-accent)' }}>
          Loading your reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div className="card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
          <MessageSquare size={44} color="var(--color-text-muted)" style={{ margin: '0 auto 1rem auto' }} />
          <h3>No reviews published yet</h3>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            After completing your hotel stays, share your experience to help fellow travelers.
          </p>
          <Link to="/hotels" className="btn btn-primary">
            Explore Properties
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {reviews.map((r) => (
            <div key={r._id} className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>
                    <Link to={`/hotels/${r.hotel?._id}`} style={{ color: 'inherit' }}>
                      {r.hotel?.name || 'Hotel Property'}
                    </Link>
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    {r.hotel?.city}, {r.hotel?.country} &bull; Reviewed on {new Date(r.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(r._id)}
                  className="btn btn-outline btn-sm"
                  style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                  title="Delete Review"
                >
                  <Trash2 size={15} /> Delete
                </button>
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <StarRating rating={r.rating} size={16} />
              </div>

              <p style={{ margin: 0, color: 'var(--color-primary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                "{r.comment}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserReviews;
