import { useEffect, useState } from 'react';
import { Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
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
    if (!loading && !user) {
      navigate('/auth?mode=login');
    }
  }, [loading, user, navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Mật khẩu mới cần có ít nhất 8 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận chưa khớp.');
      return;
    }

    try {
      setSubmitting(true);
      const { data } = await api.patch('/auth/change-password-first-login', {
        currentPassword,
        newPassword,
      });
      login(data);
      navigate(data.role === 'carer' ? '/carer/profile' : '/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể đổi mật khẩu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="change-password-page">
      <Navbar />
      <main className="change-password-shell">
        <section className="change-password-card">
          <div className="change-password-icon">
            <KeyRound size={26} />
          </div>
          <p className="section-eyebrow">Bảo mật tài khoản</p>
          <h1>Đổi mật khẩu lần đầu</h1>
          <p className="change-password-copy">
            Tài khoản carer do admin cấp cần đổi mật khẩu tạm trước khi ký hợp đồng và nhận lịch.
          </p>

          {error && <div className="form-alert">{error}</div>}

          <form onSubmit={handleSubmit} className="change-password-form">
            <label>
              Mật khẩu tạm hiện tại
              <div className="password-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  required
                />
              </div>
            </label>

            <label>
              Mật khẩu mới
              <div className="password-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <label>
              Nhập lại mật khẩu mới
              <div className="password-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  minLength={8}
                />
              </div>
            </label>

            <button type="submit" className="change-password-submit" disabled={submitting}>
              {submitting ? <Loader2 className="spinner" size={18} /> : null}
              Xác nhận đổi mật khẩu
            </button>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ChangePassword;
