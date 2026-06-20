import { Check, Loader2, MapPin, Save, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import fallbackAvatar from '../assets/stitch/generated/stitch-06-ad3697d45210.png';
import './CarerWorkspace.css';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const slots = ['08:00-10:00', '10:00-12:00', '12:00-14:00', '14:00-16:00', '16:00-18:00'];

const CarerProfile = () => {
  const { user, loading: authLoading, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({ user: {}, services: [], availability: [] });
  const [snapshot, setSnapshot] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    const [profileResponse, serviceResponse] = await Promise.all([
      api.get('/carers/me'),
      api.get('/services', { params: { limit: 100 } }),
    ]);
    const payload = {
      ...(profileResponse.data.carer || {}),
      user: profileResponse.data.user || profileResponse.data.carer?.user || {},
      services: (profileResponse.data.carer?.services || []).map((item: any) => typeof item === 'string' ? item : item._id),
      availability: profileResponse.data.carer?.availability || [],
    };
    setForm(payload);
    setSnapshot(structuredClone(payload));
    setServices(Array.isArray(serviceResponse.data) ? serviceResponse.data : serviceResponse.data.items || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'carer') return navigate('/login');
    if (user.mustChangePassword) return navigate('/change-password');
    void load();
  }, [authLoading, load, navigate, user]);

  const update = (field: string, value: unknown) => setForm((current: any) => ({ ...current, [field]: value }));
  const updateIdentity = (field: string, value: unknown) => setForm((current: any) => ({ ...current, user: { ...current.user, [field]: value } }));
  const selectedServices = useMemo(() => new Set(form.services || []), [form.services]);
  const selectedSlots = useMemo(() => new Set((form.availability || []).flatMap((entry: any) => entry.slots.map((slot: string) => `${entry.day}|${slot}`))), [form.availability]);

  const toggleService = (id: string) => update('services', selectedServices.has(id)
    ? form.services.filter((item: string) => item !== id)
    : [...form.services, id]);

  const toggleSlot = (day: string, slot: string) => {
    const next = new Map((form.availability || []).map((entry: any) => [entry.day, new Set(entry.slots)]));
    const values = (next.get(day) || new Set()) as Set<string>;
    values.has(slot) ? values.delete(slot) : values.add(slot);
    next.set(day, values);
    update('availability', [...next.entries()].map(([entryDay, entrySlots]) => ({ day: entryDay, slots: [...entrySlots] })));
  };

  const save = async () => {
    setSaving(true);
    setMessage('');
    try {
      const { data } = await api.put('/carers/me', {
        firstName: form.user.firstName,
        lastName: form.user.lastName,
        phoneNumber: form.user.phoneNumber,
        avatar: form.user.avatar,
        location: form.location,
        bio: form.bio,
        experienceYears: Number(form.experienceYears),
        hourlyRate: Number(form.hourlyRate),
        workplaceName: form.workplaceName,
        department: form.department,
        position: form.position,
        employeeIdOrLicenseNote: form.employeeIdOrLicenseNote,
        serviceIds: form.services,
        availability: form.availability,
      });
      const payload = { ...data.carer, user: data.user, services: (data.carer.services || []).map((item: any) => typeof item === 'string' ? item : item._id) };
      setForm(payload);
      setSnapshot(structuredClone(payload));
      updateUser(data.user);
      setMessage('Đã lưu hồ sơ.');
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Không thể lưu hồ sơ.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || authLoading) return <div className="carer-workspace-page"><Navbar/><main className="stitch-state"><Loader2 className="spinner"/>Đang tải hồ sơ...</main></div>;

  return <div className="carer-workspace-page carer-profile-workspace"><Navbar/><main className="container carer-workspace-main">
    <header className="carer-workspace-heading"><div><h1>Không gian Hồ sơ Chuyên gia</h1><p>Quản lý bằng cấp chuyên môn, thời gian rảnh và các gói dịch vụ của bạn.</p></div><div><button onClick={() => snapshot && setForm(structuredClone(snapshot))}>Hủy thay đổi</button><button className="primary" onClick={save} disabled={saving}>{saving?<Loader2 className="spinner"/>:<Save/>}Lưu hồ sơ</button></div></header>
    {message && <p>{message}</p>}
    <div className="carer-profile-layout"><aside>
      <section className="workspace-card profile-identity"><div className="profile-avatar-ring"><img src={form.user.avatar || fallbackAvatar} alt=""/></div><span><ShieldCheck/>{form.isVerified ? 'CHUYÊN GIA ĐÃ XÁC THỰC' : 'ĐANG CHỜ XÁC THỰC'}</span><label>Họ<input value={form.user.firstName || ''} onChange={(e)=>updateIdentity('firstName',e.target.value)}/></label><label>Tên<input value={form.user.lastName || ''} onChange={(e)=>updateIdentity('lastName',e.target.value)}/></label><label>Số điện thoại<input value={form.user.phoneNumber || ''} onChange={(e)=>updateIdentity('phoneNumber',e.target.value)}/></label><label>Địa điểm<div><MapPin/><input value={form.location || ''} onChange={(e)=>update('location',e.target.value)}/></div></label></section>
      <section className="workspace-card expertise-card"><h2>Chi tiết chuyên môn</h2><label>Nơi làm việc hiện tại<input value={form.workplaceName || ''} onChange={(e)=>update('workplaceName',e.target.value)}/></label><label>Khoa/Phòng<input value={form.department || ''} onChange={(e)=>update('department',e.target.value)}/></label><label>Vị trí<input value={form.position || ''} onChange={(e)=>update('position',e.target.value)}/></label><label>Số chứng chỉ hành nghề<input value={form.employeeIdOrLicenseNote || ''} onChange={(e)=>update('employeeIdOrLicenseNote',e.target.value)}/></label></section>
    </aside><div className="carer-profile-content">
      <section className="workspace-card experience-card"><div><label>Số năm kinh nghiệm<input type="number" min="0" value={form.experienceYears || 0} onChange={(e)=>update('experienceYears',e.target.value)}/></label><span>Năm</span></div><div><label>Giá thuê theo giờ (VNĐ)<input type="number" min="50000" value={form.hourlyRate || 0} onChange={(e)=>update('hourlyRate',e.target.value)}/></label><span>VNĐ / giờ</span></div><label className="full">Giới thiệu bản thân<textarea value={form.bio || ''} onChange={(e)=>update('bio',e.target.value)}/></label></section>
      <section className="workspace-card offered-services"><h2>Dịch vụ cung cấp</h2><div>{services.map((service)=><button key={service._id} onClick={()=>toggleService(service._id)}><i className={selectedServices.has(service._id)?'checked':''}>{selectedServices.has(service._id)&&<Check/>}</i>{service.title}</button>)}</div></section>
      <section className="workspace-card weekly-availability"><header><h2>Lịch rảnh hàng tuần</h2><p><span/>Sẵn sàng <i/>Nghỉ</p></header><div className="availability-table"><b>GIỜ</b>{days.map(day=><b key={day}>{day}</b>)}{slots.flatMap((slot,row)=>[<span key={slot}>{slot}</span>,...days.map((day,col)=><button key={`${row}-${col}`} className={selectedSlots.has(`${day}|${slot}`)?'':'off'} onClick={()=>toggleSlot(day,slot)}/>)])}</div></section>
    </div></div>
  </main><Footer/></div>;
};

export default CarerProfile;
