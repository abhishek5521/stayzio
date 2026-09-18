import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, AlertCircle, CheckCircle2, Ban, Printer, CreditCard, RefreshCw } from 'lucide-react';
import { bookingService } from '../../services/bookingService';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import PaymentCheckoutModal from '../../components/booking/PaymentCheckoutModal';
import { formatINR } from '../../utils/currency';

const MyBookings = () => {
  const [filter, setFilter] = useState('all');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Cancel Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Retry / Complete Payment Modal State
  const [paymentBooking, setPaymentBooking] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await bookingService.getMyBookings({ filter });
      if (res.success) {
        setBookings(res.data.bookings || []);
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      toast.error('Could not load reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  const handleOpenCancel = (booking) => {
    setSelectedBooking(booking);
    setCancelReason('');
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedBooking) return;
    try {
      setCancelling(true);
      const res = await bookingService.cancelBooking(selectedBooking._id, cancelReason);
      if (res.success) {
        toast.success('Reservation successfully cancelled');
        setCancelModalOpen(false);
        fetchBookings();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel reservation');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return <span className="badge badge-success">Confirmed</span>;
      case 'completed':
        return <span className="badge badge-blue">Completed</span>;
      case 'cancelled':
        return <span className="badge badge-danger">Cancelled</span>;
      default:
        return <span className="badge badge-neutral">{status}</span>;
    }
  };

  const getPaymentBadge = (paymentStatus) => {
    switch (paymentStatus) {
      case 'paid':
        return (
          <span
            className="badge"
            style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', fontSize: '0.72rem' }}
          >
            Paid
          </span>
        );
      case 'failed':
        return (
          <span
            className="badge"
            style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', fontSize: '0.72rem' }}
          >
            Payment Failed
          </span>
        );
      case 'refunded':
        return (
          <span
            className="badge"
            style={{ background: '#f3e8ff', color: '#7e22ce', border: '1px solid #e9d5ff', fontSize: '0.72rem' }}
          >
            Refunded
          </span>
        );
      case 'pending':
      default:
        return (
          <span
            className="badge"
            style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontSize: '0.72rem' }}
          >
            Payment Pending
          </span>
        );
    }
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 5rem 1.5rem', maxWidth: '1000px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>My Reservations</h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
          Manage your upcoming travel itineraries, completed stays, and booking receipts
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-border)', marginBottom: '2rem', paddingBottom: '0.5rem' }}>
        {[
          { key: 'all', label: 'All Stays' },
          { key: 'upcoming', label: 'Upcoming' },
          { key: 'completed', label: 'Completed' },
          { key: 'cancelled', label: 'Cancelled' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`btn btn-sm ${filter === tab.key ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontWeight: 600 }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-accent)' }}>
          Retrieving reservation history...
        </div>
      ) : bookings.length === 0 ? (
        <div className="card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
          <Calendar size={40} color="var(--color-text-muted)" style={{ margin: '0 auto 1rem auto' }} />
          <h3>No reservations found</h3>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            You do not currently have any bookings matching this status.
          </p>
          <Link to="/hotels" className="btn btn-primary">
            Browse Luxury Hotels
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {bookings.map((b) => {
            const isEligibleForCancel = b.status === 'confirmed';
            return (
              <div
                key={b._id}
                className="card"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '220px 1fr auto',
                  gap: '1.5rem',
                  padding: '1.5rem',
                  alignItems: 'center'
                }}
              >
                <img
                  src={b.hotel?.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80'}
                  alt={b.hotel?.name}
                  style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
                />

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                    {getStatusBadge(b.status)}
                    {getPaymentBadge(b.paymentStatus)}
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontFamily: 'monospace', fontWeight: 700 }}>
                      {b.bookingReference}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>
                    {b.hotel ? (
                      <Link to={`/hotels/${b.hotel._id}`} style={{ color: 'inherit' }}>
                        {b.hotel.name}
                      </Link>
                    ) : (
                      'Hotel Property'
                    )}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                    <MapPin size={14} color="var(--color-accent)" />
                    <span>{b.hotel?.city}, {b.hotel?.country}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--color-text-main)', background: '#f8fafc', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)' }}>
                    <div>
                      <span style={{ color: 'var(--color-text-muted)' }}>Dates: </span>
                      <strong>{new Date(b.checkIn).toLocaleDateString()} &ndash; {new Date(b.checkOut).toLocaleDateString()}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-text-muted)' }}>Room: </span>
                      <strong>{b.room?.name || 'Standard'}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right', borderLeft: '1px solid var(--color-border)', paddingLeft: '1.5rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Total Amount</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '1rem' }}>
                    {formatINR(b.totalPrice)}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {b.paymentStatus !== 'paid' && b.status !== 'cancelled' && (
                      <button
                        onClick={() => setPaymentBooking(b)}
                        className="btn btn-primary btn-sm"
                        style={{
                          background: '#0f766e',
                          borderColor: '#0f766e',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <CreditCard size={14} />
                        {b.paymentStatus === 'failed' ? 'Retry Payment' : 'Pay Now'}
                      </button>
                    )}
                    {isEligibleForCancel && (
                      <button
                        onClick={() => handleOpenCancel(b)}
                        className="btn btn-outline btn-sm"
                        style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                      >
                        Cancel Booking
                      </button>
                    )}
                    <Link
                      to={`/bookings/${b._id}`}
                      className="btn btn-secondary btn-sm"
                    >
                      View Details
                    </Link>
                    <button
                      onClick={() => window.print()}
                      className="btn btn-ghost btn-sm"
                    >
                      <Printer size={14} /> Receipt
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Reservation"
        maxWidth="500px"
      >
        <div style={{ padding: '0.5rem 0' }}>
          <p style={{ fontSize: '0.95rem', color: 'var(--color-text-main)', marginBottom: '1rem' }}>
            Are you sure you want to cancel your reservation at{' '}
            <strong>{selectedBooking?.hotel?.name}</strong>?
          </p>

          <div style={{ background: 'var(--color-warning-light)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: '#9a3412', marginBottom: '1.25rem' }}>
            Cancellation will immediately release the room inventory back to the booking system.
          </div>

          <div className="form-group">
            <label className="form-label">Reason for Cancellation (Optional)</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Change of plans, travel delay, unexpected conflict..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              onClick={() => setCancelModalOpen(false)}
              className="btn btn-secondary"
            >
              Keep Reservation
            </button>
            <button
              onClick={handleConfirmCancel}
              className="btn btn-danger"
              disabled={cancelling}
            >
              {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Payment Retry / Checkout Modal */}
      <PaymentCheckoutModal
        isOpen={!!paymentBooking}
        booking={paymentBooking}
        onClose={() => setPaymentBooking(null)}
        onSuccess={() => {
          setPaymentBooking(null);
          fetchBookings();
        }}
      />
    </div>
  );
};

export default MyBookings;
