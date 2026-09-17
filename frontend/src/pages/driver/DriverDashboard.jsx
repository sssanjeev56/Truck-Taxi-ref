import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { driverAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const STATUS_BADGE = {
  available: 'badge-available', unavailable: 'badge-unavailable',
  loading: 'badge-loading', in_transit: 'badge-transit',
  delivered: 'badge-delivered', offline: 'badge-offline',
};

const BOOKING_STATUS_BADGE = {
  pending: 'badge-pending', confirmed: 'badge-confirmed',
  in_transit: 'badge-transit', completed: 'badge-completed',
  rejected: 'badge-rejected', cancelled: 'badge-cancelled',
};

export default function DriverDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(null);

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      const res = await driverAPI.dashboard();
      setData(res.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const handleAvailability = async (status) => {
    setActioning('avail');
    try {
      await driverAPI.setAvailability(status);
      fetchDashboard();
    } catch (e) { alert(e.response?.data?.detail || 'Failed to update'); }
    finally { setActioning(null); }
  };

  const handleAccept = async (id) => {
    setActioning(id);
    try {
      await driverAPI.acceptRequest(id);
      fetchDashboard();
    } catch (e) { alert(e.response?.data?.detail || 'Failed to accept'); }
    finally { setActioning(null); }
  };

  const handleReject = async (id) => {
    setActioning(id);
    try {
      await driverAPI.rejectRequest(id);
      fetchDashboard();
    } catch (e) { alert(e.response?.data?.detail || 'Failed to reject'); }
    finally { setActioning(null); }
  };

  if (loading) return <div className="page-content"><div className="spinner" /></div>;

  const truck = data?.truck;
  const isFirstLogin = data?.is_first_login;
  const pendingBookings = data?.pending_bookings || [];
  const activeTrip = data?.active_trip;

  return (
    <div className="page-content">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div>
          <div className="welcome-tag">{isFirstLogin ? '🎉 WELCOME' : '👋 WELCOME BACK'}</div>
          <h2>{isFirstLogin ? `Welcome, ${user?.full_name?.split(' ')[0]}!` : `Welcome Back, ${user?.full_name?.split(' ')[0]}!`}</h2>
          <p>{isFirstLogin ? "Let's get your first journey started." : 'Good to see you again.'}</p>
        </div>
        <div className="welcome-icon">🚛</div>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        {[
          { label: 'Truck Status', value: truck?.availability_status?.toUpperCase() || 'NO TRUCK', icon: '🚛', color: '#dbeafe' },
          { label: 'Pending Requests', value: data?.pending_requests_count ?? 0, icon: '📥', color: '#fef3c7' },
          { label: 'Active Trip', value: activeTrip ? 'IN PROGRESS' : 'NONE', icon: '🗺️', color: '#d1fae5' },
          { label: 'Completed Trips', value: data?.completed_trips ?? 0, icon: '✅', color: '#ede9fe' },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{ background: s.color }}>{s.icon}</div>
            <div className="stat-value" style={{ fontSize: typeof s.value === 'string' && s.value.length > 6 ? '1rem' : '2rem' }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* My Truck */}
      {truck && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h3>🚛 My Truck</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/driver/truck')}>Edit Truck</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Truck Number', value: truck.truck_number },
              { label: 'Vehicle Type', value: truck.vehicle_type },
              { label: 'Capacity', value: `${truck.capacity} Tons` },
              { label: 'Current Location', value: truck.current_location || 'Not Set' },
              { label: 'Goods Supported', value: truck.goods_type },
              { label: 'Preferred Routes', value: truck.preferred_routes || 'Not Set' },
            ].map(item => (
              <div key={item.label} style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>{item.label}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{item.value}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span className={`badge ${STATUS_BADGE[truck.availability_status] || 'badge-available'}`} style={{ fontSize: 13, padding: '5px 14px' }}>
              {truck.availability_status?.toUpperCase()}
            </span>
            <button
              className="btn btn-success btn-sm"
              onClick={() => handleAvailability('available')}
              disabled={actioning === 'avail' || truck.availability_status === 'available'}
            >
              ✅ Set Available
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => handleAvailability('unavailable')}
              disabled={actioning === 'avail' || truck.availability_status === 'unavailable'}
            >
              ⛔ Set Unavailable
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/driver/tracking')}>
              📍 Update Location
            </button>
          </div>
        </div>
      )}

      {!truck && (
        <div className="alert alert-info">
          No truck registered yet. Your truck should have been created during registration.
          <button className="btn btn-blue btn-sm" style={{ marginLeft: 12 }} onClick={() => navigate('/driver/truck')}>
            Manage Truck
          </button>
        </div>
      )}

      {/* Active Trip */}
      {activeTrip && (
        <div className="card" style={{ marginBottom: 20, borderLeft: '4px solid #2d6cdf' }}>
          <h3 style={{ marginBottom: 12 }}>🗺️ Active Trip</h3>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className={`badge ${BOOKING_STATUS_BADGE[activeTrip.status] || 'badge-transit'}`} style={{ fontSize: 13 }}>
              {activeTrip.status?.toUpperCase()}
            </span>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/driver/trips')}>
              Manage Trip →
            </button>
          </div>
        </div>
      )}

      {/* Booking Requests */}
      <div className="card">
        <div className="card-header">
          <h3>📥 Booking Requests</h3>
          <span style={{ fontSize: 12, color: '#64748b' }}>{pendingBookings.length} pending</span>
        </div>
        {pendingBookings.length === 0 ? (
          <div className="empty-state" style={{ padding: 30 }}>
            <div className="empty-icon" style={{ fontSize: 36 }}>📥</div>
            <h3>No pending requests</h3>
            <p>New booking requests from customers will appear here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pendingBookings.map(b => (
              <div key={b.id} style={{ padding: 16, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1a3a6e', fontSize: 14 }}>
                      📦 {b.pickup_location} → {b.destination}
                    </div>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                      Customer: {b.customer_name || 'Unknown'} • {b.goods_type} • {b.weight}T
                    </div>
                    {b.pickup_date && (
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                        📅 {b.pickup_date} {b.pickup_time && `at ${b.pickup_time}`}
                      </div>
                    )}
                  </div>
                  {b.compatibility_score && (
                    <div style={{
                      background: b.compatibility_score >= 70 ? '#d1fae5' : b.compatibility_score >= 40 ? '#fef3c7' : '#fee2e2',
                      color: b.compatibility_score >= 70 ? '#065f46' : b.compatibility_score >= 40 ? '#92400e' : '#991b1b',
                      borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 700,
                    }}>
                      {b.compatibility_score}/100
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => handleAccept(b.id)}
                    disabled={actioning === b.id}
                  >
                    {actioning === b.id ? '⏳...' : '✅ Accept'}
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleReject(b.id)}
                    disabled={actioning === b.id}
                  >
                    {actioning === b.id ? '⏳...' : '❌ Reject'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
