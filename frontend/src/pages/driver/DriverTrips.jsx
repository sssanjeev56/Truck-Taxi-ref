import { useState, useEffect } from 'react';
import { driverAPI } from '../../services/api';

const TRIP_STATUS_FLOW = [
  { status: 'loading', label: '📦 Start Loading', nextStatus: 'in_transit', nextLabel: '🚛 Start Trip' },
  { status: 'in_transit', label: '🚛 In Transit', nextStatus: 'delivered', nextLabel: '📍 Reached Destination' },
  { status: 'delivered', label: '📍 At Destination', nextStatus: 'completed', nextLabel: '✅ Mark Delivered' },
];

const STATUS_BADGE = {
  loading: 'badge-loading', in_transit: 'badge-transit',
  delivered: 'badge-delivered', completed: 'badge-completed',
};

export default function DriverTrips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => { fetchTrips(); }, []);

  const fetchTrips = async () => {
    try {
      const res = await driverAPI.getTrips();
      setTrips(res.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const handleStatusUpdate = async (tripId, newStatus) => {
    setUpdating(tripId);
    try {
      await driverAPI.updateTripStatus(tripId, newStatus);
      setMsg(`✅ Trip status updated to ${newStatus.replace('_', ' ').toUpperCase()}`);
      fetchTrips();
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to update trip status');
    } finally { setUpdating(null); }
  };

  if (loading) return <div className="page-content"><div className="spinner" /></div>;

  const activeTrips = trips.filter(t => t.status !== 'completed');
  const completedTrips = trips.filter(t => t.status === 'completed');

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>🗺️ My Trips</h1>
        <p>Manage your ongoing and completed trips</p>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}

      {/* Active Trips */}
      {activeTrips.length > 0 && (
        <div className="section">
          <div className="section-title">⚡ Active Trips</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {activeTrips.map(trip => {
              const flow = TRIP_STATUS_FLOW.find(f => f.status === trip.status);
              return (
                <div key={trip.id} className="card" style={{ borderLeft: '4px solid #2d6cdf' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <h4 style={{ marginBottom: 4 }}>Trip #{trip.id}</h4>
                      <span className={`badge ${STATUS_BADGE[trip.status]}`}>{trip.status?.replace('_', ' ').toUpperCase()}</span>
                    </div>
                    {flow && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleStatusUpdate(trip.id, flow.nextStatus)}
                        disabled={updating === trip.id}
                      >
                        {updating === trip.id ? '⏳...' : flow.nextLabel}
                      </button>
                    )}
                    {trip.status === 'delivered' && !flow?.nextStatus && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleStatusUpdate(trip.id, 'completed')}
                        disabled={updating === trip.id}
                      >
                        {updating === trip.id ? '⏳...' : '✅ Mark Delivered'}
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
                    {[
                      ['Customer', trip.customer_name || 'Unknown'],
                      ['From', trip.pickup_location || 'Unknown'],
                      ['To', trip.destination || 'Unknown'],
                      ['Goods', trip.goods_type || 'Unknown'],
                      ['Started', trip.started_at ? new Date(trip.started_at).toLocaleString('en-IN') : 'Not started'],
                    ].map(([k, v]) => (
                      <div key={k} style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 6 }}>
                        <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>{k}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Trip progress bar */}
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      {['Loading', 'In Transit', 'Delivered', 'Completed'].map((step, i) => {
                        const stepStatuses = ['loading', 'in_transit', 'delivered', 'completed'];
                        const currentIdx = stepStatuses.indexOf(trip.status);
                        const done = i <= currentIdx;
                        return (
                          <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: '50%',
                              background: done ? '#1a3a6e' : '#e2e8f0',
                              color: done ? '#fff' : '#94a3b8',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 13, fontWeight: 700, marginBottom: 4
                            }}>
                              {done ? '✓' : i + 1}
                            </div>
                            <span style={{ fontSize: 10, color: done ? '#1a3a6e' : '#94a3b8', fontWeight: done ? 700 : 400, textAlign: 'center' }}>
                              {step}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Trips */}
      <div className="section">
        <div className="section-title">✅ Completed Trips ({completedTrips.length})</div>
        {completedTrips.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🗺️</div>
            <h3>No completed trips yet</h3>
            <p>Accept bookings and complete deliveries to see your trip history here.</p>
          </div>
        ) : (
          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Trip #</th>
                    <th>Customer</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Goods</th>
                    <th>Completed</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {completedTrips.map(t => (
                    <tr key={t.id}>
                      <td><strong>#{t.id}</strong></td>
                      <td>{t.customer_name || '—'}</td>
                      <td>{t.pickup_location || '—'}</td>
                      <td>{t.destination || '—'}</td>
                      <td>{t.goods_type || '—'}</td>
                      <td>{t.completed_at ? new Date(t.completed_at).toLocaleDateString('en-IN') : '—'}</td>
                      <td><span className="badge badge-completed">COMPLETED</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
