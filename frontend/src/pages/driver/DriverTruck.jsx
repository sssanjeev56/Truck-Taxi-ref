import { useState, useEffect } from 'react';
import { driverAPI } from '../../services/api';

const VEHICLE_TYPES = ['Container Truck', 'Lorry', 'Mini Truck', 'Tanker', 'Flatbed', 'Refrigerated Truck', 'Tipper'];
const STATUS_OPTS = ['available', 'unavailable', 'loading', 'in_transit', 'delivered', 'offline'];

export default function DriverTruck() {
  const [truck, setTruck] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  // Location update form
  const [locForm, setLocForm] = useState({ location_name: '', latitude: '', longitude: '' });
  const [locSaving, setLocSaving] = useState(false);

  useEffect(() => { fetchTruck(); }, []);

  const fetchTruck = async () => {
    try {
      const res = await driverAPI.getTruck();
      setTruck(res.data);
      if (res.data) {
        setForm({
          vehicle_type: res.data.vehicle_type || '',
          capacity: res.data.capacity || '',
          goods_type: res.data.goods_type || '',
          current_location: res.data.current_location || '',
          preferred_routes: res.data.preferred_routes || '',
          availability_status: res.data.availability_status || 'available',
        });
        setLocForm({
          location_name: res.data.current_location || '',
          latitude: res.data.latitude || '',
          longitude: res.data.longitude || '',
        });
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg(''); setError('');
    try {
      const payload = { ...form };
      if (payload.capacity) payload.capacity = parseFloat(payload.capacity);
      await driverAPI.updateTruck(payload);
      setMsg('✅ Truck details updated successfully.');
      setEditing(false);
      fetchTruck();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update truck.');
    } finally { setSaving(false); }
  };

  const handleSetAvail = async (status) => {
    try {
      await driverAPI.setAvailability(status);
      setMsg(`✅ Status set to ${status}`);
      fetchTruck();
    } catch (e) { setError(e.response?.data?.detail || 'Failed'); }
  };

  const handleLocUpdate = async (e) => {
    e.preventDefault();
    if (!locForm.latitude || !locForm.longitude) { setError('Latitude and longitude are required'); return; }
    setLocSaving(true); setMsg(''); setError('');
    try {
      await driverAPI.updateLocation({
        location_name: locForm.location_name,
        latitude: parseFloat(locForm.latitude),
        longitude: parseFloat(locForm.longitude),
      });
      setMsg('✅ Location updated successfully.');
      fetchTruck();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update location.');
    } finally { setLocSaving(false); }
  };

  if (loading) return <div className="page-content"><div className="spinner" /></div>;

  if (!truck) {
    return (
      <div className="page-content">
        <div className="page-header"><h1>🚛 My Truck</h1></div>
        <div className="alert alert-info">No truck found. It should have been created when you registered.</div>
      </div>
    );
  }

  const statusBadge = {
    available: 'badge-available', unavailable: 'badge-unavailable',
    loading: 'badge-loading', in_transit: 'badge-transit',
    delivered: 'badge-delivered', offline: 'badge-offline',
  };

  return (
    <div className="page-content">
      <div className="page-header"><h1>🚛 My Truck</h1><p>Manage your truck details and availability</p></div>
      {msg && <div className="alert alert-success">{msg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Truck Info Card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div>
            <h3>{truck.truck_number}</h3>
            <span className={`badge ${statusBadge[truck.availability_status] || 'badge-available'}`} style={{ marginTop: 4 }}>
              {truck.availability_status?.toUpperCase()}
            </span>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => setEditing(!editing)}>
            {editing ? '✕ Cancel' : '✏️ Edit'}
          </button>
        </div>

        {!editing ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {[
              ['Vehicle Type', truck.vehicle_type], ['Capacity', `${truck.capacity} Tons`],
              ['Goods Type', truck.goods_type], ['Current Location', truck.current_location || 'Not set'],
              ['Coordinates', truck.latitude ? `${truck.latitude.toFixed(4)}, ${truck.longitude.toFixed(4)}` : 'Not set'],
              ['Preferred Routes', truck.preferred_routes || 'Not set'],
              ['Last Updated', new Date(truck.last_updated).toLocaleString('en-IN')],
            ].map(([k, v]) => (
              <div key={k} style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>{k}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{v}</div>
              </div>
            ))}
          </div>
        ) : (
          <form onSubmit={handleSave}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Vehicle Type</label>
                <select className="form-input" value={form.vehicle_type} onChange={e => setForm(f => ({ ...f, vehicle_type: e.target.value }))}>
                  {VEHICLE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Capacity (Tons)</label>
                <input className="form-input" type="number" step="0.5" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Goods Type Supported</label>
              <input className="form-input" value={form.goods_type} onChange={e => setForm(f => ({ ...f, goods_type: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Preferred Routes</label>
              <input className="form-input" placeholder="e.g., Bangalore → Chennai" value={form.preferred_routes} onChange={e => setForm(f => ({ ...f, preferred_routes: e.target.value }))} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? '⏳ Saving...' : '💾 Save Changes'}
            </button>
          </form>
        )}
      </div>

      {/* Availability Controls */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 12 }}>⚡ Availability Controls</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: '✅ Set Available', value: 'available', cls: 'btn-success' },
            { label: '⛔ Set Unavailable', value: 'unavailable', cls: 'btn-danger' },
            { label: '📦 Set Loading', value: 'loading', cls: 'btn-accent' },
            { label: '🚛 Set In Transit', value: 'in_transit', cls: 'btn-blue' },
          ].map(opt => (
            <button
              key={opt.value}
              className={`btn ${opt.cls} btn-sm`}
              onClick={() => handleSetAvail(opt.value)}
              disabled={truck.availability_status === opt.value}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Location Update */}
      <div className="card">
        <h3 style={{ marginBottom: 12 }}>📍 Update Location</h3>
        <p style={{ fontSize: 13, marginBottom: 16 }}>
          Update your current GPS location. In production, this can be connected to a device GPS.
        </p>
        <form onSubmit={handleLocUpdate}>
          <div className="form-group">
            <label className="form-label">Location Name</label>
            <input className="form-input" placeholder="e.g., Bangalore" value={locForm.location_name} onChange={e => setLocForm(f => ({ ...f, location_name: e.target.value }))} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Latitude</label>
              <input className="form-input" type="number" step="0.0001" placeholder="12.9716" value={locForm.latitude} onChange={e => setLocForm(f => ({ ...f, latitude: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Longitude</label>
              <input className="form-input" type="number" step="0.0001" placeholder="77.5946" value={locForm.longitude} onChange={e => setLocForm(f => ({ ...f, longitude: e.target.value }))} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 12, color: '#64748b' }}>Quick select city coordinates:</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
              {[
                { name: 'Bangalore', lat: 12.9716, lon: 77.5946 },
                { name: 'Chennai', lat: 13.0827, lon: 80.2707 },
                { name: 'Hyderabad', lat: 17.3850, lon: 78.4867 },
                { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
                { name: 'Hosur', lat: 12.7409, lon: 77.8253 },
                { name: 'Coimbatore', lat: 11.0168, lon: 76.9558 },
              ].map(city => (
                <button
                  key={city.name} type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setLocForm({ location_name: city.name, latitude: city.lat, longitude: city.lon })}
                >
                  {city.name}
                </button>
              ))}
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={locSaving}>
            {locSaving ? '⏳ Updating...' : '📍 Update Location'}
          </button>
        </form>
      </div>
    </div>
  );
}
