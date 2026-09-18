import React, { useState, useEffect } from 'react';
import { Star, Trash2 } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { reviewService } from '../../services/reviewService';
import { useToast } from '../../context/ToastContext';
import StarRating from '../../components/common/StarRating';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAllReviews({ limit: 50 });
      if (res.success) {
        setReviews(res.data.reviews || []);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this guest review from the platform?')) return;
    try {
      await reviewService.deleteReview(id);
      toast.success('Review deleted');
      fetchReviews();
    } catch (err) {
      toast.error('Failed to delete review');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="admin-page-title">Guest Reviews & Moderation</h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.9rem' }}>
          Inspect guest feedback, monitor property ratings, and moderate public comments
        </p>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <h3 style={{ fontSize: '1.15rem', margin: 0 }}>All Published Reviews</h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Total Reviews: <strong>{reviews.length}</strong>
          </span>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Author</th>
                <th>Property</th>
                <th>Rating</th>
                <th>Feedback Comment</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem' }}>
                    Loading guest reviews...
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-muted)' }}>
                    No reviews published yet.
                  </td>
                </tr>
              ) : (
                reviews.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <img
                          src={r.user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                          alt={r.user?.name}
                          style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div>
                          <strong>{r.user?.name || 'Guest'}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            {r.user?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong>{r.hotel?.name || 'Hotel'}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {r.hotel?.city}, {r.hotel?.country}
                      </div>
                    </td>
                    <td>
                      <StarRating rating={r.rating} size={14} />
                    </td>
                    <td style={{ maxWidth: '300px' }}>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-primary)' }}>
                        "{r.comment}"
                      </p>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleDelete(r._id)}
                        className="btn btn-outline btn-sm"
                        style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminReviews;
