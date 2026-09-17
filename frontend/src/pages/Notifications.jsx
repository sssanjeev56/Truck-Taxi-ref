import { useState, useEffect } from 'react';
import { notificationAPI } from '../services/api';

const TYPE_ICON = {
  booking_request: '📥', booking_confirmed: '✅', booking_rejected: '❌',
  trip_started: '🚛', trip_completed: '🎉', truck_available: '🟢',
  return_load: '🔄', booking_cancelled: '🚫', general: 'ℹ️'
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getAll();
      setNotifications(res.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const markRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications(ns => ns.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications(ns => ns.map(n => ({ ...n, is_read: true })));
    } catch { /* silent */ }
  };

  const unread = notifications.filter(n => !n.is_read).length;

  if (loading) return <div className="page-content"><div className="spinner" /></div>;

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>🔔 Notifications</h1>
          <p>{unread} unread notification{unread !== 1 ? 's' : ''}</p>
        </div>
        {unread > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={markAllRead}>
            Mark All Read
          </button>
        )}
      </div>

      <div className="card">
        {notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔔</div>
            <h3>No notifications yet</h3>
            <p>Booking updates, trip status, and return-load opportunities will appear here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {notifications.map((n, idx) => (
              <div
                key={n.id}
                style={{
                  display: 'flex', gap: 14, padding: '14px 16px',
                  background: n.is_read ? '#fff' : '#f0f7ff',
                  borderBottom: idx < notifications.length - 1 ? '1px solid #f1f5f9' : 'none',
                  borderRadius: idx === 0 ? '8px 8px 0 0' : idx === notifications.length - 1 ? '0 0 8px 8px' : 0,
                  transition: 'background 0.2s ease',
                }}
              >
                <div style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>
                  {TYPE_ICON[n.type] || 'ℹ️'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: n.is_read ? 500 : 700, fontSize: 14, color: '#1e293b' }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0, marginLeft: 12 }}>
                      {new Date(n.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 3, lineHeight: 1.5 }}>{n.message}</div>
                  {!n.is_read && (
                    <button
                      style={{ marginTop: 8, fontSize: 12, color: '#2d6cdf', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                      onClick={() => markRead(n.id)}
                    >
                      Mark as read
                    </button>
                  )}
                </div>
                {!n.is_read && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2d6cdf', flexShrink: 0, marginTop: 6 }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
