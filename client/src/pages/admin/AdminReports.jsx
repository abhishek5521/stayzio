import React, { useState, useEffect } from 'react';
import { Calendar, Download, Printer, TrendingUp, IndianRupee, CheckCircle, XCircle } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import { formatINR } from '../../utils/currency';

const AdminReports = () => {
  const [timeframe, setTimeframe] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = { timeframe };
      if (timeframe === 'custom' && startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      const res = await adminService.getReports(params);
      if (res.success) {
        setReport(res.data);
      }
    } catch (err) {
      console.error('Failed to generate report:', err);
      toast.error('Failed to generate reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (timeframe !== 'custom' || (startDate && endDate)) {
      fetchReport();
    }
  }, [timeframe]);

  const summary = report?.summary || { totalBookings: 0, confirmed: 0, cancelled: 0, revenue: 0 };
  const bookings = report?.bookings || [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="admin-page-title">Financial & Booking Reports</h1>
          <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.9rem' }}>
            Generate operational audit reports by daily, weekly, monthly, or custom date ranges
          </p>
        </div>

        <button onClick={() => window.print()} className="btn btn-secondary">
          <Printer size={16} /> Print Report
        </button>
      </div>

      {/* Date Range Selector Toolbar */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {[
            { key: 'daily', label: 'Last 24 Hours' },
            { key: 'weekly', label: 'Last 7 Days' },
            { key: 'monthly', label: 'Last 30 Days' },
            { key: 'custom', label: 'Custom Range' }
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTimeframe(t.key)}
              className={`btn btn-sm ${timeframe === t.key ? 'btn-primary' : 'btn-secondary'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {timeframe === 'custom' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
            />
            <span>to</span>
            <input
              type="date"
              className="form-control"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
            />
            <button onClick={fetchReport} className="btn btn-primary btn-sm">
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Report Summary Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-info">
            <h4>Period Revenue</h4>
            <div className="metric-value">{formatINR(summary.revenue)}</div>
            <div className="metric-sub">
              <TrendingUp size={14} /> Gross settled volume
            </div>
          </div>
          <div className="metric-icon-wrap" style={{ background: '#dcfce7', color: '#16a34a' }}>
            <IndianRupee size={22} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <h4>Reservations</h4>
            <div className="metric-value">{summary.totalBookings}</div>
            <div className="metric-sub" style={{ color: '#2563eb' }}>
              Total initiated stays
            </div>
          </div>
          <div className="metric-icon-wrap" style={{ background: '#dbeafe', color: '#2563eb' }}>
            <Calendar size={22} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <h4>Confirmed Rate</h4>
            <div className="metric-value">
              {summary.totalBookings > 0
                ? Math.round((summary.confirmed / summary.totalBookings) * 100)
                : 100}
              %
            </div>
            <div className="metric-sub" style={{ color: '#10b981' }}>
              <CheckCircle size={14} /> {summary.confirmed} confirmed stays
            </div>
          </div>
          <div className="metric-icon-wrap" style={{ background: '#d1fae5', color: '#059669' }}>
            <CheckCircle size={22} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <h4>Cancellations</h4>
            <div className="metric-value">{summary.cancelled}</div>
            <div className="metric-sub" style={{ color: '#ef4444' }}>
              <XCircle size={14} /> Released back to inventory
            </div>
          </div>
          <div className="metric-icon-wrap" style={{ background: '#fee2e2', color: '#dc2626' }}>
            <XCircle size={22} />
          </div>
        </div>
      </div>

      {/* Itemized Audit Ledger Table */}
      <div className="table-card">
        <div className="table-toolbar">
          <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Itemized Transaction Ledger</h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Transactions: <strong>{bookings.length}</strong>
          </span>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Booking Date</th>
                <th>Reference</th>
                <th>Property</th>
                <th>Guest</th>
                <th>Stay Duration</th>
                <th>Amount</th>
                <th>Booking Status</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem' }}>
                    Compiling report data...
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-muted)' }}>
                    No transactions recorded during this timeframe.
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b._id}>
                    <td style={{ fontSize: '0.82rem' }}>
                      {new Date(b.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <strong style={{ fontFamily: 'monospace', color: 'var(--color-accent)' }}>
                        {b.bookingReference}
                      </strong>
                    </td>
                    <td>
                      <div>
                        <strong>{b.hotel?.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {b.hotel?.city}, {b.hotel?.country}
                        </div>
                      </div>
                    </td>
                    <td>{b.guestDetails?.fullName || b.user?.name}</td>
                    <td>
                      {b.nights} {b.nights === 1 ? 'night' : 'nights'} ({new Date(b.checkIn).toLocaleDateString()})
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
                          fontSize: '0.72rem'
                        }}
                      >
                        {b.paymentStatus === 'paid' ? 'Paid' : b.paymentStatus || 'Pending'}
                      </span>
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

export default AdminReports;
