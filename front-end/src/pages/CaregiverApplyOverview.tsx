import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Loader2, UserCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ImageUpload from '../components/common/ImageUpload';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './CaregiverApplyOverview.css';

type OverviewForm = {
  firstName: string;
  lastName: string;
  location: string;
  birthDate: string;
  gender: string;
  phoneNumber: string;
  avatar: string;
  identityNumber: string;
  identityName: string;
  identityIssuedAt: string;
  identityImages: string[];
};

const EMPTY_FORM: OverviewForm = {
  firstName: '',
  lastName: '',
  location: '',
  birthDate: '',
  gender: '',
  phoneNumber: '',
  avatar: '',
  identityNumber: '',
  identityName: '',
  identityIssuedAt: '',
  identityImages: ['', ''],
};

const toDateInputValue = (value?: string | Date | null) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
};

const CaregiverApplyOverview = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [formData, setFormData] = useState<OverviewForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const avatarPreview = useMemo(() => formData.avatar || user?.avatar || '', [formData.avatar, user?.avatar]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/carers/me');
        const profileUser = data?.user || {};
        setFormData({
          firstName: profileUser.firstName || user.firstName || '',
          lastName: profileUser.lastName || user.lastName || '',
          location: profileUser.address || '',
          birthDate: toDateInputValue(profileUser.birthDate),
          gender: profileUser.gender || '',
          phoneNumber: profileUser.phoneNumber || '',
          avatar: profileUser.avatar || user.avatar || '',
          identityNumber: profileUser.identityNumber || '',
          identityName: profileUser.identityName || '',
          identityIssuedAt: toDateInputValue(profileUser.identityIssuedAt),
          identityImages: [
            profileUser.identityImages?.[0] || '',
            profileUser.identityImages?.[1] || '',
          ],
        });
      } catch (err: any) {
        console.error('Error loading caregiver profile:', err);
        setError(err.response?.data?.message || 'Không thể tải thông tin hồ sơ.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate, user]);

  const updateIdentityImage = (index: number, url: string) => {
    setFormData((prev) => {
      const identityImages = [...prev.identityImages];
      identityImages[index] = url;
      return { ...prev, identityImages };
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!user) return;

    setSaving(true);
    setError('');

    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        location: formData.location.trim(),
        birthDate: formData.birthDate || null,
        gender: formData.gender,
        identityNumber: formData.identityNumber.trim(),
        identityName: formData.identityName.trim(),
        identityIssuedAt: formData.identityIssuedAt || null,
        identityImages: formData.identityImages.filter(Boolean),
        avatar: formData.avatar,
        phoneNumber: formData.phoneNumber.trim(),
      };

      const { data } = await api.post('/carers/apply/overview', payload);
      login({ ...user, ...data.user, token: user.token });
      navigate('/caregiver/apply/job', { state: { overviewData: payload } });
    } catch (err: any) {
      console.error('Overview submit failed:', err);
      setError(err.response?.data?.message || 'Không thể lưu thông tin cơ bản.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="apply-page apply-state-page">
        <Navbar />
        <div className="apply-state-loading">
          <Loader2 className="spinner" />
          <p>Đang tải thông tin hồ sơ...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="apply-page">
      <Navbar />

      <main className="container apply-content">
        <nav className="breadcrumb">
          <Link to="/">Trang chủ</Link>
          <ChevronRight size={14} />
          <Link to="/account/request">Tài khoản</Link>
          <ChevronRight size={14} />
          <span>Đăng ký bảo mẫu</span>
        </nav>

        <div className="apply-layout">
          <aside className="apply-steps-sidebar">
            <div className="steps-container">
              <div className="step-item active">
                <div className="step-indicator">
                  <div className="step-circle" />
                  <div className="step-line" />
                </div>
                <div className="step-text">
                  <h3>General Info</h3>
                  <p>Cung cấp thông tin cá nhân cơ bản</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-indicator">
                  <div className="step-circle" />
                </div>
                <div className="step-text">
                  <h3>Job detail</h3>
                  <p>Thông tin kỹ năng và lịch làm việc</p>
                </div>
              </div>
            </div>
          </aside>

          <section className="apply-form-area">
            <div className="apply-form-heading">
              <p className="section-eyebrow">Caregiver onboarding</p>
              <h1>General Info</h1>
            </div>

            <form className="apply-form-card" onSubmit={handleSubmit}>
              {error && <div className="form-alert">{error}</div>}

              <div className="avatar-upload-section">
                <div className="avatar-preview">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" />
                  ) : (
                    <UserCircle2 size={82} strokeWidth={1.2} />
                  )}
                </div>
                <div className="upload-controls">
                  <p>Ảnh đại diện</p>
                  <ImageUpload
                    onUploadSuccess={(url) => setFormData((prev) => ({ ...prev, avatar: url }))}
                    defaultImage={formData.avatar || undefined}
                    label=""
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="input-group">
                  <label>Tên</label>
                  <input
                    type="text"
                    placeholder="Văn A"
                    value={formData.firstName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Họ</label>
                  <input
                    type="text"
                    placeholder="Nguyễn"
                    value={formData.lastName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Số điện thoại</label>
                  <input
                    type="tel"
                    placeholder="0901234567"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                  />
                </div>
                <div className="input-group">
                  <label>Ngày sinh</label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, birthDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Giới tính</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData((prev) => ({ ...prev, gender: e.target.value }))}
                    required
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="female">Nữ</option>
                    <option value="male">Nam</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Địa chỉ</label>
                  <input
                    type="text"
                    placeholder="Số nhà, đường, quận, thành phố"
                    value={formData.location}
                    onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="identity-block">
                <div className="section-divider">
                  <span>Thông tin định danh</span>
                </div>

                <div className="form-grid-2">
                  <div className="input-group">
                    <label>CMND / CCCD</label>
                    <input
                      type="text"
                      placeholder="0123456789"
                      value={formData.identityNumber}
                      onChange={(e) => setFormData((prev) => ({ ...prev, identityNumber: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Họ tên trên giấy tờ</label>
                    <input
                      type="text"
                      placeholder="Nguyễn Văn A"
                      value={formData.identityName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, identityName: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Ngày cấp</label>
                    <input
                      type="date"
                      value={formData.identityIssuedAt}
                      onChange={(e) => setFormData((prev) => ({ ...prev, identityIssuedAt: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="id-cards-upload">
                  <div className="id-card-block">
                    <label>Thẻ CCCD mặt trước</label>
                    <div className="upload-wrapper">
                      <ImageUpload
                        onUploadSuccess={(url) => updateIdentityImage(0, url)}
                        defaultImage={formData.identityImages[0] || undefined}
                        label=""
                      />
                    </div>
                  </div>
                  <div className="id-card-block">
                    <label>Thẻ CCCD mặt sau</label>
                    <div className="upload-wrapper">
                      <ImageUpload
                        onUploadSuccess={(url) => updateIdentityImage(1, url)}
                        defaultImage={formData.identityImages[1] || undefined}
                        label=""
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-actions-right">
                <button type="submit" className="btn-next-step" disabled={saving}>
                  {saving ? <Loader2 size={18} className="spinner" /> : 'Tiếp tục'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CaregiverApplyOverview;
