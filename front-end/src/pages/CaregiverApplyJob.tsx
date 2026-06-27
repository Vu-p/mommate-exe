import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Clock3, Loader2, Plus, Sparkles, Trash2 } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ImageUpload from '../components/common/ImageUpload';
import api from '../utils/api';
import './CaregiverApplyJob.css';
import './CarerRedesign.css';

type ServiceOption = {
  _id: string;
  title: string;
  category?: string;
};

type CertificateItem = {
  name: string;
  issuer: string;
  fileUrl: string;
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
];

const createEmptyAvailability = (): AvailabilityMap =>
  DAYS.reduce<AvailabilityMap>((acc, day) => {
    acc[day.key] = [];
    return acc;
  }, {});

const createEmptyCertificate = (): CertificateItem => ({
  name: '',
  issuer: '',
  fileUrl: '',
});

const normalizeAvailability = (availability?: { day: string; slots: string[] }[]) => {
  const map = createEmptyAvailability();
  availability?.forEach((item) => {
    if (map[item.day]) {
      map[item.day] = Array.from(new Set([...(map[item.day] || []), ...(item.slots || [])]));
    }
  });
  return map;
};

const CaregiverApplyJob = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const overviewData = useMemo(() => location.state?.overviewData || {}, [location.state]);

  const [services, setServices] = useState<ServiceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    bio: '',
    experienceYears: '',
    pricingType: 'hourly' as 'hourly' | 'fixed',
    hourlyRate: '',
    fixedRate: '',
    platformFeePercent: '10',
    serviceIds: [] as string[],
    workplaceName: '',
    workplaceType: 'hospital',
    department: '',
    position: '',
    employeeIdOrLicenseNote: '',
    workplaceProofImages: [] as string[],
    certificationDetails: [createEmptyCertificate()],
    availability: createEmptyAvailability(),
  });

  const selectedServiceCount = formData.serviceIds.length;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [serviceRes, carerRes] = await Promise.allSettled([
          api.get('/services'),
          api.get('/carers/me'),
        ]);

        if (serviceRes.status === 'fulfilled') {
          const serviceData = serviceRes.value.data;
          setServices(Array.isArray(serviceData) ? serviceData : serviceData?.items || []);
        } else {
          setError('Không thể tải danh sách dịch vụ.');
        }

        if (carerRes.status === 'fulfilled') {
          const carer = carerRes.value.data?.carer;
          const user = carerRes.value.data?.user;
          if (carer) {
            setFormData((prev) => ({
              ...prev,
              bio: carer.bio || '',
              experienceYears: carer.experienceYears?.toString() || '',
              pricingType: carer.pricingType || 'hourly',
              hourlyRate: carer.hourlyRate?.toString() || '',
              fixedRate: carer.fixedRate?.toString() || '',
              platformFeePercent: carer.platformFeePercent?.toString() || '10',
              serviceIds: (carer.services || []).map((service: ServiceOption | string) =>
                typeof service === 'string' ? service : service._id
              ),
              workplaceName: carer.workplaceName || '',
              workplaceType: carer.workplaceType || 'hospital',
              department: carer.department || '',
              position: carer.position || '',
              employeeIdOrLicenseNote: carer.employeeIdOrLicenseNote || '',
              workplaceProofImages: carer.workplaceProofImages || [],
              certificationDetails:
                carer.certificationDetails?.length > 0
                  ? carer.certificationDetails.map((cert: any) => ({
                      name: cert.name || '',
                      issuer: cert.issuer || '',
                      fileUrl: cert.fileUrl || '',
                    }))
                  : [createEmptyCertificate()],
              availability: normalizeAvailability(carer.availability),
            }));
          } else if (overviewData && user) {
            setFormData((prev) => ({
              ...prev,
              bio: prev.bio || '',
            }));
          }
        } else {
          setError((prev) => prev || 'Không thể tải hồ sơ nghề nghiệp.');
        }
      } catch (err) {
        console.error('Error loading caregiver job data:', err);
        setError('Không thể tải dữ liệu hồ sơ nghề nghiệp.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [overviewData]);



  const estimatedValue = useMemo(() => {
    const rate = formData.pricingType === 'fixed' ? Number(formData.fixedRate || 0) : Number(formData.hourlyRate || 0);
    return rate > 0 ? rate : 0;
  }, [formData.fixedRate, formData.hourlyRate, formData.pricingType]);

  const selectedAvailabilityCount = useMemo(
    () => Object.values(formData.availability).reduce((sum, slots) => sum + slots.length, 0),
    [formData.availability]
  );

  const toggleService = (serviceId: string) => {
    setFormData((prev) => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(serviceId)
        ? prev.serviceIds.filter((id) => id !== serviceId)
        : [...prev.serviceIds, serviceId],
    }));
  };

  const toggleSlot = (dayKey: string, slotValue: string) => {
    setFormData((prev) => {
      const currentSlots = prev.availability[dayKey] || [];
      const nextSlots = currentSlots.includes(slotValue)
        ? currentSlots.filter((slot) => slot !== slotValue)
        : [...currentSlots, slotValue];

      return {
        ...prev,
        availability: {
          ...prev.availability,
          [dayKey]: nextSlots,
        },
      };
    });
  };

  const updateCertificate = (index: number, field: keyof CertificateItem, value: string) => {
    setFormData((prev) => {
      const certificationDetails = [...prev.certificationDetails];
      certificationDetails[index] = {
        ...certificationDetails[index],
        [field]: value,
      };
      return { ...prev, certificationDetails };
    });
  };

  const addCertificate = () => {
    setFormData((prev) => ({
      ...prev,
      certificationDetails: [...prev.certificationDetails, createEmptyCertificate()],
    }));
  };

  const removeCertificate = (index: number) => {
    setFormData((prev) => {
      const certificationDetails = prev.certificationDetails.filter((_, i) => i !== index);
      return {
        ...prev,
        certificationDetails: certificationDetails.length > 0 ? certificationDetails : [createEmptyCertificate()],
      };
    });
  };



  const handleSubmit = async (submit: boolean) => {
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const serviceIds = formData.serviceIds;
      const certificationDetails = formData.certificationDetails
        .map((cert) => ({
          name: cert.name.trim(),
          issuer: cert.issuer.trim(),
          fileUrl: cert.fileUrl.trim(),
        }))
        .filter((cert) => cert.name || cert.issuer || cert.fileUrl);

      if (submit) {
        if (serviceIds.length === 0) {
          throw new Error('Vui lòng chọn ít nhất 1 dịch vụ.');
        }
        if (!formData.bio.trim()) {
          throw new Error('Vui lòng nhập mô tả kinh nghiệm.');
        }
        if (!formData.experienceYears.trim()) {
          throw new Error('Vui lòng nhập số năm kinh nghiệm.');
        }
        if (!formData.workplaceName.trim()) {
          throw new Error('Vui lòng nhập bệnh viện/phòng khám hoặc nơi làm việc.');
        }
        if (!formData.position.trim()) {
          throw new Error('Vui lòng nhập vị trí chuyên môn hiện tại.');
        }
        if (formData.pricingType === 'hourly' && !formData.hourlyRate.trim()) {
          throw new Error('Vui lòng nhập giá theo giờ.');
        }
        if (formData.pricingType === 'fixed' && !formData.fixedRate.trim()) {
          throw new Error('Vui lòng nhập giá cố định.');
        }
      }

      const payload = {
        ...overviewData,
        bio: formData.bio.trim(),
        experienceYears: Number(formData.experienceYears || 0),
        certifications: certificationDetails.map((cert) => cert.name).filter(Boolean),
        certificationDetails,
        services: serviceIds,
        serviceIds,
        pricingType: formData.pricingType,
        hourlyRate: Number(formData.hourlyRate || 0),
        fixedRate: formData.pricingType === 'fixed' ? Number(formData.fixedRate || 0) : undefined,
        platformFeePercent: Number(formData.platformFeePercent || 10),
        workplaceName: formData.workplaceName.trim(),
        workplaceType: formData.workplaceType,
        department: formData.department.trim(),
        position: formData.position.trim(),
        employeeIdOrLicenseNote: formData.employeeIdOrLicenseNote.trim(),
        workplaceProofImages: formData.workplaceProofImages.filter(Boolean),
        availability: DAYS.map((day) => ({
          day: day.key,
          slots: formData.availability[day.key] || [],
        })).filter((item) => item.slots.length > 0),
        submit,
      };

      await api.post('/carers/apply/job', payload);

      if (submit) {
        navigate('/account/request');
        return;
      }

      setMessage('Đã lưu bản nháp hồ sơ nghề nghiệp.');
    } catch (err: any) {
      console.error('Error saving caregiver job profile:', err);
      setError(err.response?.data?.message || err.message || 'Không thể lưu hồ sơ nghề nghiệp.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="apply-page apply-state-page caregiver-job-page">
        <Navbar />
        <div className="apply-state-loading">
          <Loader2 className="spinner" />
          <p>Đang tải thông tin nghề nghiệp...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="apply-page caregiver-job-page">
      <Navbar />

      <main className="container apply-content">
        <nav className="breadcrumb">
          <Link to="/">Trang chủ</Link>
          <ChevronRight size={14} />
          <Link to="/caregiver/apply/overview">Đăng ký bảo mẫu</Link>
          <ChevronRight size={14} />
          <span>Job detail</span>
        </nav>

        <div className="apply-layout">
          <aside className="apply-steps-sidebar">
            <div className="steps-container">
              <div className="step-item completed">
                <div className="step-indicator">
                  <div className="step-circle" />
                  <div className="step-line" />
                </div>
                <div className="step-text">
                  <h3>General Info</h3>
                  <p>Cung cấp thông tin cá nhân cơ bản</p>
                </div>
              </div>
              <div className="step-item active">
                <div className="step-indicator">
                  <div className="step-circle" />
                </div>
                <div className="step-text">
                  <h3>Job detail</h3>
                  <p>Thông tin kỹ năng và lịch làm việc</p>
                </div>
              </div>
            </div>

            <div className="job-summary-card">
              <p className="summary-label">Đã chọn</p>
              <strong>{selectedServiceCount} dịch vụ</strong>
              <span>{selectedAvailabilityCount} khung giờ</span>
            </div>
          </aside>

          <section className="apply-form-area">
            <div className="apply-form-heading">
              <p className="section-eyebrow">Caregiver onboarding</p>
              <h1>Job detail</h1>
            </div>

            <div className="job-toolbar">
              <div className="toolbar-chip">
                <Sparkles size={16} />
                <span>{selectedServiceCount} dịch vụ đã chọn</span>
              </div>
              <div className="toolbar-chip">
                <Clock3 size={16} />
                <span>{selectedAvailabilityCount} khung giờ khả dụng</span>
              </div>
            </div>

            {error && <div className="form-alert">{error}</div>}
            {message && <div className="form-success">{message}</div>}

            <section className="apply-form-card">
              <div className="job-section">
                <label className="section-label">Chọn dịch vụ mong muốn làm việc</label>
                <div className="service-pills">
                  {services.map((service) => (
                    <button
                      key={service._id}
                      type="button"
                      className={`service-pill ${formData.serviceIds.includes(service._id) ? 'active' : ''}`}
                      onClick={() => toggleService(service._id)}
                    >
                      <span>{service.title}</span>
                      {service.category && <small>{service.category}</small>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="job-grid-2">
                <div className="input-group full-span">
                  <label>Mô tả kinh nghiệm</label>
                  <textarea
                    rows={5}
                    placeholder="Chia sẻ kinh nghiệm chăm sóc mẹ và bé, chuyên môn, phong cách làm việc..."
                    value={formData.bio}
                    onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                  />
                </div>

                <div className="input-group">
                  <label>Số năm kinh nghiệm</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="4"
                    value={formData.experienceYears}
                    onChange={(e) => setFormData((prev) => ({ ...prev, experienceYears: e.target.value }))}
                  />
                </div>

                <div className="input-group">
                  <label>Phí nền tảng (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="10"
                    value={formData.platformFeePercent}
                    onChange={(e) => setFormData((prev) => ({ ...prev, platformFeePercent: e.target.value }))}
                  />
                </div>
                <div className="input-group full-span">
                  <label>Bệnh viện / phòng khám / nơi làm việc</label>
                  <input
                    type="text"
                    placeholder="Bệnh viện Từ Dũ, phòng khám sản nhi..."
                    value={formData.workplaceName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, workplaceName: e.target.value }))}
                  />
                </div>
                <div className="input-group">
                  <label>Loại nơi làm việc</label>
                  <select
                    value={formData.workplaceType}
                    onChange={(e) => setFormData((prev) => ({ ...prev, workplaceType: e.target.value }))}
                  >
                    <option value="hospital">Bệnh viện</option>
                    <option value="clinic">Phòng khám</option>
                    <option value="private_practice">Tư nhân</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Khoa / phòng ban</label>
                  <input
                    type="text"
                    placeholder="Sản nhi, điều dưỡng, hộ sinh..."
                    value={formData.department}
                    onChange={(e) => setFormData((prev) => ({ ...prev, department: e.target.value }))}
                  />
                </div>
                <div className="input-group">
                  <label>Vị trí chuyên môn</label>
                  <input
                    type="text"
                    placeholder="Y tá, điều dưỡng sản nhi, hộ sinh..."
                    value={formData.position}
                    onChange={(e) => setFormData((prev) => ({ ...prev, position: e.target.value }))}
                  />
                </div>
                <div className="input-group">
                  <label>Mã nhân sự / ghi chú hành nghề</label>
                  <input
                    type="text"
                    placeholder="Không bắt buộc trong MVP"
                    value={formData.employeeIdOrLicenseNote}
                    onChange={(e) => setFormData((prev) => ({ ...prev, employeeIdOrLicenseNote: e.target.value }))}
                  />
                </div>
              </div>

              <div className="pricing-section">
                <div className="section-header-row">
                  <label className="section-label">Mức giá làm việc</label>
                  <div className="pricing-toggle">
                    <button
                      type="button"
                      className={formData.pricingType === 'hourly' ? 'active' : ''}
                      onClick={() => setFormData((prev) => ({ ...prev, pricingType: 'hourly' }))}
                    >
                      Theo giờ
                    </button>
                    <button
                      type="button"
                      className={formData.pricingType === 'fixed' ? 'active' : ''}
                      onClick={() => setFormData((prev) => ({ ...prev, pricingType: 'fixed' }))}
                    >
                      Trọn gói
                    </button>
                  </div>
                </div>

                <div className="job-grid-2">
                  {formData.pricingType === 'hourly' ? (
                    <div className="input-group full-span">
                      <label>Giá theo giờ (VNĐ)</label>
                      <input
                        type="number"
                        placeholder="150000"
                        value={formData.hourlyRate}
                        onChange={(e) => setFormData((prev) => ({ ...prev, hourlyRate: e.target.value }))}
                      />
                    </div>
                  ) : (
                    <div className="input-group full-span">
                      <label>Giá trọn gói (VNĐ)</label>
                      <input
                        type="number"
                        placeholder="1200000"
                        value={formData.fixedRate}
                        onChange={(e) => setFormData((prev) => ({ ...prev, fixedRate: e.target.value }))}
                      />
                    </div>
                  )}
                </div>

                <div className="estimate-card">
                  <span>Tổng ước tính</span>
                  <strong>
                    {estimatedValue ? `${estimatedValue.toLocaleString('vi-VN')} VND` : 'Chưa có giá'}
                  </strong>
                </div>
              </div>

              <div className="job-section">
                <div className="section-header-row">
                  <label className="section-label">Chứng chỉ</label>
                  <button type="button" className="btn-text-add" onClick={addCertificate}>
                    <Plus size={16} /> Thêm chứng chỉ
                  </button>
                </div>

                <div className="certificate-list">
                  {formData.certificationDetails.map((certificate, index) => (
                    <div key={`${index}-${certificate.name}`} className="certificate-card">
                      <div className="certificate-card-head">
                        <strong>Chứng chỉ {index + 1}</strong>
                        <button type="button" className="btn-remove-cert" onClick={() => removeCertificate(index)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="job-grid-2">
                        <div className="input-group">
                          <label>Tên chứng chỉ</label>
                          <input
                            type="text"
                            placeholder="IBCLC Consultant"
                            value={certificate.name}
                            onChange={(e) => updateCertificate(index, 'name', e.target.value)}
                          />
                        </div>
                        <div className="input-group">
                          <label>Đơn vị cấp</label>
                          <input
                            type="text"
                            placeholder="Mommate Academy"
                            value={certificate.issuer}
                            onChange={(e) => updateCertificate(index, 'issuer', e.target.value)}
                          />
                        </div>
                      </div>
                      <ImageUpload
                        onUploadSuccess={(url) => updateCertificate(index, 'fileUrl', url)}
                        defaultImage={certificate.fileUrl || undefined}
                        label=""
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="job-section">
                <label className="section-label">Lịch làm việc linh hoạt</label>
                <div className="availability-matrix-container">
                  <div className="matrix-header">
                    <div className="matrix-time-col" />
                    {DAYS.map((day) => (
                      <span key={day.key}>{day.label}</span>
                    ))}
                  </div>

                  {TIME_SLOTS.map((slot) => (
                    <div key={slot.value} className="matrix-row">
                      <span className="matrix-time-label">{slot.label}</span>
                      {DAYS.map((day) => (
                        <button
                          key={`${day.key}-${slot.value}`}
                          type="button"
                          className={`matrix-cell-button ${
                            formData.availability[day.key]?.includes(slot.value) ? 'selected' : ''
                          }`}
                          onClick={() => toggleSlot(day.key, slot.value)}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-actions-flex">
                <button type="button" className="btn-back-step" onClick={() => navigate(-1)}>
                  Quay lại
                </button>
                <div className="form-actions-group">
                  <button
                    type="button"
                    className="btn-save-draft"
                    onClick={() => handleSubmit(false)}
                    disabled={saving}
                  >
                    {saving ? <Loader2 size={18} className="spinner" /> : 'Lưu bản nháp'}
                  </button>
                  <button
                    type="button"
                    className="btn-submit-app"
                    onClick={() => handleSubmit(true)}
                    disabled={saving}
                  >
                    {saving ? <Loader2 size={18} className="spinner" /> : 'Gửi hồ sơ'}
                  </button>
                </div>
              </div>
            </section>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CaregiverApplyJob;
