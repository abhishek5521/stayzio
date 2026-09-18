import React, { useState, useEffect } from 'react';
import { Search, Filter, Ban, CheckCircle, ExternalLink, Printer } from 'lucide-react';
import { bookingService } from '../../services/bookingService';
import { useToast } from '../../context/ToastContext';
import { formatINR } from '../../utils/currency';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const toast = useToast();

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await bookingService.getAllBookings({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search.trim() || undefined,
        limit: 50
      });
      if (res.success) {
        setBookings(res.data.bookings || []);
      }
    } catch (err) {
      console.error('Failed to load admin bookings:', err);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBookings();
  };

  const handleCancel = async (id, ref) => {
    const reason = window.prompt(`Please enter cancellation reason for ${ref}:`, 'Administrative cancellation');
    if (!reason) return;

    try {
      await bookingService.cancelBooking(id, reason);
      toast.success(`Booking ${ref} cancelled`);
      fetchBookings();
    } catch (err) {
      toast.error('Failed to cancel booking');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="admin-page-title">Global Reservations Management</h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.9rem' }}>
          Inspect guest itineraries, manage reservation statuses, and process cancellations
        </p>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', flex: 1, maxWidth: '480px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search reference, guest name, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '2.5rem', fontSize: '0.88rem' }}
              />
              <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            </div>
            <button type="submit" className="btn btn-secondary btn-sm">
              Search
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Status:</span>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '150px', fontSize: '0.88rem', padding: '0.4rem 0.75rem' }}
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Booking Ref</th>
                <th>Guest</th>
                <th>Property & Room</th>
                <th>Dates</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Payment</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem' }}>
                    Loading reservations...
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-muted)' }}>
                    No bookings found matching search criteria.
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b._id}>
                    <td>
                      <strong style={{ fontFamily: 'monospace', color: 'var(--color-accent)' }}>
                        {b.bookingReference}
                      </strong>
                    </td>
                    <td>
                      <div>
                        <strong>{b.guestDetails?.fullName || b.user?.name}</strong>
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                          {b.guestDetails?.email || b.user?.email}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{b.hotel?.name || 'Hotel'}</strong>
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                          {b.room?.name || 'Standard'} &bull; {b.nights} {b.nights === 1 ? 'nt' : 'nts'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem' }}>
                        {new Date(b.checkIn).toLocaleDateString()} &ndash; {new Date(b.checkOut).toLocaleDateString()}
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                      {formatINR(b.totalPrice)}
                    </td>
                    <td>
                      <span className={`badge badge-${b.status === 'confirmed' ? 'success' : b.status === 'completed' ? 'blue' : 'danger'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: b.paymentStatus === 'paid' ? '#dcfce7' : b.paymentStatus === 'failed' ? '#fee2e2' : '#fef3c7',
                          color: b.paymentStatus === 'paid' ? '#15803d' : b.paymentStatus === 'failed' ? '#b91c1c' : '#b45309',
                          border: '1px solid ' + (b.paymentStatus === 'paid' ? '#bbf7d0' : b.paymentStatus === 'failed' ? '#fecaca' : '#fde68a'),
                          fontSize: '0.72rem'
                        }}
                      >
                        {b.paymentStatus === 'paid' ? 'Paid (Razorpay)' : b.paymentStatus === 'failed' ? 'Failed' : 'Pending'}
                      </span>
                      {b.razorpayPaymentId && (
                        <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                          {b.razorpayPaymentId.slice(0, 13)}...
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                        {b.status === 'confirmed' && (
                          <button
                            onClick={() => handleCancel(b._id, b.bookingReference)}
                            className="btn btn-outline btn-sm"
                            style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)', padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          onClick={() => window.print()}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.3rem 0.6rem' }}
                          title="Print Receipt"
                        >
                          <Printer size={14} />
                        </button>
                      </div>
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

export default AdminBookings;
