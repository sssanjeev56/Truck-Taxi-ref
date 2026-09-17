import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { notificationAPI } from '../services/api';

export default function DashboardLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchUnread = async () => {
    try {
      const res = await notificationAPI.getUnreadCount();
      setUnreadCount(res.data.unread_count);
    } catch { /* silent */ }
  };

  if (!user) return null;

  return (
    <div className="sidebar-layout">
      <Sidebar unreadCount={unreadCount} />
      <div className="main-area">
        <Outlet context={{ refreshNotifications: fetchUnread }} />
      </div>
    </div>
  );
}
