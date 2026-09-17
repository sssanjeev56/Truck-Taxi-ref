import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

function TruckLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="1" y="8" width="14" height="10" rx="2" fill="#4a90e2"/>
      <rect x="15" y="11" width="8" height="7" rx="1.5" fill="#2d6cdf"/>
      <polygon points="15,11 20,11 22,15 15,15" fill="#2557b0"/>
      <circle cx="5" cy="19" r="2" fill="#1a3a6e"/>
      <circle cx="5" cy="19" r="0.9" fill="#dbeafe"/>
      <circle cx="19" cy="19" r="2" fill="#1a3a6e"/>
      <circle cx="19" cy="19" r="0.9" fill="#dbeafe"/>
    </svg>
  );
}

const CUSTOMER_LINKS = [
  { path: '/customer/dashboard', icon: '🏠', label: 'Dashboard' },
  { path: '/customer/find-truck', icon: '🔍', label: 'Find Truck' },
  { path: '/customer/tracking', icon: '📍', label: 'Track Trucks' },
  { path: '/customer/bookings', icon: '📋', label: 'My Bookings' },
  { path: '/notifications', icon: '🔔', label: 'Notifications' },
  { path: '/customer/profile', icon: '👤', label: 'Profile' },
];

const DRIVER_LINKS = [
  { path: '/driver/dashboard', icon: '🏠', label: 'Dashboard' },
  { path: '/driver/truck', icon: '🚛', label: 'My Truck' },
  { path: '/driver/requests', icon: '📥', label: 'Booking Requests' },
  { path: '/driver/tracking', icon: '📍', label: 'Track Location' },
  { path: '/driver/return-loads', icon: '🔄', label: 'Return Loads' },
  { path: '/driver/trips', icon: '🗺️', label: 'My Trips' },
  { path: '/notifications', icon: '🔔', label: 'Notifications' },
  { path: '/driver/profile', icon: '👤', label: 'Profile' },
];

const ADMIN_LINKS = [
  { path: '/admin/dashboard', icon: '🏠', label: 'Dashboard' },
  { path: '/admin/users', icon: '👥', label: 'Users' },
  { path: '/admin/drivers', icon: '🚛', label: 'Drivers' },
  { path: '/admin/trucks', icon: '🚚', label: 'Trucks' },
  { path: '/admin/bookings', icon: '📋', label: 'Bookings' },
  { path: '/admin/trips', icon: '🗺️', label: 'Trips' },
  { path: '/admin/analytics', icon: '📊', label: 'Analytics' },
];

export default function Sidebar({ unreadCount = 0 }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const links = user?.role === 'admin'
    ? ADMIN_LINKS
    : user?.role === 'driver'
    ? DRIVER_LINKS
    : CUSTOMER_LINKS;

  const handleNav = (path) => {
    navigate(path);
    setOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <>
      {/* Mobile hamburger in topbar - rendered externally */}
      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <TruckLogo />
          </div>
          <div>
            <div className="sidebar-logo-text">TRUCK TAXI</div>
            <div className="sidebar-logo-sub">AI-Powered Logistics</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {links.map((link) => (
            <button
              key={link.path}
              className={`sidebar-link ${location.pathname === link.path ? 'active' : ''}`}
              onClick={() => handleNav(link.path)}
            >
              <span className="sidebar-icon">
                {link.icon}
                {link.label === 'Notifications' && unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: 4, right: 4, background: 'red', borderRadius: '50%', width: 8, height: 8 }} />
                )}
              </span>
              {link.label}
              {link.label === 'Notifications' && unreadCount > 0 && (
                <span style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', borderRadius: 10, fontSize: 10, fontWeight: 700, padding: '1px 6px' }}>
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.full_name || 'User'}</div>
              <div className="sidebar-user-role">{user?.role}</div>
            </div>
          </div>
          <button className="sidebar-link" onClick={handleLogout} style={{ color: '#f87171', padding: '8px 0' }}>
            <span className="sidebar-icon">🚪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile toggle button */}
      <button
        className="hamburger"
        onClick={() => setOpen(!open)}
        style={{ position: 'fixed', top: 14, left: 14, zIndex: 300, display: 'none' }}
        id="hamburger-btn"
      >
        ☰
      </button>
    </>
  );
}
