import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { useAuth } from '../../context/AuthContext';
import './AdminLayout.css';
import './AdminRedesign.css';

const AdminLayout = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isDashboard = location.pathname === '/admin/dashboard';

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
        <div className="admin-content">
          <Outlet />
        </div>
        <footer className={`admin-footer${isDashboard ? ' dashboard-footer' : ''}`}>
          {isDashboard ? (
            <>
              <div><strong>MomMate</strong><span>Hỗ trợ chuyên nghiệp cho mẹ và bé,<br />dựa trên chuyên môn lâm sàng và sự tận tâm chăm sóc.</span></div>
              <div><strong>Liên kết nội bộ</strong><span>Về chúng tôi</span><span>Trung tâm hỗ trợ</span><span>Nhân viên y tế đã xác minh</span></div>
              <div><strong>Pháp lý</strong><span>Chính sách bảo mật</span><span>Điều khoản dịch vụ</span><span>Hỗ trợ khách hàng</span></div>
              <div><span>© 2026 Dịch vụ Chuyên nghiệp<br />MomMate. Bảo lưu mọi quyền.</span></div>
            </>
          ) : (
            <>
              <div><strong>MomMate</strong><span>© 2026 MomMate Professional Services.</span></div>
              <nav><a href="#support">Trung tâm hỗ trợ</a><a href="#privacy">Chính sách bảo mật</a><a href="#terms">Điều khoản dịch vụ</a></nav>
            </>
          )}
        </footer>
      </main>
    </div>
  );
};

export default AdminLayout;
