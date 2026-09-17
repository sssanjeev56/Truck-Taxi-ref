import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

const STATUS_BADGE = {
  available: 'badge-available', unavailable: 'badge-unavailable',
  loading: 'badge-loading', in_transit: 'badge-transit',
  delivered: 'badge-delivered', offline: 'badge-offline',
  pending: 'badge-pending', confirmed: 'badge-confirmed',
  completed: 'badge-completed', rejected: 'badge-rejected', cancelled: 'badge-cancelled',
};

export default function AdminTrucks() {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.trucks()
      .then(res => { setTrucks(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-content"><div className="spinner" /></div>;

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>🚛 Trucks</h1>
        <p>{trucks.length} trucks registered on the platform</p>
      </div>
      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Truck #</th>
                <th>Vehicle Type</th>
                <th>Capacity</th>
                <th>Goods</th>
                <th>Driver</th>
                <th>Location</th>
                <th>Status</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {trucks.map(t => (
                <tr key={t.id}>
                  <td><strong>{t.truck_number}</strong></td>
                  <td>{t.vehicle_type}</td>
                  <td>{t.capacity}T</td>
                  <td>{t.goods_type}</td>
                  <td>{t.driver_name || '—'}</td>
                  <td>{t.current_location || '—'}</td>
                  <td><span className={`badge ${STATUS_BADGE[t.availability_status] || 'badge-available'}`}>{t.availability_status?.toUpperCase()}</span></td>
                  <td>{new Date(t.last_updated).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.bookings()
      .then(res => { setBookings(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-content"><div className="spinner" /></div>;

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>📋 Bookings</h1>
        <p>{bookings.length} bookings total</p>
      </div>
      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Customer</th>
                <th>Driver</th>
                <th>Truck</th>
                <th>From</th>
                <th>To</th>
                <th>Goods</th>
                <th>Weight</th>
                <th>Date</th>
                <th>Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id}>
                  <td>#{b.id}</td>
                  <td>{b.customer_name || '—'}</td>
                  <td>{b.driver_name || '—'}</td>
                  <td>{b.truck_number || '—'}</td>
                  <td>{b.pickup_location}</td>
                  <td>{b.destination}</td>
                  <td>{b.goods_type}</td>
                  <td>{b.weight}T</td>
                  <td>{b.pickup_date || '—'}</td>
                  <td>{b.compatibility_score ? `${b.compatibility_score}/100` : '—'}</td>
                  <td><span className={`badge ${STATUS_BADGE[b.status] || 'badge-pending'}`}>{b.status?.toUpperCase()}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function AdminTrips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.trips()
      .then(res => { setTrips(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-content"><div className="spinner" /></div>;

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>🗺️ Trips</h1>
        <p>{trips.length} trips total</p>
      </div>
      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Trip #</th>
                <th>Customer</th>
                <th>Driver</th>
                <th>Truck</th>
                <th>From</th>
                <th>To</th>
                <th>Status</th>
                <th>Started</th>
                <th>Completed</th>
              </tr>
            </thead>
            <tbody>
              {trips.map(t => (
                <tr key={t.id}>
                  <td>#{t.id}</td>
                  <td>{t.customer_name || '—'}</td>
                  <td>{t.driver_name || '—'}</td>
                  <td>{t.truck_number || '—'}</td>
                  <td>{t.pickup_location || '—'}</td>
                  <td>{t.destination || '—'}</td>
                  <td><span className={`badge ${STATUS_BADGE[t.status] || 'badge-transit'}`}>{t.status?.replace('_', ' ').toUpperCase()}</span></td>
                  <td>{t.started_at ? new Date(t.started_at).toLocaleDateString('en-IN') : '—'}</td>
                  <td>{t.completed_at ? new Date(t.completed_at).toLocaleDateString('en-IN') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
