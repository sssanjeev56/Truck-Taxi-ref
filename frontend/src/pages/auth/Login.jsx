import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

function TruckLogoSVG() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
      <rect x="1" y="7" width="14" height="11" rx="2" fill="#4a90e2"/>
      <rect x="15" y="10" width="8" height="8" rx="1.5" fill="#2d6cdf"/>
      <polygon points="15,10 20,10 22,14 15,14" fill="#2557b0"/>
      <circle cx="5" cy="19" r="2.2" fill="#1a3a6e"/>
      <circle cx="5" cy="19" r="0.9" fill="#dbeafe"/>
      <circle cx="19" cy="19" r="2.2" fill="#1a3a6e"/>
      <circle cx="19" cy="19" r="0.9" fill="#dbeafe"/>
      <rect x="3" y="11" width="5" height="3" rx="0.5" fill="#93c5fd"/>
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleConfigured, setGoogleConfigured] = useState(null);

  useEffect(() => {
    // Redirect if already logged in
    if (user) {
      redirectByRole(user.role);
    }
    // Check Google config
    authAPI.googleUrl()
      .then(res => setGoogleConfigured(res.data.configured))
      .catch(() => setGoogleConfigured(false));
  }, [user]);

  const redirectByRole = (role) => {
    if (role === 'admin') navigate('/admin/dashboard');
    else if (role === 'driver') navigate('/driver/dashboard');
    else navigate('/customer/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) { setError('Please enter email and password.'); return; }
    setLoading(true);
    try {
      const res = await authAPI.login({ email: form.email, password: form.password });
      login(res.data.access_token, res.data.user);
      redirectByRole(res.data.user.role);
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      const res = await authAPI.googleUrl();
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch {
      setError('Google login is not available.');
    }
  };

  // Determine welcome message based on whether user has logged in before
  // Since we can't know without logging in, we default to "WELCOME"
  const isFirstTime = true;

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card-top" />
        <div className="login-card-body">
          {/* Logo */}
          <div className="login-logo-wrap">
            <div className="login-logo-icon">
              <TruckLogoSVG />
            </div>
            <div className="login-brand">TRUCK TAXI</div>
            <div className="login-tagline">AI-Powered Truck Booking &amp; Smart Logistics</div>
          </div>

          {/* Welcome */}
          <div className="login-welcome">
            <h2>WELCOME</h2>
            <p>Sign in to continue to Truck Taxi</p>
          </div>

          {error && <div className="login-error">⚠️ {error}</div>}

          {/* Google */}
          {googleConfigured === false && (
            <div className="login-google-note">
              ℹ️ Google login is not configured. Use email/password below.
            </div>
          )}

          <button
            className="btn-google"
            onClick={handleGoogle}
            disabled={!googleConfigured}
            style={!googleConfigured ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="login-divider"><span>OR</span></div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label className="login-label">Email</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">✉️</span>
                <input
                  className="login-input"
                  type="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  autoComplete="email"
                />
              </div>
            </div>

            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="login-label" style={{ margin: 0 }}>Password</label>
                <a onClick={() => {}} style={{ color: '#2d6cdf', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Forgot Password?
                </a>
              </div>
              <div className="login-input-wrap">
                <span className="login-input-icon">🔒</span>
                <input
                  className="login-input"
                  type="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button className="btn-signin" type="submit" disabled={loading}>
              {loading ? '⏳ Signing in...' : <>Sign In →</>}
            </button>
          </form>

          <div className="login-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: '#2d6cdf', fontWeight: 600 }}>Create Account</Link>
            </p>
            <p style={{ marginTop: 8 }}>
              Are you a driver?{' '}
              <Link to="/register/driver" style={{ color: '#2d6cdf', fontWeight: 600 }}>Register as Driver</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
