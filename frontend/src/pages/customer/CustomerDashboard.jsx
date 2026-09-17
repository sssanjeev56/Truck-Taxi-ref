import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  useEffect(() => {
    customerAPI.dashboard()
      .then(res => {
        setStats(res.data.stats);
        setIsFirstLogin(res.data.is_first_login);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Available Trucks', value: stats?.available_trucks ?? '—', icon: '🚛', color: '#dbeafe' },
    { label: 'Active Bookings', value: stats?.active_bookings ?? '—', icon: '📋', color: '#d1fae5' },
    { label: 'Pending Requests', value: stats?.pending_requests ?? '—', icon: '⏳', color: '#fef3c7' },
    { label: 'Completed Trips', value: stats?.completed_trips ?? '—', icon: '✅', color: '#ede9fe' },
  ];

  return (
    <div className="page-content">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div>
          <div className="welcome-tag">{isFirstLogin ? '🎉 WELCOME' : '👋 WELCOME BACK'}</div>
          <h2>{isFirstLogin ? `Welcome, ${user?.full_name?.split(' ')[0]}!` : `Welcome Back, ${user?.full_name?.split(' ')[0]}!`}</h2>
          <p>{isFirstLogin ? "Let's get your journey moving." : 'Good to see you again.'}</p>
          <p style={{ marginTop: 6, fontSize: 13, opacity: 0.9 }}>Find the right truck for your journey.</p>
        </div>
        <div className="welcome-icon">🚛</div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="spinner" />
      ) : (
        <div className="stat-grid">
          {statCards.map(s => (
            <div className="stat-card" key={s.label}>
              <div className="stat-icon" style={{ background: s.color }}>{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Find Truck Section */}
      <div className="card">
        <div className="card-header">
          <h3>🔍 Find a Truck</h3>
          <span style={{ fontSize: 12, color: '#64748b' }}>AI-Powered Matching</span>
        </div>
        <p style={{ marginBottom: 16, fontSize: 13 }}>
          Enter your shipment details and our AI matching engine will find the most compatible trucks for your route.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/customer/find-truck')}>
          🔍 Find Suitable Trucks →
        </button>
      </div>

      {/* Quick Links */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/customer/bookings')}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
          <h4>My Bookings</h4>
          <p style={{ fontSize: 13 }}>View and manage all your truck bookings</p>
        </div>
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/customer/tracking')}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📍</div>
          <h4>Track Trucks</h4>
          <p style={{ fontSize: 13 }}>See available trucks on the map</p>
        </div>
      </div>

      {/* How it works */}
      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ marginBottom: 16 }}>⚡ How Truck Taxi Works</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { step: '01', text: 'Enter pickup location, destination, goods type, weight, and vehicle type' },
            { step: '02', text: 'Our AI matching engine evaluates all available trucks on 7 criteria' },
            { step: '03', text: 'Get ranked recommendations with compatibility scores out of 100' },
            { step: '04', text: 'Book the best match — driver gets notified instantly' },
            { step: '05', text: 'Track your shipment. When delivery completes, system finds return loads for the driver' },
          ].map(item => (
            <div key={item.step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ background: '#1a3a6e', color: '#fff', borderRadius: 8, padding: '3px 9px', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                {item.step}
              </span>
              <span style={{ fontSize: 13, color: '#475569' }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
