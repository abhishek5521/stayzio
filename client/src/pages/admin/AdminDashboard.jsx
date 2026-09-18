import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  IndianRupee,
  CalendarCheck,
  Building,
  Users,
  TrendingUp,
  Percent,
  CheckCircle2,
  XCircle,
  Award
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { formatINR } from '../../utils/currency';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await adminService.getDashboardStats();
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-accent)' }}>
        Aggregating live MongoDB platform statistics...
      </div>
    );
  }

  const { metrics, charts } = data || {
    metrics: {},
    charts: { monthlyTrends: [], statusBreakdown: [], topHotels: [] }
  };

  const maxRevenueTrend = Math.max(
    ...(charts?.monthlyTrends?.map((m) => m.revenue) || [1000]),
    1000
  );

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="admin-page-title">Executive Operations Dashboard</h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.9rem' }}>
          Real-time transactional metrics and operational overview across all destinations
        </p>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-info">
            <h4>Total Platform Revenue</h4>
            <div className="metric-value">{formatINR(metrics.totalRevenue)}</div>
            <div className="metric-sub">
              <TrendingUp size={14} /> Avg Stay: {formatINR(metrics.avgBookingValue)}
            </div>
          </div>
          <div className="metric-icon-wrap" style={{ background: '#dcfce7', color: '#16a34a' }}>
            <IndianRupee size={22} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <h4>Total Bookings</h4>
            <div className="metric-value">{metrics.totalBookings}</div>
            <div className="metric-sub" style={{ color: '#2563eb' }}>
              <CheckCircle2 size={14} /> {metrics.confirmedBookings} Confirmed
            </div>
          </div>
          <div className="metric-icon-wrap" style={{ background: '#dbeafe', color: '#2563eb' }}>
            <CalendarCheck size={22} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <h4>Properties & Inventory</h4>
            <div className="metric-value">{metrics.totalHotels}</div>
            <div className="metric-sub" style={{ color: '#b45309' }}>
              {metrics.totalRooms} Configured Rooms
            </div>
          </div>
          <div className="metric-icon-wrap" style={{ background: '#fef3c7', color: '#d97706' }}>
            <Building size={22} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <h4>Registered Guests</h4>
            <div className="metric-value">{metrics.totalUsers}</div>
            <div className="metric-sub" style={{ color: '#0891b2' }}>
              {metrics.totalReviews} Verified Reviews
            </div>
          </div>
          <div className="metric-icon-wrap" style={{ background: '#cffafe', color: '#0891b2' }}>
            <Users size={22} />
          </div>
        </div>
      </div>

      {/* Razorpay Gateway Status & Settlement Summary */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          border: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
            <IndianRupee size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <strong style={{ fontSize: '1rem' }}>Razorpay Settlement Gateway</strong>
              <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>HMAC Verified</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              All revenues reflect cryptographically verified and settled bookings in INR.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '2rem', fontSize: '0.85rem' }}>
          <div>
            <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>PAID BOOKINGS</span>
            <strong style={{ color: '#16a34a', fontSize: '1.15rem' }}>{metrics.paidBookings ?? metrics.confirmedBookings}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>PENDING PAYMENTS</span>
            <strong style={{ color: '#b45309', fontSize: '1.15rem' }}>{metrics.pendingPayments ?? 0}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>FAILED TRANSACTIONS</span>
            <strong style={{ color: '#dc2626', fontSize: '1.15rem' }}>{metrics.failedPayments ?? 0}</strong>
          </div>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="charts-grid">
        {/* Monthly Revenue Visualizer */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <h3>Monthly Performance</h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Revenue & reservation trends
              </div>
            </div>
            <span className="badge badge-blue">Live Aggregation</span>
          </div>

          <div className="bar-chart-visual">
            {charts.monthlyTrends?.length > 0 ? (
              charts.monthlyTrends.map((trend, i) => {
                const heightPercent = Math.max(15, Math.round((trend.revenue / maxRevenueTrend) * 100));
                return (
                  <div key={i} className="bar-column" title={`${trend.label}: ${formatINR(trend.revenue)} (${trend.bookings} bookings)`}>
                    <div
                      className="bar-fill"
                      style={{ height: `${heightPercent}%` }}
                    ></div>
                    <div className="bar-label">{trend.label}</div>
                  </div>
                );
              })
            ) : (
              <div style={{ margin: 'auto', color: 'var(--color-text-muted)' }}>
                No historical trend data yet.
              </div>
            )}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3>Booking Status</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingTop: '0.5rem' }}>
            {charts.statusBreakdown?.map((stat, i) => {
              const total = metrics.totalBookings || 1;
              const pct = Math.round((stat.count / total) * 100);
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 600 }}>{stat.status}</span>
                    <span style={{ color: 'var(--color-text-muted)' }}>
                      {stat.count} ({pct}%)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: stat.color,
                        borderRadius: '4px'
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* TOP PERFORMING HOTELS TABLE */}
      <div className="table-card">
        <div className="table-toolbar">
          <div>
            <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Top Performing Luxury Properties</h3>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
              Ranked by gross booking volume and revenue
            </div>
          </div>
          <Link to="/admin/hotels" className="btn btn-secondary btn-sm">
            View All Hotels
          </Link>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Destination</th>
                <th>Total Bookings</th>
                <th>Gross Revenue</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {charts.topHotels?.map((hotel, idx) => (
                <tr key={idx}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img
                        src={hotel.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=150&q=80'}
                        alt={hotel.name}
                        style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                      />
                      <strong style={{ color: 'var(--color-primary)' }}>{hotel.name}</strong>
                    </div>
                  </td>
                  <td>{hotel.city}, {hotel.country}</td>
                  <td>{hotel.bookingsCount} reservations</td>
                  <td style={{ fontWeight: 700, color: 'var(--color-success-dark)' }}>
                    {formatINR(hotel.totalRevenue)}
                  </td>
                  <td>
                    <span className="badge badge-success">Active</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
