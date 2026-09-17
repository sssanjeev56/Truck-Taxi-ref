import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.dashboard()
      .then(res => { setData(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-content"><div className="spinner" /></div>;

  const stats = data?.stats || {};
  const vehicleDist = data?.vehicle_distribution || {};
  const bookingDist = data?.booking_distribution || {};

  const statCards = [
    { label: 'Total Users', value: stats.total_users ?? 0, icon: '👥', color: '#dbeafe' },
    { label: 'Customers', value: stats.total_customers ?? 0, icon: '👤', color: '#ede9fe' },
    { label: 'Drivers', value: stats.total_drivers ?? 0, icon: '🚛', color: '#d1fae5' },
    { label: 'Trucks', value: stats.total_trucks ?? 0, icon: '🚚', color: '#fef3c7' },
    { label: 'Available Trucks', value: stats.available_trucks ?? 0, icon: '✅', color: '#d1fae5' },
    { label: 'Active Bookings', value: stats.active_bookings ?? 0, icon: '📋', color: '#dbeafe' },
    { label: 'Completed Trips', value: stats.completed_trips ?? 0, icon: '🎯', color: '#fce7f3' },
  ];

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>⚙️ Admin Dashboard</h1>
        <p>Platform overview and management</p>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        {statCards.map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{ background: s.color }}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Vehicle Distribution */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>🚛 Vehicle Type Distribution</h3>
          {Object.keys(vehicleDist).length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: 13 }}>Not enough data yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(vehicleDist).map(([type, count]) => {
                const total = Object.values(vehicleDist).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={type}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{type}</span>
                      <span style={{ color: '#64748b' }}>{count} ({pct}%)</span>
                    </div>
                    <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: '#2d6cdf', borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Booking Distribution */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>📋 Booking Status Distribution</h3>
          {Object.keys(bookingDist).length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: 13 }}>Not enough data yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(bookingDist).map(([status, count]) => {
                const total = Object.values(bookingDist).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                const colorMap = { pending: '#f59e0b', confirmed: '#10b981', in_transit: '#3b82f6', completed: '#8b5cf6', rejected: '#ef4444', cancelled: '#94a3b8' };
                return (
                  <div key={status}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{status.replace('_', ' ')}</span>
                      <span style={{ color: '#64748b' }}>{count} ({pct}%)</span>
                    </div>
                    <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: colorMap[status] || '#2d6cdf', borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
