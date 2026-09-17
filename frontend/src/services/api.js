import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ===================== AUTH =====================
export const authAPI = {
  login: (data) => api.post('/api/auth/login', data),
  register: (data) => api.post('/api/auth/register', data),
  registerDriver: (data) => api.post('/api/auth/register/driver', data),
  me: () => api.get('/api/auth/me'),
  googleUrl: () => api.get('/api/auth/google/url'),
  googleCallback: (code) => api.post('/api/auth/google/callback', { code }),
};

// ===================== CUSTOMER =====================
export const customerAPI = {
  dashboard: () => api.get('/api/customer/dashboard'),
  createRequest: (data) => api.post('/api/customer/request', data),
  findTrucks: (data) => api.post('/api/customer/find-trucks', data),
  recommendations: (requestId) => api.get(`/api/customer/recommendations/${requestId}`),
  bookings: () => api.get('/api/customer/bookings'),
};

// ===================== DRIVER =====================
export const driverAPI = {
  dashboard: () => api.get('/api/driver/dashboard'),
  getTruck: () => api.get('/api/driver/truck'),
  updateTruck: (data) => api.put('/api/driver/truck', data),
  setAvailability: (status) => api.put('/api/driver/availability', { status }),
  updateLocation: (data) => api.put('/api/driver/location', data),
  getRequests: () => api.get('/api/driver/requests'),
  acceptRequest: (id) => api.post(`/api/driver/request/${id}/accept`),
  rejectRequest: (id) => api.post(`/api/driver/request/${id}/reject`),
  getTrips: () => api.get('/api/driver/trips'),
  updateTripStatus: (id, status) => api.put(`/api/driver/trip/${id}/status`, { status }),
  getReturnLoads: () => api.get('/api/driver/return-loads'),
};

// ===================== BOOKINGS =====================
export const bookingAPI = {
  create: (data) => api.post('/api/bookings', data),
  getById: (id) => api.get(`/api/bookings/${id}`),
  updateStatus: (id, status) => api.put(`/api/bookings/${id}/status`, { status }),
};

// ===================== TRACKING =====================
export const trackingAPI = {
  getAllTrucks: () => api.get('/api/tracking/trucks'),
  getTruck: (id) => api.get(`/api/tracking/truck/${id}`),
  updateLocation: (data) => api.post('/api/tracking/location', data),
};

// ===================== NOTIFICATIONS =====================
export const notificationAPI = {
  getAll: () => api.get('/api/notifications'),
  getUnreadCount: () => api.get('/api/notifications/unread-count'),
  markRead: (id) => api.put(`/api/notifications/${id}/read`),
  markAllRead: () => api.put('/api/notifications/mark-all-read'),
};

// ===================== ADMIN =====================
export const adminAPI = {
  dashboard: () => api.get('/api/admin/dashboard'),
  users: () => api.get('/api/admin/users'),
  drivers: () => api.get('/api/admin/drivers'),
  trucks: () => api.get('/api/admin/trucks'),
  bookings: () => api.get('/api/admin/bookings'),
  trips: () => api.get('/api/admin/trips'),
  toggleUserActive: (id) => api.put(`/api/admin/users/${id}/toggle-active`),
};

// ===================== TRUCKS =====================
export const truckAPI = {
  getAvailable: () => api.get('/api/trucks'),
  getById: (id) => api.get(`/api/trucks/${id}`),
};
