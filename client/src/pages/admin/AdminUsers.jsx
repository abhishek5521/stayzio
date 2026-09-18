import React, { useState, useEffect } from 'react';
import { Search, ShieldAlert, User, ShieldCheck } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const toast = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminService.getUsers({ search: search.trim() || undefined, limit: 50 });
      if (res.success) {
        setUsers(res.data.users || []);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      toast.error('Failed to load user accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleRole = async (userId, currentRole, userName) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Change role of ${userName} to ${newRole.toUpperCase()}?`)) return;

    try {
      const res = await adminService.updateUserRole(userId, newRole);
      if (res.success) {
        toast.success(res.message);
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user role');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="admin-page-title">User Account Directory</h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.9rem' }}>
          Inspect registered guests, total booking history, and manage administrative privileges
        </p>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchUsers();
            }}
            style={{ position: 'relative', width: '340px' }}
          >
            <input
              type="text"
              className="form-control"
              placeholder="Search user by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.5rem', fontSize: '0.88rem' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          </form>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Registered Accounts: <strong>{users.length}</strong>
          </span>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Guest Profile</th>
                <th>Contact Phone</th>
                <th>Role</th>
                <th>Bookings Count</th>
                <th>Joined Date</th>
                <th style={{ textAlign: 'right' }}>Role Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem' }}>
                    Loading user accounts...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-muted)' }}>
                    No users found matching query.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img
                          src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                          alt={u.name}
                          style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div>
                          <strong style={{ color: 'var(--color-primary)' }}>{u.name}</strong>
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{u.phone || '—'}</td>
                    <td>
                      <span className={`badge badge-${u.role === 'admin' ? 'gold' : 'neutral'}`}>
                        {u.role === 'admin' ? 'Administrator' : 'Guest'}
                      </span>
                    </td>
                    <td>
                      <strong>{u.bookingCount || 0}</strong> stays
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleToggleRole(u._id, u.role, u.name)}
                        className={`btn btn-sm ${u.role === 'admin' ? 'btn-secondary' : 'btn-outline'}`}
                        style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                      >
                        {u.role === 'admin' ? 'Revoke Admin' : 'Grant Admin'}
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

export default AdminUsers;
