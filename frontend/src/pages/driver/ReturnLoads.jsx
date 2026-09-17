import { useState, useEffect } from 'react';
import { driverAPI } from '../../services/api';

export default function ReturnLoads() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchReturnLoads(); }, []);

  const fetchReturnLoads = async () => {
    try {
      const res = await driverAPI.getReturnLoads();
      setData(res.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  if (loading) return <div className="page-content"><div className="spinner" /></div>;

  const loads = data?.return_loads || [];

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>🔄 Return Load Opportunities</h1>
        <p>
          Smart AI-detected return-load opportunities near your current location.
          {data?.truck_location && ` Your truck is in: ${data.truck_location}`}
        </p>
      </div>

      {/* How it works */}
      <div className="alert alert-info" style={{ marginBottom: 20 }}>
        💡 <strong>Smart Return Loading:</strong> When you complete a delivery, Truck Taxi automatically scans for customer requests near your current location — helping you find your next job without driving back empty.
      </div>

      {loads.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔄</div>
          <h3>No return load opportunities found</h3>
          <p>
            {data?.message || 'No matching customer requests near your location. Complete a delivery first, or check back later.'}
          </p>
          <div style={{ marginTop: 20, fontSize: 13, color: '#64748b', maxWidth: 400 }}>
            <strong>How return loads work:</strong>
            <ol style={{ marginTop: 8, paddingLeft: 20, lineHeight: 2 }}>
              <li>Complete your current delivery</li>
              <li>Truck automatically becomes available</li>
              <li>System searches customer requests at your destination</li>
              <li>Matching opportunities appear here</li>
            </ol>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loads.map((load, i) => {
            const score = load.total_score;
            const scoreClass = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
            return (
              <div key={load.request_id} className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, background: '#fef3c7', color: '#92400e', borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>
                        RETURN LOAD #{i + 1}
                      </span>
                    </div>
                    <h4 style={{ color: '#1a3a6e' }}>
                      📦 {load.pickup_location} → {load.destination}
                    </h4>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                      Customer: {load.customer_name} • {load.goods_type} • {load.weight}T
                    </div>
                    {load.pickup_date && (
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>
                        📅 {load.pickup_date} {load.pickup_time && `at ${load.pickup_time}`}
                      </div>
                    )}
                  </div>
                  <div className={`score-circle ${scoreClass}`} style={{ width: 56, height: 56, fontSize: 16 }}>
                    {score}
                    <span className="score-label">/100</span>
                  </div>
                </div>

                {/* Score breakdown */}
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12, marginTop: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1a3a6e', marginBottom: 8 }}>Match Analysis</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {[
                      ['Route', load.route_score, 30],
                      ['Capacity', load.capacity_score, 20],
                      ['Vehicle', load.vehicle_score, 15],
                      ['Goods', load.goods_score, 10],
                      ['Distance', load.distance_score, 10],
                      ['Timing', load.timing_score, 5],
                    ].map(([label, val, max]) => (
                      <div key={label} style={{ fontSize: 11, color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{label}</span>
                        <span style={{ fontWeight: 700, color: val >= max * 0.7 ? '#10b981' : val >= max * 0.4 ? '#f59e0b' : '#ef4444' }}>
                          {val}/{max}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  <a
                    href={`/customer/find-truck`}
                    className="btn btn-accent btn-sm"
                    style={{ textDecoration: 'none' }}
                  >
                    🔄 Accept Return Load
                  </a>
                  <span style={{ fontSize: 12, color: '#94a3b8', alignSelf: 'center' }}>
                    Contact customer through booking system
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
