import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Info } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Booking.css';

const Booking = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { serviceId, serviceTitle, carerId } = location.state || {};

  const [formData, setFormData] = useState({
    name: user ? `${user.firstName} ${user.lastName}` : '',
    email: user?.email || '',
    phone: '',
    date: '',
    address: '',
    interest: serviceTitle || '',
    firstPregnancy: 'Yes',
    numSessions: 1
  });
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Re-fill if user session loads after component mount
    if (user && !formData.name) {
      setFormData(prev => ({
        ...prev,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email
      }));
    }

    const fetchService = async () => {
      if (serviceId) {
        try {
          const { data } = await api.get(`/services/${serviceId}`);
          setService(data);
          if (data.sessionOptions && data.sessionOptions.length > 0) {
            setFormData(prev => ({ ...prev, numSessions: data.sessionOptions[0] }));
          }
        } catch (error) {
          console.error('Error fetching service:', error);
        }
      }
    };
    fetchService();
  }, [serviceId]);

  const pricePerSession = service?.price || 0;
  const totalPrice = pricePerSession * formData.numSessions;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/bookings', {
        carerId: carerId || '65f1a2b3c4d5e6f7a8b9c0d1', // Fallback for testing if no carer selected
        serviceId: serviceId || '65f1a2b3c4d5e6f7a8b9c0d2', // Fallback
        scheduledAt: new Date(formData.date),
        address: formData.address,
        notes: `Interest: ${formData.interest}. First Pregnancy: ${formData.firstPregnancy}. Phone: ${formData.phone}`,
        numSessions: formData.numSessions,
        totalPrice: totalPrice
      });
      navigate('/account/request');
    } catch (error) {
      console.error('Booking failed:', error);
      alert('Booking failed. Please check your data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="booking-page">
      <Navbar />

      <main className="container booking-content">
        <nav className="breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={14} />
          <Link to="/find-carer">Find Carer</Link>
        </nav>

        <section className="booking-form-header">
          <h1>Register Form</h1>
          <div className="select-wrapper type-of-care-select">
            <select defaultValue="Type of care">
              <option disabled>Type of care</option>
              <option>Newborn Care</option>
              <option>Postpartum Care</option>
              <option>Pregnancy Care</option>
            </select>
            <ChevronDown size={18} />
          </div>
        </section>

        <form className="booking-main-form" onSubmit={handleSubmit}>
          <div className="form-card info-card">
            <h2>I can't wait to meet you</h2>
            <p className="form-desc">Lorem ipsum dolor sit amet consectetur adipiscing elit tortor eu dolorol egestas morbi sem vulputate etiam facilisis pellentesque ut quis.</p>
            
            <div className="form-grid">
              <div className="input-field">
                <label>Name</label>
                <input 
                  type="text" required
                  placeholder="John Carter" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="input-field">
                <label>Email</label>
                <input 
                  type="email" required
                  placeholder="example@email.com" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="input-field">
                <label>Phone</label>
                <input 
                  type="tel" required
                  placeholder="(123) 456 - 789" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="input-field">
                <label>Date and Time</label>
                <input 
                  type="datetime-local" required
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div className="input-field full-width">
                <label>Adress</label>
                <textarea 
                  required
                  placeholder="Please type your location here..."
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                ></textarea>
              </div>
            </div>
          </div>

          <div className="form-card selection-card">
            <div className="selection-group">
              <h3>Which service are you interested in ?</h3>
              <div className="choice-container">
                <label className="choice-item">
                  <input 
                    type="radio" name="interest" 
                    checked={formData.interest === 'Birth'}
                    onChange={() => setFormData({...formData, interest: 'Birth'})}
                  />
                  <span className="choice-circle"></span>
                  Birth
                </label>
                <label className="choice-item">
                  <input 
                    type="radio" name="interest" 
                    checked={formData.interest === 'Postpartum'}
                    onChange={() => setFormData({...formData, interest: 'Postpartum'})}
                  />
                  <span className="choice-circle"></span>
                  Postpartum
                </label>
                <label className="choice-item">
                  <input 
                    type="radio" name="interest" 
                    checked={formData.interest === 'Childbirth education'}
                    onChange={() => setFormData({...formData, interest: 'Childbirth education'})}
                  />
                  <span className="choice-circle"></span>
                  Childbirth education
                </label>
              </div>
            </div>

            <div className="selection-group">
              <h3>Is this your first pregnancy ?</h3>
              <div className="choice-container">
                <label className="choice-item">
                  <input 
                    type="radio" name="pregnancy" 
                    checked={formData.firstPregnancy === 'Yes'}
                    onChange={() => setFormData({...formData, firstPregnancy: 'Yes'})}
                  />
                  <span className="choice-circle"></span>
                  Yes
                </label>
                <label className="choice-item">
                  <input 
                    type="radio" name="pregnancy" 
                    checked={formData.firstPregnancy === 'No'}
                    onChange={() => setFormData({...formData, firstPregnancy: 'No'})}
                  />
                  <span className="choice-circle"></span>
                  No
                </label>
                <label className="choice-item">
                  <input 
                    type="radio" name="pregnancy" 
                    checked={formData.firstPregnancy === 'First baby'}
                    onChange={() => setFormData({...formData, firstPregnancy: 'First baby'})}
                  />
                  <span className="choice-circle"></span>
                  First baby
                </label>
              </div>
            </div>
          </div>

          {service?.sessionOptions && service.sessionOptions.length > 0 && (
            <div className="form-card selection-card">
              <div className="selection-group">
                <h3>Select your package</h3>
                <p className="session-info">
                  <Info size={14} /> Price: {pricePerSession.toLocaleString()} VND / session
                </p>
                <div className="choice-container session-options">
                  {service.sessionOptions.map((opt: number) => (
                    <label key={opt} className="choice-item">
                      <input 
                        type="radio" name="numSessions" 
                        checked={formData.numSessions === opt}
                        onChange={() => setFormData({...formData, numSessions: opt})}
                      />
                      <span className="choice-circle"></span>
                      {opt} Sessions
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="booking-summary-card">
            <div className="summary-row">
              <span>Service:</span>
              <span>{service?.title || serviceTitle}</span>
            </div>
            <div className="summary-row">
              <span>Sessions:</span>
              <span>{formData.numSessions}</span>
            </div>
            <div className="summary-row total">
              <span>Total Price:</span>
              <span>{totalPrice.toLocaleString()} VND</span>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
};

export default Booking;
