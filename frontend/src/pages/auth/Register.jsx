import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', password: '', confirm_password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!form.full_name.trim()) return 'Full name is required';
    if (!form.email) return 'Email is required';
    if (!form.phone) return 'Phone is required';
    if (form.password.length < 6) return 'Password must be at least 6 characters';
    if (form.password !== form.confirm_password) return 'Passwords do not match';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true); setError('');
    try {
      const res = await authAPI.register({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      login(res.data.access_token, res.data.user);
      navigate('/customer/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
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
            <div className="login-tagline">Create your customer account</div>
          </div>

          <div className="login-welcome">
            <h2>Create Account</h2>
            <p>Join Truck Taxi to book trucks smarter</p>
          </div>

          {error && <div className="login-error">⚠️ {error}</div>}

          <form onSubmit={handleSubmit}>
            {[
              { label: 'Full Name', key: 'full_name', type: 'text', icon: '👤', placeholder: 'Your full name' },
              { label: 'Email', key: 'email', type: 'email', icon: '✉️', placeholder: 'your@email.com' },
              { label: 'Phone', key: 'phone', type: 'tel', icon: '📱', placeholder: '+91 9876543210' },
              { label: 'Password', key: 'password', type: 'password', icon: '🔒', placeholder: 'Min 6 characters' },
              { label: 'Confirm Password', key: 'confirm_password', type: 'password', icon: '🔒', placeholder: 'Re-enter password' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: 14 }}>
                <label className="login-label">{field.label}</label>
                <div className="login-input-wrap">
                  <span className="login-input-icon">{field.icon}</span>
                  <input
                    className="login-input"
                    type={field.type}
                    placeholder={field.placeholder}
                    value={form[field.key]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  />
                </div>
              </div>
            ))}

            <button className="btn-signin" type="submit" disabled={loading}>
              {loading ? '⏳ Creating account...' : '🚀 Create Account'}
            </button>
          </form>

          <div className="login-footer">
            <p>Already have an account? <Link to="/login" style={{ color: '#2d6cdf', fontWeight: 600 }}>Sign In</Link></p>
            <p style={{ marginTop: 8 }}>Are you a driver? <Link to="/register/driver" style={{ color: '#2d6cdf', fontWeight: 600 }}>Driver Registration</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
