import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ClipboardList, 
  LogOut,
  ChevronLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './AdminSidebar.css';

const AdminSidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth?mode=login');
  };

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-header">
        <div className="admin-logo">
          <span className="logo-accent">Mom</span>mate Admin
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/admin/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          <span>Overview</span>
        </NavLink>
        
        <NavLink to="/admin/services" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Package size={20} />
          <span>Services</span>
        </NavLink>

        <NavLink to="/admin/carers" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Users size={20} />
          <span>Carers</span>
        </NavLink>

        <NavLink to="/admin/bookings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <ClipboardList size={20} />
          <span>Bookings</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
