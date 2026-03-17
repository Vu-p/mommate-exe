import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Eye } from 'lucide-react';
import api from '../../utils/api';
import Modal from '../../components/common/Modal';
import ImageUpload from '../../components/common/ImageUpload';
import './AdminTable.css';
import './AdminForms.css';

interface ServiceStep {
  title: string;
  text: string;
  image?: string;
}

interface Service {
  _id: string;
  title: string;
  description: string;
  price: number;
  basePrice: number;
  category: string;
  duration: string;
  image: string;
  icon?: string;
  steps?: ServiceStep[];
  isActive?: boolean;
}

const AdminServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
  const [currentService, setCurrentService] = useState<Partial<Service>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/services?admin=true');
      setServices(data);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const service = services.find(s => s._id === id);
    const action = service?.isActive ? 'deactivate' : 'activate';
    
    if (window.confirm(`Are you sure you want to ${action} this service?`)) {
      try {
        const { data } = await api.delete(`/services/${id}`);
        // data contains { message: ..., service: updatedService }
        if (data.service) {
          setServices(services.map(s => s._id === id ? data.service : s));
        } else {
          // Fallback if data structure is different
          fetchServices();
        }
      } catch (error) {
        alert(`Failed to ${action} service`);
      }
    }
  };

  const handleOpenAddModal = () => {
    setModalMode('add');
    setCurrentService({
      title: '',
      description: '',
      price: 0,
      basePrice: 0,
      category: '',
      duration: '',
      image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2670&auto=format&fit=crop',
      icon: 'HeartPulse',
      steps: []
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (service: Service) => {
    setModalMode('edit');
    setCurrentService(service);
    setIsModalOpen(true);
  };

  const handleOpenViewModal = (service: Service) => {
    setModalMode('view');
    setCurrentService(service);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (modalMode === 'add') {
        const { data } = await api.post('/services', currentService);
        setServices([...services, data]);
      } else if (modalMode === 'edit') {
        const { data } = await api.put(`/services/${currentService._id}`, currentService);
        setServices(services.map(s => s._id === data._id ? data : s));
      }
      setIsModalOpen(false);
    } catch (error) {
      alert('Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredServices = services.filter(service =>
    service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-page-content">
      <div className="page-header">
        <div className="header-text">
          <h1>Platform Services</h1>
          <p>You have {services.length} active services in the ecosystem.</p>
        </div>
        <button className="add-btn" onClick={handleOpenAddModal}>
          <Plus size={20} />
          <span>New Service</span>
        </button>
      </div>

      <div className="table-controls">
        <div className="search-box">
          <Search size={20} />
          <input 
            type="text" 
            placeholder="Search services..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-card">
        {loading ? (
          <div className="table-loading">Loading services...</div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.map((service) => (
                  <tr key={service._id}>
                    <td>
                      <div className="td-with-img">
                        <img src={service.image} alt="" className="td-thumb" />
                        <div className="td-title">{service.title}</div>
                      </div>
                    </td>
                    <td><span className="badge">{service.category}</span></td>
                    <td><span className="price-tag">{service.price.toLocaleString()} VND</span></td>
                    <td>{service.duration}</td>
                    <td>
                      <span className={`badge ${service.isActive !== false ? 'active' : 'deactive'}`}>
                        {service.isActive !== false ? 'Active' : 'Deactive'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="action-group">
                        <button className="icon-btn view" onClick={() => handleOpenViewModal(service)}>
                          <Eye size={16} />
                        </button>
                        <button className="icon-btn edit" onClick={() => handleOpenEditModal(service)}>
                          <Edit2 size={16} />
                        </button>
                        <button className={`icon-btn ${service.isActive !== false ? 'delete' : 'restore'}`} onClick={() => handleDelete(service._id)}>
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
        title={modalMode === 'add' ? 'Add New Service' : modalMode === 'edit' ? 'Edit Service' : 'Service Details'}
      >
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-grid">
            <div className="form-group full">
              <label>Title</label>
              <input 
                type="text" 
                required 
                disabled={modalMode === 'view'}
                value={currentService.title || ''}
                onChange={e => setCurrentService({...currentService, title: e.target.value})}
              />
            </div>
            <div className="form-group full">
              <label>Description</label>
              <textarea 
                required 
                disabled={modalMode === 'view'}
                rows={4}
                value={currentService.description || ''}
                onChange={e => setCurrentService({...currentService, description: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Service Price</label>
              <div className="price-input-wrapper">
                <input 
                  type="number" 
                  required 
                  disabled={modalMode === 'view'}
                  value={(currentService.price || 0) / 1000}
                  onChange={e => setCurrentService({...currentService, price: Number(e.target.value) * 1000})}
                />
                <span className="price-suffix">,000 <span className="vnd-symbol">VND</span></span>
              </div>
            </div>
            <div className="form-group">
              <label>Base Price (Optional)</label>
              <div className="price-input-wrapper">
                <input 
                  type="number" 
                  disabled={modalMode === 'view'}
                  value={(currentService.basePrice || 0) / 1000}
                  onChange={e => setCurrentService({...currentService, basePrice: Number(e.target.value) * 1000})}
                />
                <span className="price-suffix">,000 <span className="vnd-symbol">VND</span></span>
              </div>
            </div>
            <div className="form-group">
              <label>Duration</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. 2 hours"
                disabled={modalMode === 'view'}
                value={currentService.duration || ''}
                onChange={e => setCurrentService({...currentService, duration: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select 
                required 
                disabled={modalMode === 'view'}
                value={currentService.category || ''}
                onChange={e => setCurrentService({...currentService, category: e.target.value})}
              >
                <option value="">Select Category</option>
                <option value="Newborn Care">Newborn Care</option>
                <option value="Postpartum Support">Postpartum Support</option>
                <option value="Childcare">Childcare</option>
                <option value="Elderly Care">Elderly Care</option>
              </select>
            </div>
            <div className="form-group full">
              <ImageUpload 
                label="Service Image"
                defaultImage={currentService.image}
                onUploadSuccess={(url) => setCurrentService({...currentService, image: url})}
                disabled={modalMode === 'view'}
              />
            </div>

            <div className="form-section-header">
              <h3>Treatment Steps</h3>
              {modalMode !== 'view' && (
                <button 
                  type="button" 
                  className="add-step-btn"
                  onClick={() => {
                    const steps = currentService.steps || [];
                    setCurrentService({
                      ...currentService,
                      steps: [...steps, { title: '', text: '', image: '' }]
                    });
                  }}
                >
                  <Plus size={16} /> Add Step
                </button>
              )}
            </div>

            <div className="steps-management">
              {(currentService.steps || []).map((step, index) => (
                <div key={index} className="step-edit-card">
                  <div className="step-card-header">
                    <h4>Step {index + 1}</h4>
                    {modalMode !== 'view' && (
                      <button 
                        type="button" 
                        className="remove-step-btn"
                        onClick={() => {
                          const steps = [...(currentService.steps || [])];
                          steps.splice(index, 1);
                          setCurrentService({ ...currentService, steps });
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div className="step-card-body">
                    <div className="form-group">
                      <label>Step Title</label>
                      <input 
                        type="text"
                        disabled={modalMode === 'view'}
                        value={step.title}
                        onChange={(e) => {
                          const steps = [...(currentService.steps || [])];
                          steps[index].title = e.target.value;
                          setCurrentService({ ...currentService, steps });
                        }}
                      />
                    </div>
                    <div className="form-group full">
                      <label>Step Description</label>
                      <textarea 
                        rows={2}
                        disabled={modalMode === 'view'}
                        value={step.text}
                        onChange={(e) => {
                          const steps = [...(currentService.steps || [])];
                          steps[index].text = e.target.value;
                          setCurrentService({ ...currentService, steps });
                        }}
                      />
                    </div>
                    <ImageUpload 
                      label="Step Image (Optional)"
                      defaultImage={step.image}
                      disabled={modalMode === 'view'}
                      onUploadSuccess={(url) => {
                        const steps = [...(currentService.steps || [])];
                        steps[index].image = url;
                        setCurrentService({ ...currentService, steps });
                      }}
                    />
                  </div>
                </div>
              ))}
              {(!currentService.steps || currentService.steps.length === 0) && (
                <p className="no-steps-text">No treatment steps added yet.</p>
              )}
            </div>
          </div>
          
          {modalMode !== 'view' && (
            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button type="submit" className="submit-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Service'}
              </button>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
};

export default AdminServices;
