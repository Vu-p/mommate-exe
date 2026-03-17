import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { useAuth } from '../../context/AuthContext';
import './AdminLayout.css';

const AdminLayout = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      navigate('/auth?mode=login');
    }
  }, [user, loading, navigate]);

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="admin-loading">
        <div className="loader"></div>
        <p>Verifying Admin Access...</p>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <header className="admin-header">
          <div className="header-search">
            {/* Search Placeholder */}
          </div>
          <div className="admin-user-info">
            <span className="user-role-badge">Admin Profile</span>
            <span className="user-name">{user.firstName} {user.lastName}</span>
          </div>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
