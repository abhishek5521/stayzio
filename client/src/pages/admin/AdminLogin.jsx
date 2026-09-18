import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Building2, Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const AdminLogin = () => {
  const [email, setEmail] = useState('admin@stayzio.com');
  const [password, setPassword] = useState('Admin@123456');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await login(email, password);
      if (res.success) {
        if (res.data.user.role !== 'admin') {
          setErrorMsg('Access denied: this account does not have administrator privileges.');
          toast.error('Unauthorized user account');
          return;
        }
        toast.success(`Welcome to Admin Console, ${res.data.user.name}`);
        navigate('/admin');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid administrator credentials';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        padding: '2rem'
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '2.5rem',
          background: '#1e293b',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#ffffff',
          boxShadow: 'var(--shadow-xl)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto',
              color: '#ffffff'
            }}
          >
            <ShieldCheck size={26} />
          </div>
          <h2 style={{ color: '#ffffff', fontSize: '1.6rem', marginBottom: '0.35rem' }}>
            Stayzio Admin Console
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            Restricted operations portal for authorized management personnel
          </p>
        </div>

        {errorMsg && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid #ef4444',
              color: '#fca5a5',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: '1.25rem'
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Demo Fill Helper */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            border: '1px dashed rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            Default: <strong>admin@stayzio.com</strong>
          </div>
          <button
            type="button"
            onClick={() => {
              setEmail('admin@stayzio.com');
              setPassword('Admin@123456');
            }}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
          >
            Fill Admin
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ color: '#cbd5e1' }}>Admin Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ background: '#0f172a', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.15)' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label className="form-label" style={{ color: '#cbd5e1' }}>Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ background: '#0f172a', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.15)' }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading}
          >
            <Lock size={16} />
            {loading ? 'Authenticating...' : 'Sign In to Console'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link
            to="/"
            style={{
              fontSize: '0.85rem',
              color: '#94a3b8',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <ArrowLeft size={15} /> Return to Public Discovery
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
