import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { trackingAPI } from '../../services/api';

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const statusColor = { available: '#10b981', in_transit: '#3b82f6', loading: '#f59e0b', delivered: '#8b5cf6', unavailable: '#ef4444', offline: '#94a3b8' };

export default function TruckTracking() {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchTrucks();
    const interval = setInterval(fetchTrucks, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchTrucks = async () => {
    try {
      const res = await trackingAPI.getAllTrucks();
      setTrucks(res.data.trucks || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const center = trucks.length > 0 && trucks[0].latitude
    ? [trucks[0].latitude, trucks[0].longitude]
    : [12.9716, 77.5946]; // Bangalore default

  return (
    <div className="page-content" style={{ maxWidth: '100%', padding: 0 }}>
      <div style={{ padding: '24px 24px 0' }}>
        <div className="page-header">
          <h1>📍 Truck Tracking</h1>
          <p>Real-time locations of available trucks. Updates every 30 seconds.</p>
        </div>

        {trucks.some(t => t.is_demo_location) && (
          <div className="alert alert-info" style={{ marginBottom: 16 }}>
            ℹ️ <strong>Demo Mode:</strong> Some truck positions are demonstration data. In production, real GPS coordinates from drivers will be used.
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 0, height: 'calc(100vh - 200px)', minHeight: 500 }}>
        {/* Map */}
        <div style={{ flex: 1, position: 'relative' }}>
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : (
            <MapContainer center={center} zoom={9} style={{ width: '100%', height: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {trucks.map(truck => (
                <Marker
                  key={truck.id}
                  position={[truck.latitude, truck.longitude]}
                  eventHandlers={{ click: () => setSelected(truck) }}
                >
                  <Popup>
                    <div style={{ minWidth: 180 }}>
                      <strong>🚛 {truck.truck_number}</strong><br />
                      <span>{truck.vehicle_type}</span><br />
                      <span>Capacity: {truck.capacity}T</span><br />
                      <span>Location: {truck.current_location || 'Unknown'}</span><br />
                      <span style={{ color: statusColor[truck.availability_status] || '#333', fontWeight: 700 }}>
                        {truck.availability_status?.toUpperCase()}
                      </span>
                      {truck.is_demo_location && (
                        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>📌 Demo location</div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>

        {/* Side Panel */}
        <div style={{ width: 280, background: '#fff', borderLeft: '1px solid #e2e8f0', overflowY: 'auto', padding: 16 }}>
          <h3 style={{ marginBottom: 12, fontSize: 14, color: '#1a3a6e' }}>🚛 {trucks.length} Trucks</h3>
          {trucks.length === 0 ? (
            <div className="empty-state" style={{ padding: 20 }}>
              <div className="empty-icon" style={{ fontSize: 32 }}>🔍</div>
              <p>No trucks with location data available.</p>
            </div>
          ) : (
            trucks.map(truck => (
              <div
                key={truck.id}
                onClick={() => setSelected(truck)}
                style={{
                  padding: '10px 12px', borderRadius: 8,
                  border: selected?.id === truck.id ? '2px solid #2d6cdf' : '1px solid #e2e8f0',
                  marginBottom: 8, cursor: 'pointer',
                  background: selected?.id === truck.id ? '#dbeafe' : '#fff',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#1a3a6e' }}>🚛 {truck.truck_number}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{truck.vehicle_type} • {truck.capacity}T</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>📍 {truck.current_location || 'Unknown'}</div>
                  </div>
                  <span
                    style={{
                      fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 10,
                      background: statusColor[truck.availability_status] + '20',
                      color: statusColor[truck.availability_status],
                      textTransform: 'uppercase'
                    }}
                  >
                    {truck.availability_status}
                  </span>
                </div>
                {truck.is_demo_location && (
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>📌 Demo</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
