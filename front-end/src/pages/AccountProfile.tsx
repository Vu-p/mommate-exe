import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Baby, Cake, Edit3, HeartPulse, Loader2, Plus, Ruler, Scale, Trash2, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Modal from '../components/common/Modal';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './AccountProfile.css';

type UserProfile = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
};

type CareProfile = {
  _id: string;
  type: 'mother' | 'baby';
  displayName: string;
  birthDate?: string;
  recoveryStatus?: string;
  deliveryMethod?: 'unknown' | 'vaginal' | 'c_section';
  allergies?: string[];
  medicalHistory?: string[];
  notes?: string;
  weightKg?: number;
  heightCm?: number;
  bloodType?: string;
  isPrimary?: boolean;
};

const emptyCareForm = {
  type: 'baby' as 'mother' | 'baby',
  displayName: '',
  birthDate: '',
  recoveryStatus: '',
  deliveryMethod: 'unknown',
  allergies: '',
  medicalHistory: '',
  notes: '',
  weightKg: '',
  heightCm: '',
  bloodType: '',
  isPrimary: false,
};

const toDateInput = (value?: string) => value ? new Date(value).toISOString().slice(0, 10) : '';
const splitList = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);
const formatDate = (value?: string) => value ? new Date(value).toLocaleDateString('vi-VN') : 'Chưa cập nhật';

const AccountProfile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, updateUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({});
  const [careProfiles, setCareProfiles] = useState<CareProfile[]>([]);
  const [selectedId, setSelectedId] = useState<string>('account');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [accountOpen, setAccountOpen] = useState(false);
  const [careOpen, setCareOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [accountForm, setAccountForm] = useState({ firstName: '', lastName: '', phoneNumber: '', address: '' });
  const [careForm, setCareForm] = useState(emptyCareForm);

  const load = async () => {
    const [userResponse, careResponse] = await Promise.all([api.get('/users/me'), api.get('/care-profiles')]);
    const nextProfile = userResponse.data;
    const items = Array.isArray(careResponse.data) ? careResponse.data : careResponse.data.items || [];
    setProfile(nextProfile);
    setCareProfiles(items);
    setAccountForm({
      firstName: nextProfile.firstName || '',
      lastName: nextProfile.lastName || '',
      phoneNumber: nextProfile.phoneNumber || '',
      address: nextProfile.address || '',
    });
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }
    void load().catch((error) => {
      console.error('Cannot load care profiles:', error);
      setProfile(user);
      setMessage('Không thể tải đầy đủ hồ sơ chăm sóc.');
    }).finally(() => setLoading(false));
  }, [authLoading, navigate, user]);

  const selected = useMemo(() => careProfiles.find((item) => item._id === selectedId), [careProfiles, selectedId]);
  const parentName = `${profile.firstName || user?.firstName || ''} ${profile.lastName || user?.lastName || ''}`.trim() || 'Phụ huynh';

  const openNewCareProfile = (type: 'mother' | 'baby' = 'baby') => {
    setEditingId(null);
    setCareForm({ ...emptyCareForm, type });
    setMessage('');
    setCareOpen(true);
  };

  const openEditCareProfile = (item: CareProfile) => {
    setEditingId(item._id);
    setCareForm({
      type: item.type,
      displayName: item.displayName,
      birthDate: toDateInput(item.birthDate),
      recoveryStatus: item.recoveryStatus || '',
      deliveryMethod: item.deliveryMethod || 'unknown',
      allergies: (item.allergies || []).join(', '),
      medicalHistory: (item.medicalHistory || []).join(', '),
      notes: item.notes || '',
      weightKg: item.weightKg?.toString() || '',
      heightCm: item.heightCm?.toString() || '',
      bloodType: item.bloodType || '',
      isPrimary: Boolean(item.isPrimary),
    });
    setMessage('');
    setCareOpen(true);
  };

  const saveAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const { data } = await api.put('/users/me', accountForm);
      setProfile(data);
      updateUser(data);
      setAccountOpen(false);
      setMessage('Đã cập nhật thông tin tài khoản.');
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Không thể cập nhật thông tin tài khoản.');
    } finally {
      setSaving(false);
    }
  };

  const saveCareProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    const payload = {
      ...careForm,
      allergies: splitList(careForm.allergies),
      medicalHistory: splitList(careForm.medicalHistory),
      birthDate: careForm.birthDate || undefined,
      weightKg: careForm.weightKg || undefined,
      heightCm: careForm.heightCm || undefined,
    };
    try {
      const { data } = editingId
        ? await api.put(`/care-profiles/${editingId}`, payload)
        : await api.post('/care-profiles', payload);
      setCareProfiles((items) => editingId ? items.map((item) => item._id === editingId ? data : item) : [...items, data]);
      setSelectedId(data._id);
      setCareOpen(false);
      setMessage(editingId ? 'Đã cập nhật hồ sơ chăm sóc.' : 'Đã thêm hồ sơ chăm sóc.');
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Không thể lưu hồ sơ chăm sóc.');
    } finally {
      setSaving(false);
    }
  };

  const removeCareProfile = async (item: CareProfile) => {
    if (!window.confirm(`Xóa hồ sơ “${item.displayName}”?`)) return;
    try {
      await api.delete(`/care-profiles/${item._id}`);
      setCareProfiles((items) => items.filter((profileItem) => profileItem._id !== item._id));
      setSelectedId('account');
      setMessage('Đã xóa hồ sơ chăm sóc.');
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Không thể xóa hồ sơ chăm sóc.');
    }
  };

  if (authLoading || loading) {
    return <div className="care-profile-page"><Navbar /><main className="care-profile-loading"><Loader2 className="spinner" />Đang tải hồ sơ chăm sóc...</main></div>;
  }

  return (
    <div className="care-profile-page">
      <Navbar />
      <main className="container care-profile-content">
        <header className="care-profile-heading">
          <div><h1>Hồ sơ chăm sóc</h1><p>Thông tin này giúp chuyên gia chuẩn bị phù hợp trước mỗi booking.</p></div>
          <button type="button" className="care-profile-edit" onClick={() => openNewCareProfile('baby')}><Plus size={18} />Thêm hồ sơ</button>
        </header>
        {message && <p className="care-profile-message" role="status">{message}</p>}

        <div className="care-profile-grid">
          <aside className="family-profile-list">
            <h2>Thành viên gia đình</h2>
            <button type="button" className={`family-profile ${selectedId === 'account' ? 'active' : ''}`} onClick={() => setSelectedId('account')}>
              <span><UserRound size={23} /></span><div><strong>{parentName}</strong><small>Tài khoản phụ huynh</small></div>
            </button>
            {careProfiles.map((item) => <button type="button" className={`family-profile ${selectedId === item._id ? 'active' : ''}`} key={item._id} onClick={() => setSelectedId(item._id)}>
              <span className={item.type === 'baby' ? 'baby-avatar' : ''}>{item.type === 'baby' ? <Baby size={23} /> : <HeartPulse size={23} />}</span>
              <div><strong>{item.displayName}</strong><small>{item.type === 'baby' ? 'Hồ sơ bé' : 'Hồ sơ mẹ'}{item.isPrimary ? ' · Chính' : ''}</small></div>
            </button>)}
            <button type="button" className="family-profile add" onClick={() => openNewCareProfile('baby')}><span><Plus size={23} /></span><strong>Thêm hồ sơ mẹ hoặc bé</strong></button>
          </aside>

          <div className="care-profile-main">
            {selectedId === 'account' ? (
              <section className="care-information-card account-information-card">
                <header><div><UserRound size={30} /><h2>Thông tin tài khoản</h2></div><button type="button" onClick={() => setAccountOpen(true)}><Edit3 size={17} />Chỉnh sửa</button></header>
                <div className="account-information-grid">
                  <Info label="Họ và tên" value={parentName} />
                  <Info label="Email" value={profile.email || 'Chưa cập nhật'} />
                  <Info label="Số điện thoại" value={profile.phoneNumber || 'Chưa cập nhật'} />
                  <Info label="Địa chỉ" value={profile.address || 'Chưa cập nhật'} />
                </div>
                {!careProfiles.length && <div className="care-profile-empty"><Baby /><h3>Chưa có hồ sơ chăm sóc</h3><p>Thêm hồ sơ mẹ hoặc bé để lưu các lưu ý sức khỏe phục vụ booking.</p><button type="button" onClick={() => openNewCareProfile('baby')}>Thêm hồ sơ đầu tiên</button></div>}
              </section>
            ) : selected ? (
              <section className={`care-information-card ${selected.type === 'baby' ? 'baby-card' : ''}`}>
                <header>
                  <div>{selected.type === 'baby' ? <Baby size={30} /> : <HeartPulse size={30} />}<h2>{selected.displayName}</h2></div>
                  <div className="care-card-actions"><button type="button" onClick={() => openEditCareProfile(selected)}><Edit3 size={17} />Sửa</button><button type="button" className="danger" onClick={() => removeCareProfile(selected)}><Trash2 size={17} />Xóa</button></div>
                </header>
                <div className="care-detail-grid">
                  <Info icon={<Cake />} label="Ngày sinh" value={formatDate(selected.birthDate)} />
                  <Info icon={<Scale />} label="Cân nặng" value={selected.weightKg ? `${selected.weightKg} kg` : 'Chưa cập nhật'} />
                  <Info icon={<Ruler />} label="Chiều cao" value={selected.heightCm ? `${selected.heightCm} cm` : 'Chưa cập nhật'} />
                  <Info label="Nhóm máu" value={selected.bloodType || 'Chưa cập nhật'} />
                  {selected.type === 'mother' && <Info label="Phương pháp sinh" value={{ unknown: 'Chưa cập nhật', vaginal: 'Sinh thường', c_section: 'Sinh mổ' }[selected.deliveryMethod || 'unknown']} />}
                  <Info label="Trạng thái" value={selected.recoveryStatus || 'Chưa cập nhật'} />
                </div>
                <div className="care-health-sections">
                  <ListSection title="Dị ứng" items={selected.allergies} warning />
                  <ListSection title="Tiền sử và tình trạng cần lưu ý" items={selected.medicalHistory} />
                  <div><strong>Ghi chú chăm sóc</strong><p>{selected.notes || 'Chưa có ghi chú.'}</p></div>
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </main>
      <Footer />

      <Modal isOpen={accountOpen} onClose={() => setAccountOpen(false)} title="Cập nhật tài khoản">
        <form className="care-profile-form" onSubmit={saveAccount}>
          <label>Họ<input required value={accountForm.firstName} onChange={(event) => setAccountForm({ ...accountForm, firstName: event.target.value })} /></label>
          <label>Tên<input required value={accountForm.lastName} onChange={(event) => setAccountForm({ ...accountForm, lastName: event.target.value })} /></label>
          <label>Số điện thoại<input value={accountForm.phoneNumber} onChange={(event) => setAccountForm({ ...accountForm, phoneNumber: event.target.value })} /></label>
          <label className="full">Địa chỉ<textarea value={accountForm.address} onChange={(event) => setAccountForm({ ...accountForm, address: event.target.value })} /></label>
          <div className="care-form-actions full"><button type="button" onClick={() => setAccountOpen(false)}>Hủy</button><button className="primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button></div>
        </form>
      </Modal>

      <Modal isOpen={careOpen} onClose={() => setCareOpen(false)} title={editingId ? 'Cập nhật hồ sơ chăm sóc' : 'Thêm hồ sơ chăm sóc'}>
        <form className="care-profile-form" onSubmit={saveCareProfile}>
          <label>Loại hồ sơ<select value={careForm.type} onChange={(event) => setCareForm({ ...careForm, type: event.target.value as 'mother' | 'baby' })}><option value="mother">Mẹ</option><option value="baby">Bé</option></select></label>
          <label>Tên hiển thị<input required minLength={2} maxLength={80} value={careForm.displayName} onChange={(event) => setCareForm({ ...careForm, displayName: event.target.value })} /></label>
          <label>Ngày sinh<input type="date" max={new Date().toISOString().slice(0, 10)} value={careForm.birthDate} onChange={(event) => setCareForm({ ...careForm, birthDate: event.target.value })} /></label>
          <label>Trạng thái chăm sóc<input value={careForm.recoveryStatus} placeholder="Ví dụ: đang phục hồi sau sinh" onChange={(event) => setCareForm({ ...careForm, recoveryStatus: event.target.value })} /></label>
          {careForm.type === 'mother' && <label>Phương pháp sinh<select value={careForm.deliveryMethod} onChange={(event) => setCareForm({ ...careForm, deliveryMethod: event.target.value })}><option value="unknown">Chưa cập nhật</option><option value="vaginal">Sinh thường</option><option value="c_section">Sinh mổ</option></select></label>}
          <label>Cân nặng (kg)<input type="number" min="0.1" max="300" step="0.1" value={careForm.weightKg} onChange={(event) => setCareForm({ ...careForm, weightKg: event.target.value })} /></label>
          <label>Chiều cao (cm)<input type="number" min="1" max="250" step="0.1" value={careForm.heightCm} onChange={(event) => setCareForm({ ...careForm, heightCm: event.target.value })} /></label>
          <label>Nhóm máu<input value={careForm.bloodType} placeholder="Ví dụ: O+" onChange={(event) => setCareForm({ ...careForm, bloodType: event.target.value })} /></label>
          <label className="full">Dị ứng, cách nhau bằng dấu phẩy<input value={careForm.allergies} onChange={(event) => setCareForm({ ...careForm, allergies: event.target.value })} /></label>
          <label className="full">Tiền sử/tình trạng cần lưu ý, cách nhau bằng dấu phẩy<input value={careForm.medicalHistory} onChange={(event) => setCareForm({ ...careForm, medicalHistory: event.target.value })} /></label>
          <label className="full">Ghi chú chăm sóc<textarea maxLength={2000} value={careForm.notes} onChange={(event) => setCareForm({ ...careForm, notes: event.target.value })} /></label>
          <label className="care-primary-check full"><input type="checkbox" checked={careForm.isPrimary} onChange={(event) => setCareForm({ ...careForm, isPrimary: event.target.checked })} />Đặt làm hồ sơ chính cho loại này</label>
          <div className="care-form-actions full"><button type="button" onClick={() => setCareOpen(false)}>Hủy</button><button className="primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu hồ sơ'}</button></div>
        </form>
      </Modal>
    </div>
  );
};

const Info = ({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) => <article className="care-info-item">{icon}<small>{label}</small><strong>{value}</strong></article>;
const ListSection = ({ title, items = [], warning = false }: { title: string; items?: string[]; warning?: boolean }) => <div className={warning ? 'care-list-section warning' : 'care-list-section'}><strong>{warning && <AlertTriangle size={17} />}{title}</strong>{items.length ? <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul> : <p>Chưa cập nhật.</p>}</div>;

export default AccountProfile;
