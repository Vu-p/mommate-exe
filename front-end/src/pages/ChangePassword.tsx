import { Eye, EyeOff, History, Laptop, Loader2, ShieldAlert, ShieldCheck, Stethoscope } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import securityImage from '../assets/stitch/generated/stitch-01-714c09c9570b.png';
import './ChangePassword.css';

const ChangePassword = () => {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) navigate('/auth?mode=login');
  }, [loading, user, navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (newPassword.length < 8) return setError('Mật khẩu mới cần có ít nhất 8 ký tự.');
    if (newPassword !== confirmPassword) return setError('Mật khẩu xác nhận chưa khớp.');
    try {
      setSubmitting(true);
      const { data } = await api.patch('/auth/change-password-first-login', { currentPassword, newPassword });
      login(data);
      navigate(data.role === 'carer' ? '/carer/profile' : '/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể đổi mật khẩu.');
    } finally {
      setSubmitting(false);
    }
  };

  const passwordInput = (label: string, value: string, setter: (value: string) => void, placeholder: string) => (
    <label>{label}<div className="password-input-wrap"><input type={showPassword ? 'text' : 'password'} value={value} onChange={(event) => setter(event.target.value)} placeholder={placeholder} required /><button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>{showPassword ? <EyeOff /> : <Eye />}</button></div></label>
  );

  return (
    <div className="change-password-page">
      <header className="security-header"><div><Stethoscope /><strong>MaternalCare</strong></div><span><ShieldCheck />Môi trường bảo mật</span></header>
      <main className="change-password-shell">
        <section className="password-intro"><h1>Đặt lại mật khẩu tài khoản</h1><p>Để đảm bảo an toàn cho bệnh nhân và thông tin chuyên môn của bạn, vui lòng cập nhật mật khẩu tạm thời do quản trị viên cung cấp.</p></section>
        <div className="password-layout">
          <div>
            <form className="change-password-card" onSubmit={handleSubmit}>
              {error && <div className="form-alert">{error}</div>}
              {passwordInput('Mật khẩu tạm thời hiện tại', currentPassword, setCurrentPassword, '••••••••••••')}
              <hr />
              {passwordInput('Mật khẩu mới', newPassword, setNewPassword, 'Chọn một mật khẩu mạnh')}
              <div className="password-strength"><i /><i /><i /><i /></div>
              {passwordInput('Xác nhận mật khẩu mới', confirmPassword, setConfirmPassword, 'Nhập lại mật khẩu mới của bạn')}
              <div className="password-actions"><button type="submit" disabled={submitting}>{submitting && <Loader2 className="spinner" />}Cập nhật mật khẩu</button><a href="/contact">Liên hệ hỗ trợ</a></div>
            </form>
            <section className="password-rules"><p><span />Dài ít nhất 12 ký tự</p><p><span />Chữ hoa & chữ thường</p><p><span />Chứa ít nhất một số</p><p><span />Bao gồm ký tự đặc biệt (!@#)</p></section>
          </div>
          <aside className="security-aside">
            <div className="security-image"><img src={securityImage} alt="" /><strong>Bảo vệ mạng lưới Chuyên gia với các tiêu chuẩn bảo mật cấp doanh nghiệp.</strong></div>
            <section><h2><ShieldAlert />Hướng dẫn bảo mật tốt nhất</h2><article><History /><div><strong>Tránh sử dụng lại mật khẩu cũ</strong><p>Không sử dụng mật khẩu bạn dùng cho các tài khoản cá nhân như mạng xã hội hoặc ngân hàng.</p></div></article><article><b>***</b><div><strong>Sử dụng cụm mật khẩu</strong><p>Thay vì một từ, hãy sử dụng kết hợp 3-4 từ không liên quan.</p></div></article><article><Laptop /><div><strong>Đăng xuất trên thiết bị dùng chung</strong><p>Luôn đăng xuất khi sử dụng máy trạm chung tại bệnh viện hoặc đại lý.</p></div></article><footer><strong>Lưu ý cho Chuyên gia</strong><p>Quản trị viên MaternalCare sẽ không bao giờ hỏi mật khẩu của bạn qua email hoặc điện thoại.</p></footer></section>
          </aside>
        </div>
      </main>
      <footer className="security-footer"><span>© 2026 MomMate. Bảo lưu mọi quyền.</span><nav><a href="/privacy">Chính sách bảo mật</a><a href="/terms">Điều khoản dịch vụ</a><a href="/help">Trung tâm trợ giúp</a></nav></footer>
    </div>
  );
};

export default ChangePassword;
