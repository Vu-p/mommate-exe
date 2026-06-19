import { useEffect, useMemo, useState } from 'react';
import { Briefcase, CalendarDays, Loader2, Save } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ImageUpload from '../components/common/ImageUpload';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './CaregiverApplyJob.css';
import './CaregiverApplyOverview.css';

type ServiceOption = {
  _id: string;
  title: string;
  category?: string;
};

type AvailabilityMap = Record<string, string[]>;

const DAYS = [
  { key: 'Monday', label: 'Thứ 2' },
  { key: 'Tuesday', label: 'Thứ 3' },
  { key: 'Wednesday', label: 'Thứ 4' },
  { key: 'Thursday', label: 'Thứ 5' },
  { key: 'Friday', label: 'Thứ 6' },
  { key: 'Saturday', label: 'Thứ 7' },
  { key: 'Sunday', label: 'CN' },
];

const TIME_SLOTS = [
  { value: '06:00-09:00', label: '6-9 am' },
  { value: '09:00-12:00', label: '9-12 am' },
  { value: '12:00-15:00', label: '12-3 pm' },
  { value: '15:00-18:00', label: '3-6 pm' },
  { value: '18:00-21:00', label: '6-9 pm' },
  { value: '21:00-00:00', label: '9-12 pm' },
  { value: '00:00-06:00', label: '12-6 am' },
];

const createEmptyAvailability = (): AvailabilityMap =>
  DAYS.reduce<AvailabilityMap>((acc, day) => {
    acc[day.key] = [];
    return acc;
  }, {});

const normalizeAvailability = (availability?: { day: string; slots: string[] }[]) => {
  const map = createEmptyAvailability();
  availability?.forEach((item) => {
    if (map[item.day]) {
      map[item.day] = Array.from(new Set([...(map[item.day] || []), ...(item.slots || [])]));
    }
  });
  return map;
};

const toDateInputValue = (value?: string | Date | null) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
};

const CarerProfile = () => {
  const { user, loading: authLoading, updateUser } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    avatar: '',
    location: '',
    birthDate: '',
    gender: '',
    bio: '',
    experienceYears: '',
    pricingType: 'hourly' as 'hourly' | 'fixed',
    hourlyRate: '',
    fixedRate: '',
    serviceIds: [] as string[],
    workplaceName: '',
    workplaceType: 'hospital',
    department: '',
    position: '',
    employeeIdOrLicenseNote: '',
    availability: createEmptyAvailability(),
  });

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'carer')) {
      navigate('/auth?mode=login');
      return;
    }

    if (!authLoading && user?.role === 'carer' && user.mustChangePassword) {
      navigate('/change-password');
      return;
    }

    if (!authLoading && user?.role === 'carer') {
      fetchData();
    }
  }, [authLoading, user, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [servicesRes, profileRes] = await Promise.all([
        api.get('/services'),
        api.get('/carers/me'),
      ]);

      const carer = profileRes.data?.carer || profileRes.data || {};
      const profileUser = carer.user || profileRes.data?.user || {};
      const servicePayload = servicesRes.data;
      setServices(Array.isArray(servicePayload) ? servicePayload : servicePayload?.items || servicePayload?.services || []);
      setForm({
        firstName: profileUser.firstName || user?.firstName || '',
        lastName: profileUser.lastName || user?.lastName || '',
        phoneNumber: profileUser.phoneNumber || '',
        avatar: profileUser.avatar || user?.avatar || '',
        location: carer.location || profileUser.address || '',
        birthDate: toDateInputValue(profileUser.birthDate),
        gender: profileUser.gender || '',
        bio: carer.bio || '',
        experienceYears: carer.experienceYears?.toString() || '',
        pricingType: carer.pricingType || 'hourly',
        hourlyRate: carer.hourlyRate?.toString() || '',
        fixedRate: carer.fixedRate?.toString() || '',
        serviceIds: (carer.services || []).map((service: ServiceOption | string) =>
          typeof service === 'string' ? service : service._id
        ),
        workplaceName: carer.workplaceName || '',
        workplaceType: carer.workplaceType || 'hospital',
        department: carer.department || '',
        position: carer.position || '',
        employeeIdOrLicenseNote: carer.employeeIdOrLicenseNote || '',
        availability: normalizeAvailability(carer.availability),
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải hồ sơ carer.');
    } finally {
      setLoading(false);
    }
  };

  const selectedAvailabilityCount = useMemo(
    () => Object.values(form.availability).reduce((sum, slots) => sum + slots.length, 0),
    [form.availability]
  );

  const toggleService = (serviceId: string) => {
    setForm((prev) => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(serviceId)
        ? prev.serviceIds.filter((id) => id !== serviceId)
        : [...prev.serviceIds, serviceId],
    }));
  };

  const toggleSlot = (dayKey: string, slotValue: string) => {
    setForm((prev) => {
      const currentSlots = prev.availability[dayKey] || [];
      return {
        ...prev,
        availability: {
          ...prev.availability,
          [dayKey]: currentSlots.includes(slotValue)
            ? currentSlots.filter((slot) => slot !== slotValue)
            : [...currentSlots, slotValue],
        },
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setMessage('');

    try {
      if (form.serviceIds.length === 0) {
        throw new Error('Vui lòng chọn ít nhất 1 dịch vụ bạn có thể nhận.');
      }
      if (!form.location.trim()) {
        throw new Error('Vui lòng cập nhật khu vực làm việc.');
      }

      const payload = {
        ...form,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        location: form.location.trim(),
        bio: form.bio.trim(),
        experienceYears: Number(form.experienceYears || 0),
        hourlyRate: Number(form.hourlyRate || 0),
        fixedRate: form.pricingType === 'fixed' ? Number(form.fixedRate || 0) : undefined,
        services: form.serviceIds,
        serviceIds: form.serviceIds,
        workplaceName: form.workplaceName.trim(),
        department: form.department.trim(),
        position: form.position.trim(),
        employeeIdOrLicenseNote: form.employeeIdOrLicenseNote.trim(),
        availability: DAYS.map((day) => ({
          day: day.key,
          slots: form.availability[day.key] || [],
        })).filter((item) => item.slots.length > 0),
      };

      const { data } = await api.put('/carers/me', payload);
      if (data.user && user) {
        updateUser({ ...data.user, token: user.token });
      }
      setMessage('Đã cập nhật hồ sơ, dịch vụ và lịch làm việc.');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Không thể lưu hồ sơ carer.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="apply-page apply-state-page">
        <Navbar />
        <div className="apply-state-loading">
          <Loader2 className="spinner" />
          <p>Đang tải hồ sơ carer...</p>
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
          <span>/</span>
          <span>Hồ sơ carer</span>
        </nav>

        <div className="apply-layout">
          <aside className="apply-steps-sidebar">
            <div className="job-summary-card">
              <p className="summary-label">Hồ sơ vận hành</p>
              <strong>{form.serviceIds.length} dịch vụ</strong>
              <span>{selectedAvailabilityCount} khung giờ làm việc</span>
            </div>
            <div className="job-summary-card">
              <p className="summary-label">Liên kết nhanh</p>
              <Link to="/carer/bookings">Lịch carer</Link>
              <Link to="/carer/contract">Hợp đồng của tôi</Link>
            </div>
          </aside>

          <section className="apply-form-area">
            <div className="apply-form-heading">
              <p className="section-eyebrow">Carer workspace</p>
              <h1>Cập nhật hồ sơ, dịch vụ và lịch làm việc</h1>
            </div>

            {error && <div className="form-alert">{error}</div>}
            {message && <div className="form-success">{message}</div>}

            <section className="apply-form-card">
              <div className="avatar-upload-section">
                <div className="avatar-preview">
                  {form.avatar ? <img src={form.avatar} alt="Avatar" /> : <Briefcase size={68} strokeWidth={1.3} />}
                </div>
                <div className="upload-controls">
                  <p>Ảnh hồ sơ</p>
                  <ImageUpload
                    onUploadSuccess={(url) => setForm((prev) => ({ ...prev, avatar: url }))}
                    defaultImage={form.avatar || undefined}
                    label=""
                  />
                </div>
              </div>

              <div className="job-grid-2">
                <div className="input-group">
                  <label>Tên</label>
                  <input value={form.firstName} onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label>Họ</label>
                  <input value={form.lastName} onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label>Số điện thoại</label>
                  <input value={form.phoneNumber} onChange={(e) => setForm((prev) => ({ ...prev, phoneNumber: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label>Khu vực làm việc</label>
                  <input value={form.location} onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label>Ngày sinh</label>
                  <input type="date" value={form.birthDate} onChange={(e) => setForm((prev) => ({ ...prev, birthDate: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label>Giới tính</label>
                  <select value={form.gender} onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}>
                    <option value="">Chưa cập nhật</option>
                    <option value="female">Nữ</option>
                    <option value="male">Nam</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
                <div className="input-group full-span">
                  <label>Giới thiệu hồ sơ</label>
                  <textarea
                    rows={5}
                    value={form.bio}
                    onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
                    placeholder="Kinh nghiệm chăm sóc mẹ và bé, chuyên môn, phong cách làm việc..."
                  />
                </div>
              </div>

              <div className="job-section">
                <label className="section-label">Dịch vụ có thể nhận</label>
                <div className="service-pills">
                  {services.map((service) => (
                    <button
                      key={service._id}
                      type="button"
                      className={`service-pill ${form.serviceIds.includes(service._id) ? 'active' : ''}`}
                      onClick={() => toggleService(service._id)}
                    >
                      <span>{service.title}</span>
                      {service.category && <small>{service.category}</small>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="job-grid-2">
                <div className="input-group">
                  <label>Số năm kinh nghiệm</label>
                  <input type="number" min="0" value={form.experienceYears} onChange={(e) => setForm((prev) => ({ ...prev, experienceYears: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label>Giá theo giờ (VND)</label>
                  <input type="number" min="0" value={form.hourlyRate} onChange={(e) => setForm((prev) => ({ ...prev, hourlyRate: e.target.value }))} />
                </div>
                <div className="input-group full-span">
                  <label>Nơi làm việc</label>
                  <input value={form.workplaceName} onChange={(e) => setForm((prev) => ({ ...prev, workplaceName: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label>Loại nơi làm việc</label>
                  <select value={form.workplaceType} onChange={(e) => setForm((prev) => ({ ...prev, workplaceType: e.target.value }))}>
                    <option value="hospital">Bệnh viện</option>
                    <option value="clinic">Phòng khám</option>
                    <option value="private_practice">Tư nhân</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Khoa / phòng ban</label>
                  <input value={form.department} onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label>Vị trí chuyên môn</label>
                  <input value={form.position} onChange={(e) => setForm((prev) => ({ ...prev, position: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label>Mã nhân sự / ghi chú hành nghề</label>
                  <input value={form.employeeIdOrLicenseNote} onChange={(e) => setForm((prev) => ({ ...prev, employeeIdOrLicenseNote: e.target.value }))} />
                </div>
              </div>

              <div className="job-section">
                <label className="section-label">
                  <CalendarDays size={16} /> Lịch làm việc
                </label>
                <div className="availability-matrix-container">
                  <div className="matrix-header">
                    <div className="matrix-time-col" />
                    {DAYS.map((day) => <span key={day.key}>{day.label}</span>)}
                  </div>
                  {TIME_SLOTS.map((slot) => (
                    <div key={slot.value} className="matrix-row">
                      <span className="matrix-time-label">{slot.label}</span>
                      {DAYS.map((day) => (
                        <button
                          key={`${day.key}-${slot.value}`}
                          type="button"
                          className={`matrix-cell-button ${form.availability[day.key]?.includes(slot.value) ? 'selected' : ''}`}
                          onClick={() => toggleSlot(day.key, slot.value)}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-actions-flex">
                <Link to="/carer/bookings" className="btn-back-step">Quay lại lịch</Link>
                <button type="button" className="btn-submit-app" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="spinner" size={18} /> : <Save size={18} />}
                  Lưu hồ sơ
                </button>
              </div>
            </section>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CarerProfile;
