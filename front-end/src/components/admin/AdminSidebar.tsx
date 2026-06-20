import { NavLink, useNavigate } from 'react-router-dom';
import {
  BarChart3, CircleHelp, ClipboardCheck, ClipboardList, LayoutDashboard, LogOut,
  Package, Settings, ShieldAlert, Star, Users, WalletCards,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './AdminSidebar.css';

const links = [
  ['/admin/dashboard', 'Tổng quan', LayoutDashboard],
  ['/admin/users', 'Quản lý người dùng', Users],
  ['/admin/services', 'Dịch vụ', Package],
  ['/admin/carers', 'Chuyên gia', Users],
  ['/admin/bookings', 'Đặt lịch', ClipboardList],
  ['/admin/workflows', 'Yêu cầu xử lý', ClipboardCheck],
  ['/admin/reconciliation', 'Thanh toán', WalletCards],
  ['/admin/reviews', 'Đánh giá', Star],
  ['/admin/incidents', 'Sự cố', ShieldAlert],
  ['/admin/revenue', 'Doanh thu', BarChart3],
] as const;

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
        <div className="admin-logo">MomMate</div>
        <p>Bảng quản trị</p>
      </div>
      <nav className="sidebar-nav">
        {links.map(([to, label, Icon]) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
        <NavLink to="/admin/workflows" className="nav-item settings-item">
          <Settings size={20} /><span>Cài đặt vận hành</span>
        </NavLink>
      </nav>
      <div className="sidebar-footer">
        <NavLink to="/admin/workflows" className="sidebar-help"><CircleHelp size={20} /><span>Trung tâm hỗ trợ</span></NavLink>
        <button onClick={handleLogout} className="logout-btn"><LogOut size={20} /><span>Đăng xuất</span></button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
