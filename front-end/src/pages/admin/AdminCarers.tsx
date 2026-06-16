import React, { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, Eye, CheckCircle, XCircle, Plus } from 'lucide-react';
import api from '../../utils/api';
import Modal from '../../components/common/Modal';
import ImageUpload from '../../components/common/ImageUpload';
import './AdminTable.css';
import './AdminForms.css';

interface Carer {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar: string;
  };
  bio: string;
  experienceYears: number;
  hourlyRate: number;
  location: string;
  age: number;
  isVerified: boolean;
  verificationStatus?: string;
  contractStatus?: 'pending' | 'signed' | 'voided';
  contractSignedAt?: string;
  workplaceName?: string;
  workplaceType?: string;
  department?: string;
  position?: string;
  employeeIdOrLicenseNote?: string;
  workplaceProofImages?: string[];
}

const AdminCarers = () => {
  const [carers, setCarers] = useState<Carer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('view');
  const [currentCarer, setCurrentCarer] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCarers();
  }, []);

  const fetchCarers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/carers?admin=true');
      setCarers(data);
    } catch (error) {
      console.error('Error fetching carers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setModalMode('add');
    setCurrentCarer({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      avatar: '',
      bio: '',
      experienceYears: 0,
      hourlyRate: 0,
      location: '',
      age: 0,
      isVerified: false,
      verificationStatus: 'pending',
      workplaceName: '',
      workplaceType: 'hospital',
      department: '',
      position: '',
      employeeIdOrLicenseNote: '',
      workplaceProofImages: []
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (carer: Carer) => {
    setModalMode('edit');
    setCurrentCarer({
      _id: carer._id,
      firstName: carer.user.firstName,
      lastName: carer.user.lastName,
      email: carer.user.email,
      avatar: carer.user.avatar,
      bio: carer.bio,
      experienceYears: carer.experienceYears,
      hourlyRate: carer.hourlyRate,
      location: carer.location,
      age: carer.age,
      isVerified: carer.isVerified,
      verificationStatus: carer.verificationStatus || (carer.isVerified ? 'verified' : 'pending'),
      workplaceName: carer.workplaceName || '',
      workplaceType: carer.workplaceType || 'hospital',
      department: carer.department || '',
      position: carer.position || '',
      employeeIdOrLicenseNote: carer.employeeIdOrLicenseNote || '',
      workplaceProofImages: carer.workplaceProofImages || []
    });
    setIsModalOpen(true);
  };

  const handleOpenViewModal = (carer: Carer) => {
    setModalMode('view');
    setCurrentCarer({
      ...carer,
      firstName: carer.user.firstName,
      lastName: carer.user.lastName,
      email: carer.user.email,
      avatar: carer.user.avatar
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (modalMode === 'add') {
        const { data } = await api.post('/carers', currentCarer);
        setCarers([...carers, data]);
      } else if (modalMode === 'edit') {
        const { data } = await api.put(`/carers/${currentCarer._id}`, currentCarer);
        setCarers(carers.map(c => c._id === data._id ? data : c));
      }
      setIsModalOpen(false);
    } catch (error) {
      alert('Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Soft delete this carer?')) {
      try {
        await api.delete(`/carers/${id}`);
        setCarers(carers.filter(c => c._id !== id));
      } catch (error) {
        alert('Action failed');
      }
    }
  };

  const handleToggleVerifyFromList = async (carer: Carer) => {
    try {
      const nextVerified = !carer.isVerified;
      const { data } = await api.put(`/carers/${carer._id}`, {
        isVerified: nextVerified,
        verificationStatus: nextVerified ? 'verified' : 'pending',
      });
      setCarers(carers.map(c => c._id === data._id ? data : c));
    } catch (error) {
      alert('Verification update failed');
    }
  };

  const filteredCarers = carers.filter(carer =>
    `${carer.user.firstName} ${carer.user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    carer.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-page-content">
      <div className="page-header">
        <div className="header-text">
          <h1>Medical Carers</h1>
          <p>Review and manage {carers.length} professional caregiver profiles.</p>
        </div>
        <button className="add-btn" onClick={handleOpenAddModal}>
          <Plus size={20} />
          <span>Add New Carer</span>
        </button>
      </div>

      <div className="table-controls">
        <div className="search-box">
          <Search size={20} />
          <input 
            type="text" 
            placeholder="Search by name or location..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-card">
        {loading ? (
          <div className="table-loading">Syncing carer profiles...</div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Carer Profile</th>
                  <th>Experience</th>
                  <th>Hourly Rate</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCarers.map((carer) => (
                  <tr key={carer._id}>
                    <td>
                      <div className="td-with-img">
                        <img src={carer.user.avatar || 'https://via.placeholder.com/150'} alt="" className="td-thumb" />
                        <div>
                          <div className="td-title">{carer.user.firstName} {carer.user.lastName}</div>
                          <div className="sub-info">{carer.workplaceName || carer.location}</div>
                        </div>
                      </div>
                    </td>
                    <td>{carer.experienceYears} Years</td>
                    <td><span className="price-tag">{carer.hourlyRate.toLocaleString()} VND/hr</span></td>
                    <td>
                      <span className={`badge ${carer.isVerified ? 'verified' : 'unverified'}`}>
                        {carer.verificationStatus || (carer.isVerified ? 'verified' : 'pending')}
                      </span>
                      <div className="sub-info" style={{ marginTop: 6 }}>
                        Contract: {carer.contractStatus === 'signed' ? 'signed' : 'pending'}
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="action-group">
                        <button 
                          className={`icon-btn view`} 
                          onClick={() => handleToggleVerifyFromList(carer)}
                          title={carer.isVerified ? "Unverify" : "Verify"}
                        >
                          {carer.isVerified ? <XCircle size={16} /> : <CheckCircle size={16} />}
                        </button>
                        <button className="icon-btn view" onClick={() => handleOpenViewModal(carer)}>
                          <Eye size={16} />
                        </button>
                        <button className="icon-btn edit" onClick={() => handleOpenEditModal(carer)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="icon-btn delete" onClick={() => handleDelete(carer._id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'add' ? 'Register New Carer' : modalMode === 'edit' ? 'Edit Carer Profile' : 'Carer Audit'}
      >
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-grid">
            <div className="form-group full">
              <ImageUpload 
                label="Profile Avatar"
                defaultImage={currentCarer.avatar}
                onUploadSuccess={(url) => setCurrentCarer({...currentCarer, avatar: url})}
              />
            </div>
            
            <div className="form-group">
              <label>First Name</label>
              <input 
                type="text" required disabled={modalMode === 'view'}
                value={currentCarer.firstName || ''}
                onChange={e => setCurrentCarer({...currentCarer, firstName: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input 
                type="text" required disabled={modalMode === 'view'}
                value={currentCarer.lastName || ''}
                onChange={e => setCurrentCarer({...currentCarer, lastName: e.target.value})}
              />
            </div>
            
            <div className="form-group full">
              <label>Email Address</label>
              <input 
                type="email" required disabled={modalMode !== 'add'}
                value={currentCarer.email || ''}
                onChange={e => setCurrentCarer({...currentCarer, email: e.target.value})}
              />
            </div>

            {modalMode === 'add' && (
              <div className="form-group full">
                <label>Temporary Password</label>
                <input 
                  type="text" placeholder="Default: Mommate123!"
                  value={currentCarer.password || ''}
                  onChange={e => setCurrentCarer({...currentCarer, password: e.target.value})}
                />
              </div>
            )}

            <div className="form-group full">
              <label>Professional Bio</label>
              <textarea 
                required disabled={modalMode === 'view'} rows={3}
                value={currentCarer.bio || ''}
                onChange={e => setCurrentCarer({...currentCarer, bio: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Experience (Years)</label>
              <input 
                type="number" required disabled={modalMode === 'view'}
                value={currentCarer.experienceYears || 0}
                onChange={e => setCurrentCarer({...currentCarer, experienceYears: Number(e.target.value)})}
              />
            </div>
            <div className="form-group">
              <label>Hourly Rate</label>
              <div className="price-input-wrapper">
                <input 
                  type="number" required disabled={modalMode === 'view'}
                  value={(currentCarer.hourlyRate || 0) / 1000}
                  onChange={e => setCurrentCarer({...currentCarer, hourlyRate: Number(e.target.value) * 1000})}
                />
                <span className="price-suffix">,000 <span className="vnd-symbol">VND</span></span>
              </div>
            </div>
            <div className="form-group">
              <label>Carer Location</label>
              <input 
                type="text" required disabled={modalMode === 'view'}
                placeholder="City / district where this carer can serve"
                value={currentCarer.location || ''}
                onChange={e => setCurrentCarer({...currentCarer, location: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Age</label>
              <input 
                type="number" required disabled={modalMode === 'view'}
                value={currentCarer.age || 0}
                onChange={e => setCurrentCarer({...currentCarer, age: Number(e.target.value)})}
              />
            </div>

            <div className="form-group full">
              <label>Workplace Name</label>
              <input
                type="text"
                disabled={modalMode === 'view'}
                placeholder="Bệnh viện / phòng khám đang làm việc"
                value={currentCarer.workplaceName || ''}
                onChange={e => setCurrentCarer({...currentCarer, workplaceName: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Workplace Type</label>
              <select
                disabled={modalMode === 'view'}
                value={currentCarer.workplaceType || 'hospital'}
                onChange={e => setCurrentCarer({...currentCarer, workplaceType: e.target.value})}
              >
                <option value="hospital">Hospital</option>
                <option value="clinic">Clinic</option>
                <option value="private_practice">Private Practice</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Department</label>
              <input
                type="text"
                disabled={modalMode === 'view'}
                placeholder="Sản nhi / điều dưỡng / hộ sinh"
                value={currentCarer.department || ''}
                onChange={e => setCurrentCarer({...currentCarer, department: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Position</label>
              <input
                type="text"
                disabled={modalMode === 'view'}
                placeholder="Y tá / điều dưỡng / hộ sinh"
                value={currentCarer.position || ''}
                onChange={e => setCurrentCarer({...currentCarer, position: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Employee ID / License Note</label>
              <input
                type="text"
                disabled={modalMode === 'view'}
                value={currentCarer.employeeIdOrLicenseNote || ''}
                onChange={e => setCurrentCarer({...currentCarer, employeeIdOrLicenseNote: e.target.value})}
              />
            </div>
            
            <div className="form-group full">
              <label className="checkbox-label">
                <input 
                  type="checkbox" disabled={modalMode === 'view'}
                  checked={currentCarer.isVerified || false}
                  onChange={e => setCurrentCarer({
                    ...currentCarer,
                    isVerified: e.target.checked,
                    verificationStatus: e.target.checked ? 'verified' : 'pending',
                  })}
                />
                <span>Verified workplace professional</span>
              </label>
            </div>
          </div>
          
          {modalMode !== 'view' && (
            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button type="submit" className="submit-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
};

export default AdminCarers;
