import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

const VEHICLE_TYPES = ['Container Truck', 'Lorry', 'Mini Truck', 'Tanker', 'Flatbed', 'Refrigerated Truck', 'Tipper'];

export default function DriverRegister() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', password: '', confirm_password: '',
    license_number: '', truck_number: '', vehicle_type: 'Container Truck',
    capacity: '', goods_type: '', current_location: '', preferred_routes: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    if (!form.full_name.trim()) return 'Full name is required';
    if (!form.email) return 'Email is required';
    if (form.password.length < 6) return 'Password must be at least 6 characters';
    if (form.password !== form.confirm_password) return 'Passwords do not match';
    if (!form.license_number) return 'License number is required';
    if (!form.truck_number) return 'Truck number is required';
    if (!form.capacity || isNaN(form.capacity)) return 'Valid capacity is required';
    if (!form.goods_type) return 'Goods type is required';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true); setError('');
    try {
      const res = await authAPI.registerDriver({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        license_number: form.license_number,
        truck_number: form.truck_number.toUpperCase(),
        vehicle_type: form.vehicle_type,
        capacity: parseFloat(form.capacity),
        goods_type: form.goods_type,
        current_location: form.current_location,
        preferred_routes: form.preferred_routes,
      });
      login(res.data.access_token, res.data.user);
      navigate('/driver/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page" style={{ padding: '24px 24px 48px' }}>
      <div className="login-card" style={{ maxWidth: 520 }}>
        <div className="login-card-top" />
        <div className="login-card-body">
          <div className="login-logo-wrap">
            <div className="login-logo-icon">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                <rect x="1" y="7" width="14" height="11" rx="2" fill="#4a90e2"/>
                <rect x="15" y="10" width="8" height="8" rx="1.5" fill="#2d6cdf"/>
                <polygon points="15,10 20,10 22,14 15,14" fill="#2557b0"/>
                <circle cx="5" cy="19" r="2.2" fill="#1a3a6e"/>
                <circle cx="5" cy="19" r="0.9" fill="#dbeafe"/>
                <circle cx="19" cy="19" r="2.2" fill="#1a3a6e"/>
                <circle cx="19" cy="19" r="0.9" fill="#dbeafe"/>
              </svg>
            </div>
            <div className="login-brand">TRUCK TAXI</div>
            <div className="login-tagline">Driver Registration — Add your truck to the platform</div>
          </div>

          {error && <div className="login-error">⚠️ {error}</div>}

          <form onSubmit={handleSubmit}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#1a3a6e', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              Personal Details
            </p>
            {[
              { label: 'Full Name', key: 'full_name', type: 'text', icon: '👤', placeholder: 'Your full name' },
              { label: 'Email', key: 'email', type: 'email', icon: '✉️', placeholder: 'your@email.com' },
              { label: 'Phone', key: 'phone', type: 'tel', icon: '📱', placeholder: '+91 9876543210' },
              { label: 'Password', key: 'password', type: 'password', icon: '🔒', placeholder: 'Min 6 characters' },
              { label: 'Confirm Password', key: 'confirm_password', type: 'password', icon: '🔒', placeholder: 'Re-enter' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label className="login-label">{f.label}</label>
                <div className="login-input-wrap">
                  <span className="login-input-icon">{f.icon}</span>
                  <input className="login-input" type={f.type} placeholder={f.placeholder} value={form[f.key]} onChange={set(f.key)} />
                </div>
              </div>
            ))}

            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '16px 0 12px' }} />
            <p style={{ fontSize: 12, fontWeight: 700, color: '#1a3a6e', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              🚛 Truck Details
            </p>

            <div style={{ marginBottom: 12 }}>
              <label className="login-label">Driving License Number</label>
              <input className="login-input" style={{ paddingLeft: 14 }} placeholder="TN-DL-YYYY-XXXXXX" value={form.license_number} onChange={set('license_number')} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label className="login-label">Truck Registration Number</label>
              <input className="login-input" style={{ paddingLeft: 14 }} placeholder="TN-01-AB-1234" value={form.truck_number} onChange={set('truck_number')} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label className="login-label">Vehicle Type</label>
                <select className="login-input" style={{ paddingLeft: 14 }} value={form.vehicle_type} onChange={set('vehicle_type')}>
                  {VEHICLE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="login-label">Capacity (Tons)</label>
                <input className="login-input" style={{ paddingLeft: 14 }} type="number" step="0.5" placeholder="10" value={form.capacity} onChange={set('capacity')} />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label className="login-label">Goods Type Supported</label>
              <input className="login-input" style={{ paddingLeft: 14 }} placeholder="e.g., General Goods, Furniture, Electronics" value={form.goods_type} onChange={set('goods_type')} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label className="login-label">Current Location</label>
              <input className="login-input" style={{ paddingLeft: 14 }} placeholder="e.g., Bangalore" value={form.current_location} onChange={set('current_location')} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="login-label">Preferred Routes</label>
              <input className="login-input" style={{ paddingLeft: 14 }} placeholder="e.g., Bangalore → Chennai" value={form.preferred_routes} onChange={set('preferred_routes')} />
            </div>

            <button className="btn-signin" type="submit" disabled={loading}>
              {loading ? '⏳ Registering...' : '🚛 Register as Driver'}
            </button>
          </form>

          <div className="login-footer">
            <p>Already have an account? <Link to="/login" style={{ color: '#2d6cdf', fontWeight: 600 }}>Sign In</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
