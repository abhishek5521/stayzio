import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Bed,
  Users,
  Printer,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Building,
  ShieldCheck,
  CreditCard,
  Copy,
  Check,
  RefreshCw
} from 'lucide-react';
import { bookingService } from '../../services/bookingService';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import PaymentCheckoutModal from '../../components/booking/PaymentCheckoutModal';
import { formatINR } from '../../utils/currency';

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const toast = useToast();

  const fetchBooking = async () => {
    try {
      setLoading(true);
      const res = await bookingService.getBookingById(id);
      if (res.success) {
        setBooking(res.data.booking);
      }
    } catch (err) {
      console.error('Failed to load booking:', err);
      toast.error('Could not load reservation details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const handleConfirmCancel = async () => {
    try {
      setCancelling(true);
      const res = await bookingService.cancelBooking(id, cancelReason);
      if (res.success) {
        toast.success('Reservation successfully cancelled');
        setCancelModalOpen(false);
        fetchBooking();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel reservation');
    } finally {
      setCancelling(false);
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.info('Copied to clipboard');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getPaymentBadge = (paymentStatus) => {
    switch (paymentStatus) {
      case 'paid':
        return (
          <span
            className="badge"
            style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', fontSize: '0.75rem' }}
          >
            Paid
          </span>
        );
      case 'failed':
        return (
          <span
            className="badge"
            style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', fontSize: '0.75rem' }}
          >
            Payment Failed
          </span>
        );
      case 'refunded':
        return (
          <span
            className="badge"
            style={{ background: '#f3e8ff', color: '#7e22ce', border: '1px solid #e9d5ff', fontSize: '0.75rem' }}
          >
            Refunded
          </span>
        );
      case 'pending':
      default:
        return (
          <span
            className="badge"
            style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontSize: '0.75rem' }}
          >
            Payment Pending
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div style={{ fontWeight: 600, color: 'var(--color-accent)' }}>Loading reservation details...</div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h2>Reservation Not Found</h2>
        <Link to="/my-bookings" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back to My Bookings
        </Link>
      </div>
    );
  }

  const isEligibleForCancel = booking.status === 'confirmed';

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 5rem 1.5rem', maxWidth: '850px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          to="/my-bookings"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--color-text-muted)',
            fontSize: '0.9rem',
            marginBottom: '1rem'
          }}
        >
          <ArrowLeft size={16} /> Back to Reservations
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <span className={`badge badge-${booking.status === 'confirmed' ? 'success' : booking.status === 'completed' ? 'blue' : 'danger'}`}>
                {booking.status}
              </span>
              {getPaymentBadge(booking.paymentStatus)}
              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-accent)' }}>
                {booking.bookingReference}
              </span>
            </div>
            <h1 style={{ fontSize: '1.85rem', margin: 0 }}>Reservation Summary</h1>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {booking.paymentStatus !== 'paid' && booking.status !== 'cancelled' && (
              <button
                onClick={() => setPaymentModalOpen(true)}
                className="btn btn-primary btn-sm"
                style={{
                  background: '#0f766e',
                  borderColor: '#0f766e',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <CreditCard size={14} />
                {booking.paymentStatus === 'failed' ? 'Retry Payment' : 'Pay Now'}
              </button>
            )}
            <button onClick={() => window.print()} className="btn btn-secondary btn-sm">
              <Printer size={16} /> Print Receipt
            </button>
            {isEligibleForCancel && (
              <button
                onClick={() => setCancelModalOpen(true)}
                className="btn btn-outline btn-sm"
                style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
              >
                Cancel Booking
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Property & Room Details */}
      <div className="card" style={{ padding: '1.75rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1.5rem', alignItems: 'center' }}>
          <img
            src={booking.hotel?.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80'}
            alt={booking.hotel?.name}
            style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
          />

          <div>
            <h3 style={{ fontSize: '1.35rem', marginBottom: '0.35rem' }}>
              <Link to={`/hotels/${booking.hotel?._id}`} style={{ color: 'inherit' }}>
                {booking.hotel?.name}
              </Link>
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.88rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
              <MapPin size={15} color="var(--color-accent)" />
              <span>{booking.hotel?.address}, {booking.hotel?.city}, {booking.hotel?.country}</span>
            </div>

            <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.88rem', color: 'var(--color-primary)' }}>
              <span><strong>Room:</strong> {booking.room?.name || 'Standard'}</span>
              <span><strong>Type:</strong> {booking.room?.roomType}</span>
              <span><strong>Beds:</strong> {booking.room?.beds?.count} {booking.room?.beds?.type}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stay Itinerary & Guests */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.75rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <h4 style={{ fontSize: '1.05rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} color="var(--color-accent)" /> Stay Itinerary
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Check-in:</span>
              <strong>{new Date(booking.checkIn).toLocaleDateString()}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Check-out:</span>
              <strong>{new Date(booking.checkOut).toLocaleDateString()}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Total Duration:</span>
              <strong>{booking.nights} {booking.nights === 1 ? 'Night' : 'Nights'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Party Size:</span>
              <strong>{booking.guests?.adults} Adults, {booking.guests?.children || 0} Children</strong>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <h4 style={{ fontSize: '1.05rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} color="var(--color-accent)" /> Guest Contact
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Lead Guest:</span>
              <strong>{booking.guestDetails?.fullName}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Email:</span>
              <strong>{booking.guestDetails?.email}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Phone:</span>
              <strong>{booking.guestDetails?.phone || 'Not provided'}</strong>
            </div>
            {booking.guestDetails?.specialRequests && (
              <div style={{ paddingTop: '0.4rem', borderTop: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Special Requests:</span>
                <span style={{ fontSize: '0.85rem' }}>"{booking.guestDetails.specialRequests}"</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Financial Ledger Breakdown */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h4 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>Financial Breakdown</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Room Rate ({formatINR(booking.pricePerNight)} &times; {booking.nights} nights)</span>
            <span>{formatINR(booking.subtotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Hospitality Taxes & Service Fee (12%)</span>
            <span>{formatINR(booking.taxes)}</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '0.75rem',
              marginTop: '0.5rem',
              borderTop: '1px solid var(--color-border)',
              fontSize: '1.25rem',
              fontWeight: 800,
              color: 'var(--color-primary)'
            }}
          >
            <span>Total Amount</span>
            <span>{formatINR(booking.totalPrice)}</span>
          </div>
        </div>
      </div>

      {/* Payment & Security Details */}
      <div className="card" style={{ padding: '1.5rem', marginTop: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h4 style={{ fontSize: '1.05rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={18} color="var(--color-accent)" /> Payment & Transaction Details
          </h4>
          {getPaymentBadge(booking.paymentStatus)}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Payment Gateway:</span>
            <span style={{ fontWeight: 600 }}>Razorpay (Cryptographically Verified)</span>
          </div>

          {booking.razorpayPaymentId && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Razorpay Payment ID:</span>
              <button
                type="button"
                onClick={() => copyToClipboard(booking.razorpayPaymentId, 'payId')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  color: 'var(--color-primary)'
                }}
                title="Click to copy Payment ID"
              >
                <span>{booking.razorpayPaymentId}</span>
                {copiedField === 'payId' ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
              </button>
            </div>
          )}

          {booking.razorpayOrderId && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Razorpay Order ID:</span>
              <span style={{ fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>
                {booking.razorpayOrderId}
              </span>
            </div>
          )}

          {booking.paidAt && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Paid Timestamp:</span>
              <span>{new Date(booking.paidAt).toLocaleString()}</span>
            </div>
          )}

          {booking.paymentFailureReason && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: 'var(--radius-sm)', color: '#991b1b', fontSize: '0.85rem' }}>
              <strong>Failure Note:</strong> {booking.paymentFailureReason}
            </div>
          )}

          <div
            style={{
              marginTop: '0.5rem',
              padding: '0.75rem 1rem',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '0.82rem',
              color: '#166534'
            }}
          >
            <ShieldCheck size={18} color="#16a34a" />
            <span>
              Protected with 256-bit SSL encryption and server-verified HMAC-SHA256 signature verification.
            </span>
          </div>

          {booking.paymentStatus !== 'paid' && booking.status !== 'cancelled' && (
            <div style={{ marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                This reservation is awaiting payment confirmation.
              </span>
              <button
                onClick={() => setPaymentModalOpen(true)}
                className="btn btn-primary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <CreditCard size={14} /> Complete Payment
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cancellation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Reservation"
        maxWidth="500px"
      >
        <div style={{ padding: '0.5rem 0' }}>
          <p style={{ marginBottom: '1rem' }}>
            Are you sure you want to cancel reservation <strong>{booking.bookingReference}</strong>?
          </p>
          <div className="form-group">
            <label className="form-label">Cancellation Reason</label>
            <textarea
              className="form-control"
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Change of schedule, travel delay..."
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button onClick={() => setCancelModalOpen(false)} className="btn btn-secondary">
              Keep Booking
            </button>
            <button onClick={handleConfirmCancel} className="btn btn-danger" disabled={cancelling}>
              {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Payment Retry / Checkout Modal */}
      <PaymentCheckoutModal
        isOpen={paymentModalOpen}
        booking={booking}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={(updated) => {
          setPaymentModalOpen(false);
          setBooking(updated);
        }}
      />
    </div>
  );
};

export default BookingDetail;
