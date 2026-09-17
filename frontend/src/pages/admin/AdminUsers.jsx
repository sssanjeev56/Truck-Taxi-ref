import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    adminAPI.users()
      .then(res => { setUsers(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleToggle = async (id) => {
    setToggling(id);
    try {
      await adminAPI.toggleUserActive(id);
      setUsers(us => us.map(u => u.id === id ? { ...u, is_active: !u.is_active } : u));
    } catch (e) { alert(e.response?.data?.detail || 'Failed'); }
    finally { setToggling(null); }
  };

  const filtered = users.filter(u => filter === 'all' || u.role === filter);

  if (loading) return <div className="page-content"><div className="spinner" /></div>;

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>👥 Users</h1>
        <p>{users.length} total users registered</p>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="tabs" style={{ flex: 'none', width: 'auto', marginBottom: 0 }}>
            {['all', 'customer', 'driver', 'admin'].map(r => (
              <button key={r} className={`tab ${filter === r ? 'active' : ''}`} onClick={() => setFilter(r)}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Logins</th>
                <th>Last Login</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                  <td>{u.email}</td>
                  <td>{u.phone || '—'}</td>
                  <td><span className={`badge badge-${u.role}`}>{u.role?.toUpperCase()}</span></td>
                  <td>{u.login_count || 0}</td>
                  <td>{u.last_login_at ? new Date(u.last_login_at).toLocaleDateString('en-IN') : 'Never'}</td>
                  <td>
                    <span className={`badge ${u.is_active ? 'badge-available' : 'badge-unavailable'}`}>
                      {u.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td>{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                  <td>
                    {u.role !== 'admin' && (
                      <button
                        className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => handleToggle(u.id)}
                        disabled={toggling === u.id}
                      >
                        {toggling === u.id ? '...' : u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
