import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerAPI, bookingAPI } from '../../services/api';

const VEHICLE_TYPES = ['Any', 'Container Truck', 'Lorry', 'Mini Truck', 'Tanker', 'Flatbed', 'Refrigerated Truck'];
const GOODS_TYPES = ['General Goods', 'Furniture', 'Electronics', 'Agricultural Produce', 'Construction Materials', 'Food & Beverages', 'Chemicals', 'Textiles'];

function ScoreBar({ label, value, max }) {
  const pct = Math.round((value / max) * 100);
  const cls = pct >= 70 ? 'high' : pct >= 40 ? 'medium' : 'low';
  return (
    <div className="score-bar-wrapper">
      <div className="score-bar-label">
        <span>{label}</span>
        <span>{value}/{max}</span>
      </div>
      <div className="score-bar">
        <div className={`score-bar-fill ${cls}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function TruckResultCard({ result, onBook }) {
  const [expanded, setExpanded] = useState(false);
  const score = result.total_score;
  const scoreClass = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';

  const statusMap = {
    available: 'badge-available', delivered: 'badge-delivered',
    in_transit: 'badge-transit', loading: 'badge-loading',
    unavailable: 'badge-unavailable', offline: 'badge-offline',
  };

  return (
    <div className="truck-card">
      <div className="truck-card-header">
        <div>
          <div className="truck-number">🚛 {result.truck_number}</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Driver: {result.driver_name}</div>
        </div>
        <div className="compatibility-score">
          <div className={`score-circle ${scoreClass}`}>
            {score}
            <span className="score-label">/100</span>
          </div>
        </div>
      </div>

      <div className="truck-meta">
        <span className="truck-meta-item">🚚 {result.vehicle_type}</span>
        <span className="truck-meta-item">⚖️ {result.capacity}T</span>
        <span className="truck-meta-item">📦 {result.goods_type}</span>
        <span className="truck-meta-item">📍 {result.current_location || 'Unknown'}</span>
        <span className={`badge ${statusMap[result.availability_status] || 'badge-available'}`}>
          {result.availability_status?.toUpperCase()}
        </span>
      </div>

      {result.preferred_routes && (
        <div style={{ fontSize: 12, color: '#2d6cdf', marginBottom: 8 }}>
          🗺️ Route: {result.preferred_routes}
        </div>
      )}

      {/* AI Match Analysis */}
      {expanded && (
        <div style={{ background: '#f8fafc', borderRadius: 8, padding: 14, marginTop: 12, marginBottom: 12 }}>
          <h4 style={{ color: '#1a3a6e', marginBottom: 10, fontSize: 13 }}>🤖 AI MATCH ANALYSIS</h4>
          <ScoreBar label="Route Compatibility" value={result.route_score} max={30} />
          <ScoreBar label="Capacity Match" value={result.capacity_score} max={20} />
          <ScoreBar label="Vehicle Type" value={result.vehicle_score} max={15} />
          <ScoreBar label="Goods Type" value={result.goods_score} max={10} />
          <ScoreBar label="Availability" value={result.availability_score} max={10} />
          <ScoreBar label="Distance" value={result.distance_score} max={10} />
          <ScoreBar label="Timing" value={result.timing_score} max={5} />
          <div style={{ marginTop: 12, padding: 10, background: '#dbeafe', borderRadius: 6, fontSize: 12, color: '#1e40af', lineHeight: 1.5 }}>
            💡 {result.explanation}
          </div>
        </div>
      )}

      <div className="truck-actions">
        <button className="btn btn-ghost btn-sm" onClick={() => setExpanded(!expanded)}>
          {expanded ? '▲ Hide Analysis' : '🔍 View AI Analysis'}
        </button>
        <button className="btn btn-primary btn-sm" onClick={() => onBook(result)}>
          📋 Book This Truck
        </button>
      </div>
    </div>
  );
}

function BookingModal({ result, form, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } catch (e) {
      setError(e.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📋 Confirm Booking</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
          {[
            ['Truck', `${result.truck_number} (${result.vehicle_type})`],
            ['Driver', result.driver_name],
            ['Pickup', form.pickup_location],
            ['Destination', form.destination],
            ['Goods', form.goods_type],
            ['Weight', `${form.weight} Tons`],
            ['Date', form.pickup_date || 'Flexible'],
            ['Time', form.pickup_time || 'Flexible'],
            ['Compatibility Score', `${result.total_score}/100`],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 8 }}>
              <span style={{ color: '#64748b', fontWeight: 500 }}>{k}</span>
              <span style={{ fontWeight: 600, color: '#1e293b', maxWidth: '60%', textAlign: 'right' }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button className="btn btn-primary" onClick={handleConfirm} disabled={loading} style={{ flex: 2 }}>
            {loading ? '⏳ Booking...' : '✅ Confirm Booking'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FindTruck() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    pickup_location: '', destination: '', goods_type: 'General Goods',
    weight: '', vehicle_type: 'Any', required_capacity: '', pickup_date: '', pickup_time: ''
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookTarget, setBookTarget] = useState(null);
  const [bookSuccess, setBookSuccess] = useState(false);
  const [filter, setFilter] = useState({ minScore: 0, vehicleType: 'All', sortBy: 'score' });

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!form.pickup_location || !form.destination) {
      setError('Please enter pickup location and destination.'); return;
    }
    if (!form.weight) { setError('Please enter the weight.'); return; }
    setError(''); setLoading(true); setResults(null);
    try {
      const payload = {
        pickup_location: form.pickup_location,
        destination: form.destination,
        goods_type: form.goods_type,
        weight: parseFloat(form.weight),
        vehicle_type: form.vehicle_type === 'Any' ? null : form.vehicle_type,
        required_capacity: form.required_capacity ? parseFloat(form.required_capacity) : null,
        pickup_date: form.pickup_date || null,
        pickup_time: form.pickup_time || null,
      };
      const res = await customerAPI.findTrucks(payload);
      setResults(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (result) => {
    try {
      const res = await bookingAPI.create({
        truck_id: result.truck_id,
        pickup_location: form.pickup_location,
        destination: form.destination,
        goods_type: form.goods_type,
        weight: parseFloat(form.weight),
        pickup_date: form.pickup_date || null,
        pickup_time: form.pickup_time || null,
        compatibility_score: result.total_score,
      });
      setBookTarget(null);
      setBookSuccess(true);
      setTimeout(() => navigate('/customer/bookings'), 2000);
    } catch (err) {
      throw new Error(err.response?.data?.detail || 'Booking failed');
    }
  };

  // Filter & sort results
  const filteredResults = results ? results
    .filter(r => r.total_score >= filter.minScore)
    .filter(r => filter.vehicleType === 'All' || r.vehicle_type === filter.vehicleType)
    .sort((a, b) => {
      if (filter.sortBy === 'score') return b.total_score - a.total_score;
      if (filter.sortBy === 'capacity') return b.capacity - a.capacity;
      return 0;
    }) : [];

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>🔍 Find a Truck</h1>
        <p>Enter your requirements. Our AI engine will match the best available trucks.</p>
      </div>

      {bookSuccess && (
        <div className="alert alert-success">
          ✅ Booking created! The driver has been notified. Redirecting to your bookings...
        </div>
      )}

      {/* Search Form */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 16 }}>📦 Shipment Details</h3>
        <form onSubmit={handleSearch}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Pickup Location</label>
              <input className="form-input" placeholder="e.g., Bangalore" value={form.pickup_location} onChange={set('pickup_location')} />
            </div>
            <div className="form-group">
              <label className="form-label">Destination</label>
              <input className="form-input" placeholder="e.g., Chennai" value={form.destination} onChange={set('destination')} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Goods Type</label>
              <select className="form-input" value={form.goods_type} onChange={set('goods_type')}>
                {GOODS_TYPES.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Weight (Tons)</label>
              <input className="form-input" type="number" step="0.1" placeholder="e.g., 6" value={form.weight} onChange={set('weight')} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Vehicle Type</label>
              <select className="form-input" value={form.vehicle_type} onChange={set('vehicle_type')}>
                {VEHICLE_TYPES.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Required Capacity (Tons)</label>
              <input className="form-input" type="number" step="0.5" placeholder="Optional" value={form.required_capacity} onChange={set('required_capacity')} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Pickup Date</label>
              <input className="form-input" type="date" value={form.pickup_date} onChange={set('pickup_date')} />
            </div>
            <div className="form-group">
              <label className="form-label">Pickup Time</label>
              <input className="form-input" type="time" value={form.pickup_time} onChange={set('pickup_time')} />
            </div>
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
            {loading ? '⏳ Finding trucks...' : '🤖 Find Suitable Trucks'}
          </button>
        </form>
      </div>

      {/* Results */}
      {loading && (
        <div className="loading-center">
          <div>
            <div className="spinner" />
            <p style={{ textAlign: 'center', color: '#64748b' }}>🤖 AI matching engine analyzing trucks...</p>
          </div>
        </div>
      )}

      {results !== null && !loading && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <h2 style={{ fontSize: 18 }}>
              🚛 {results.length > 0 ? `${results.length} Truck${results.length > 1 ? 's' : ''} Found` : 'No Trucks Found'}
            </h2>
            {results.length > 0 && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <select className="form-input" style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }}
                  value={filter.sortBy} onChange={e => setFilter(f => ({ ...f, sortBy: e.target.value }))}>
                  <option value="score">Best Match</option>
                  <option value="capacity">Highest Capacity</option>
                </select>
              </div>
            )}
          </div>

          {results.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>No suitable trucks are currently available for your requirements.</h3>
              <p>Try changing your pickup location, destination, or vehicle type. More trucks may be available later.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {filteredResults.map((result, i) => (
                <div key={result.truck_id} style={{ position: 'relative' }}>
                  {i === 0 && (
                    <div style={{ position: 'absolute', top: -8, right: 16, background: '#f59e0b', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 10, padding: '2px 8px', zIndex: 1 }}>
                      ⭐ BEST MATCH
                    </div>
                  )}
                  <TruckResultCard result={result} onBook={setBookTarget} />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Booking Modal */}
      {bookTarget && (
        <BookingModal
          result={bookTarget}
          form={form}
          onClose={() => setBookTarget(null)}
          onConfirm={() => handleBook(bookTarget)}
        />
      )}
    </div>
  );
}
