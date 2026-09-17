import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import DriverRegister from './pages/auth/DriverRegister';

// Layout
import DashboardLayout from './layouts/DashboardLayout';

// Public
import Home from './pages/public/Home';

// Customer Pages
import CustomerDashboard from './pages/customer/CustomerDashboard';
import FindTruck from './pages/customer/FindTruck';
import CustomerBookings from './pages/customer/CustomerBookings';
import TruckTracking from './pages/customer/TruckTracking';

// Driver Pages
import DriverDashboard from './pages/driver/DriverDashboard';
import DriverTruck from './pages/driver/DriverTruck';
import DriverTrips from './pages/driver/DriverTrips';
import ReturnLoads from './pages/driver/ReturnLoads';

// Shared
import Notifications from './pages/Notifications';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminTrucks, { AdminBookings, AdminTrips } from './pages/admin/AdminTrucks';

// ─── Protected Route ────────────────────────────────────────────
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'driver') return <Navigate to="/driver/dashboard" replace />;
    return <Navigate to="/customer/dashboard" replace />;
  }
  return children;
}

// ─── Profile Page ────────────────────────────────────────────────
function Profile() {
  const { user } = useAuth();
  return (
    <div className="page-content">
      <div className="page-header"><h1>👤 My Profile</h1></div>
      <div className="card" style={{ maxWidth: 480 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'linear-gradient(135deg, #1a3a6e, #2d6cdf)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 700, color: '#fff',
          }}>
            {user?.full_name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 style={{ margin: 0, color: '#1a3a6e' }}>{user?.full_name}</h3>
            <span className={`badge badge-${user?.role}`} style={{ marginTop: 6 }}>{user?.role?.toUpperCase()}</span>
          </div>
        </div>
        {[
          ['Email', user?.email],
          ['Phone', user?.phone || 'Not set'],
          ['Role', user?.role],
          ['Total Logins', user?.login_count],
          ['Member Since', user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN') : 'Unknown'],
          ['Last Login', user?.last_login_at ? new Date(user.last_login_at).toLocaleString('en-IN') : 'Unknown'],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ color: '#64748b', fontWeight: 500, fontSize: 14 }}>{k}</span>
            <span style={{ fontWeight: 600, color: '#1e293b', fontSize: 14 }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Driver Tracking Stub ────────────────────────────────────────
function DriverTrackingPage() {
  return (
    <div className="page-content">
      <div className="page-header"><h1>📍 Track Location</h1></div>
      <div className="alert alert-info">
        Use the <strong>My Truck</strong> page to update your GPS location manually, or integrate a device GPS in production.
      </div>
      <div style={{ marginTop: 16 }}>
        <a href="/driver/truck" className="btn btn-primary">Go to My Truck →</a>
      </div>
    </div>
  );
}

// ─── Routes ────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/register/driver" element={<DriverRegister />} />

      {/* Protected: wraps all dashboard routes in layout */}
      <Route element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        {/* Customer */}
        <Route path="/customer/dashboard" element={<ProtectedRoute allowedRoles={['customer', 'admin']}><CustomerDashboard /></ProtectedRoute>} />
        <Route path="/customer/find-truck"  element={<ProtectedRoute allowedRoles={['customer', 'admin']}><FindTruck /></ProtectedRoute>} />
        <Route path="/customer/bookings"    element={<ProtectedRoute allowedRoles={['customer', 'admin']}><CustomerBookings /></ProtectedRoute>} />
        <Route path="/customer/tracking"    element={<ProtectedRoute allowedRoles={['customer', 'driver', 'admin']}><TruckTracking /></ProtectedRoute>} />
        <Route path="/customer/profile"     element={<ProtectedRoute allowedRoles={['customer']}><Profile /></ProtectedRoute>} />

        {/* Driver */}
        <Route path="/driver/dashboard"   element={<ProtectedRoute allowedRoles={['driver', 'admin']}><DriverDashboard /></ProtectedRoute>} />
        <Route path="/driver/truck"       element={<ProtectedRoute allowedRoles={['driver', 'admin']}><DriverTruck /></ProtectedRoute>} />
        <Route path="/driver/requests"    element={<ProtectedRoute allowedRoles={['driver', 'admin']}><DriverDashboard /></ProtectedRoute>} />
        <Route path="/driver/trips"       element={<ProtectedRoute allowedRoles={['driver', 'admin']}><DriverTrips /></ProtectedRoute>} />
        <Route path="/driver/return-loads" element={<ProtectedRoute allowedRoles={['driver', 'admin']}><ReturnLoads /></ProtectedRoute>} />
        <Route path="/driver/tracking"    element={<ProtectedRoute allowedRoles={['driver', 'admin']}><DriverTrackingPage /></ProtectedRoute>} />
        <Route path="/driver/profile"     element={<ProtectedRoute allowedRoles={['driver']}><Profile /></ProtectedRoute>} />

        {/* Shared */}
        <Route path="/notifications" element={<Notifications />} />

        {/* Admin */}
        <Route path="/admin/dashboard"  element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users"      element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/drivers"    element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/trucks"     element={<ProtectedRoute allowedRoles={['admin']}><AdminTrucks /></ProtectedRoute>} />
        <Route path="/admin/bookings"   element={<ProtectedRoute allowedRoles={['admin']}><AdminBookings /></ProtectedRoute>} />
        <Route path="/admin/trips"      element={<ProtectedRoute allowedRoles={['admin']}><AdminTrips /></ProtectedRoute>} />
        <Route path="/admin/analytics"  element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
