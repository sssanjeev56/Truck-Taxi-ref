import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerAPI, bookingAPI } from '../../services/api';

const STATUS_BADGE = {
  pending: 'badge-pending', confirmed: 'badge-confirmed',
  in_transit: 'badge-transit', completed: 'badge-completed',
  rejected: 'badge-rejected', cancelled: 'badge-cancelled',
};

export default function CustomerBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => { fetchBookings(); }, []);

  const fetchBookings = async () => {
    try {
      const res = await customerAPI.bookings();
      setBookings(res.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    setCancelling(id);
    try {
      await bookingAPI.updateStatus(id, 'cancelled');
      fetchBookings();
    } catch (e) {
      alert(e.response?.data?.detail || 'Could not cancel booking.');
    } finally { setCancelling(null); }
  };

  if (loading) return <div className="page-content"><div className="spinner" /></div>;

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>📋 My Bookings</h1>
        <p>Track all your truck booking history</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>All Bookings</h3>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/customer/find-truck')}>
            + New Booking
          </button>
        </div>

        {bookings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No bookings yet</h3>
            <p>Find and book your first truck to get started.</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/customer/find-truck')}>
              Find a Truck
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Truck</th>
                  <th>Driver</th>
                  <th>Pickup</th>
                  <th>Destination</th>
                  <th>Goods</th>
                  <th>Weight</th>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id}>
                    <td><strong>#{b.id}</strong></td>
                    <td>{b.truck_number || '—'}</td>
                    <td>{b.driver_name || '—'}</td>
                    <td>{b.pickup_location}</td>
                    <td>{b.destination}</td>
                    <td>{b.goods_type}</td>
                    <td>{b.weight}T</td>
                    <td>{b.pickup_date || '—'}</td>
                    <td>
                      {b.compatibility_score
                        ? <span style={{ fontWeight: 700, color: '#1a3a6e' }}>{b.compatibility_score}/100</span>
                        : '—'}
                    </td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[b.status] || 'badge-pending'}`}>
                        {b.status?.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {b.status === 'pending' && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleCancel(b.id)}
                            disabled={cancelling === b.id}
                          >
                            {cancelling === b.id ? '...' : 'Cancel'}
                          </button>
                        )}
                        {['confirmed', 'in_transit'].includes(b.status) && (
                          <button className="btn btn-blue btn-sm" onClick={() => navigate('/customer/tracking')}>
                            Track
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
