import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Loader2, ShieldCheck, UserCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ImageUpload from '../components/common/ImageUpload';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './AccountProfile.css';

interface ProfileForm {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  birthDate: string;
  gender: string;
  avatar: string;
  identityNumber: string;
  identityName: string;
  identityIssuedAt: string;
  identityImages: string[];
}

const EMPTY_FORM: ProfileForm = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  address: '',
  birthDate: '',
  gender: '',
  avatar: '',
  identityNumber: '',
  identityName: '',
  identityIssuedAt: '',
  identityImages: ['', ''],
};

const toDateInputValue = (value?: string | Date | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const AccountProfile = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const avatarPreview = useMemo(() => form.avatar || user?.avatar || '', [form.avatar, user?.avatar]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/users/me');
        setForm({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || user.email || '',
          phoneNumber: data.phoneNumber || '',
          address: data.address || '',
          birthDate: toDateInputValue(data.birthDate),
          gender: data.gender || '',
          avatar: data.avatar || user.avatar || '',
          identityNumber: data.identityNumber || '',
          identityName: data.identityName || '',
          identityIssuedAt: toDateInputValue(data.identityIssuedAt),
          identityImages: [
            data.identityImages?.[0] || '',
            data.identityImages?.[1] || '',
          ],
        });
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        setError(err.response?.data?.message || 'Không thể tải hồ sơ cá nhân.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate, user]);

  const updateIdentityImage = (index: number, url: string) => {
    setForm((prev) => {
      const identityImages = [...prev.identityImages];
      identityImages[index] = url;
      return { ...prev, identityImages };
    });
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setError('');

    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        address: form.address.trim(),
        birthDate: form.birthDate || null,
        gender: form.gender,
        avatar: form.avatar,
        identityNumber: form.identityNumber.trim(),
        identityName: form.identityName.trim(),
        identityIssuedAt: form.identityIssuedAt || null,
        identityImages: form.identityImages.filter(Boolean),
      };

      const { data } = await api.put('/users/me', payload);
      login({ ...user, ...data, token: user.token });
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.response?.data?.message || 'Không thể lưu hồ sơ.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="account-profile-page account-profile-state">
        <Navbar />
        <div className="account-state-loading">
          <Loader2 className="spinner" />
          <p>Đang tải hồ sơ cá nhân...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="account-profile-page">
      <Navbar />

      <main className="container account-profile-content">
        <nav className="breadcrumb">
          <Link to="/">Trang chủ</Link>
          <ChevronRight size={14} />
          <Link to="/account/request">Tài khoản</Link>
          <ChevronRight size={14} />
          <span>Hồ sơ</span>
        </nav>

        <div className="account-profile-layout">
          <aside className="account-profile-sidebar">
            <div className="profile-summary-card">
              <div className="profile-summary-avatar">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" />
                ) : (
                  <UserCircle2 size={78} strokeWidth={1.4} />
                )}
              </div>
              <h2>{`${form.firstName} ${form.lastName}`.trim() || 'Hồ sơ cá nhân'}</h2>
              <p>{form.email || user?.email}</p>
              <span className="profile-role-chip">
                <ShieldCheck size={14} />
                {user?.role || 'member'}
              </span>
            </div>

            <nav className="account-nav">
              <Link to="/account/profile" className="account-nav-item active">
                Hồ sơ
              </Link>
              <Link to="/account/request" className="account-nav-item">
                Yêu cầu đặt lịch
              </Link>
              {user?.role === 'carer' && (
                <Link to="/carer/profile" className="account-nav-item">
                  Hồ sơ carer
                </Link>
              )}
              <a href="#support" className="account-nav-item">
                Hỗ trợ
              </a>
            </nav>
          </aside>

          <section className="account-profile-main">
            <div className="account-card">
              <div className="account-card-header">
                <div>
                  <p className="section-eyebrow">Account</p>
                  <h1>Hồ sơ cá nhân</h1>
                </div>
                <button type="button" className="btn-profile-save" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 size={18} className="spinner" /> : 'Lưu thay đổi'}
                </button>
              </div>

              {error && <div className="account-error-banner">{error}</div>}

              <div className="profile-form-grid">
                <div className="profile-form-block profile-avatar-block">
                  <label>Ảnh đại diện</label>
                  <div className="avatar-upload-row">
                    <div className="avatar-preview-large">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" />
                      ) : (
                        <UserCircle2 size={64} strokeWidth={1.5} />
                      )}
                    </div>
                    <div className="avatar-upload-control">
                      <p>Upload photo</p>
                      <ImageUpload
                        onUploadSuccess={(url) => setForm((prev) => ({ ...prev, avatar: url }))}
                        defaultImage={form.avatar || undefined}
                        label=""
                      />
                    </div>
                  </div>
                </div>

                <div className="profile-form-grid-2">
                  <div className="profile-form-block">
                    <label>Họ</label>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Nguyễn"
                    />
                  </div>
                  <div className="profile-form-block">
                    <label>Tên</label>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Văn A"
                    />
                  </div>
                  <div className="profile-form-block">
                    <label>Email</label>
                    <input type="email" value={form.email} disabled />
                  </div>
                  <div className="profile-form-block">
                    <label>Số điện thoại</label>
                    <input
                      type="tel"
                      value={form.phoneNumber}
                      onChange={(e) => setForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                      placeholder="0901234567"
                    />
                  </div>
                  <div className="profile-form-block">
                    <label>Ngày sinh</label>
                    <input
                      type="date"
                      value={form.birthDate}
                      onChange={(e) => setForm((prev) => ({ ...prev, birthDate: e.target.value }))}
                    />
                  </div>
                  <div className="profile-form-block">
                    <label>Giới tính</label>
                    <select
                      value={form.gender}
                      onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}
                    >
                      <option value="">Chọn giới tính</option>
                      <option value="female">Nữ</option>
                      <option value="male">Nam</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>
                  <div className="profile-form-block profile-span-2">
                    <label>Địa chỉ</label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                      placeholder="Số nhà, đường, quận, thành phố"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="account-card">
              <div className="account-card-header">
                <div>
                  <p className="section-eyebrow">Identity</p>
                  <h2>Thông tin định danh</h2>
                </div>
              </div>

              <div className="profile-form-grid-2">
                <div className="profile-form-block">
                  <label>Số CCCD / CMND</label>
                  <input
                    type="text"
                    value={form.identityNumber}
                    onChange={(e) => setForm((prev) => ({ ...prev, identityNumber: e.target.value }))}
                    placeholder="0123456789"
                  />
                </div>
                <div className="profile-form-block">
                  <label>Họ tên trên giấy tờ</label>
                  <input
                    type="text"
                    value={form.identityName}
                    onChange={(e) => setForm((prev) => ({ ...prev, identityName: e.target.value }))}
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div className="profile-form-block">
                  <label>Ngày cấp</label>
                  <input
                    type="date"
                    value={form.identityIssuedAt}
                    onChange={(e) => setForm((prev) => ({ ...prev, identityIssuedAt: e.target.value }))}
                  />
                </div>
                <div className="profile-form-block">
                  <label>Mã vai trò</label>
                  <input type="text" value={user?.role || 'member'} disabled />
                </div>
              </div>

              <div className="identity-upload-grid">
                <div className="identity-upload-block">
                  <label>Mặt trước CCCD</label>
                  <ImageUpload
                    onUploadSuccess={(url) => updateIdentityImage(0, url)}
                    defaultImage={form.identityImages[0] || undefined}
                    label=""
                  />
                </div>
                <div className="identity-upload-block">
                  <label>Mặt sau CCCD</label>
                  <ImageUpload
                    onUploadSuccess={(url) => updateIdentityImage(1, url)}
                    defaultImage={form.identityImages[1] || undefined}
                    label=""
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AccountProfile;
