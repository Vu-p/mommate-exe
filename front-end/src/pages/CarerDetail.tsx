import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, Star, MapPin, User, Briefcase, DollarSign, CheckCircle, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import './CarerDetail.css';

interface Carer {
  _id: string;
  user: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  bio?: string;
  location?: string;
  experienceYears?: number;
  basePrice?: number;
  certifications?: string[];
  skills?: string[];
  rating?: number;
  numReviews?: number;
}

const CarerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [carer, setCarer] = useState<Carer | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const serviceId = queryParams.get('serviceId');
  const serviceTitle = queryParams.get('serviceTitle');

  useEffect(() => {
    const fetchCarer = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/carers/${id}`);
        setCarer(data);
      } catch (error) {
        console.error('Error fetching carer detail:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchCarer();
  }, [id]);

  if (loading) {
    return (
      <div className="carer-detail-loading">
        <Loader2 className="spinner" />
        <p>Loading carer profile...</p>
      </div>
    );
  }

  if (!carer) {
    return (
      <div className="carer-not-found">
        <h2>Carer profile not found</h2>
        <Link to="/find-carer">Back to search</Link>
      </div>
    );
  }

  const fullName = `${carer.user?.firstName || ''} ${carer.user?.lastName || ''}`.trim() || 'Medical Assistant';
  const avatar = carer.user?.avatar || 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=2574&auto=format&fit=crop';

  return (
    <div className="carer-detail-page">
      <Navbar />

      <main className="container carer-detail-content">
        <nav className="breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={14} />
          <Link to="/find-carer">Find Carer</Link>
        </nav>

        <section className="carer-profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              <img src={avatar} alt={fullName} />
            </div>
            <div className="profile-titles">
              <h2>{fullName}</h2>
              <div className="profile-rating">
                <Star size={16} fill="var(--warning)" color="var(--warning)" />
                <span>{carer.rating || 5.0}</span>
                <span className="reviews">{carer.numReviews || 0} reviews</span>
              </div>
            </div>
            <p className="profile-bio">{carer.bio || 'No bio provided.'}</p>
            
            <div className="profile-stats-grid">
              <div className="stat-item">
                <div className="stat-icon"><MapPin size={24} /></div>
                <div className="stat-text">
                  <span className="label">Location</span>
                  <span className="value">{carer.location || 'General Area'}</span>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon"><User size={24} /></div>
                <div className="stat-text">
                  <span className="label">Profession</span>
                  <span className="value">Medical Assistant</span>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon"><Briefcase size={24} /></div>
                <div className="stat-text">
                  <span className="label">Experience</span>
                  <span className="value">{carer.experienceYears || 0} years</span>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon"><DollarSign size={24} /></div>
                <div className="stat-text">
                  <span className="label">Hourly rate</span>
                  <span className="value">{carer.basePrice ? `${carer.basePrice.toLocaleString()} VND` : 'Contact for price'}</span>
                </div>
              </div>
            </div>
          </div>

          {carer.certifications && carer.certifications.length > 0 && (
            <div className="detail-section certifications">
              <h3>Certification</h3>
              <div className="certs-list">
                {carer.certifications.map((cert, i) => (
                  <div key={i} className="cert-item">
                    <CheckCircle size={18} color="var(--primary)" />
                    <span>{cert}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {carer.skills && carer.skills.length > 0 && (
            <div className="detail-section services-list-section">
              <h3>Skills & Expertise</h3>
              <div className="service-tags">
                {carer.skills.map((skill, i) => (
                  <span key={i} className="service-tag">{skill}</span>
                ))}
              </div>
            </div>
          )}

          <div className="detail-section availability-calendar">
            <h3>Availability Calendar</h3>
            <div className="calendar-container">
              <div className="calendar-header">
                <div className="time-col"></div>
                <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
              </div>
              {[
                '6-9 am', '9-12 am', '12-3 pm', '3-6 pm', '6-9 pm', '9-12 pm', '12-6 am'
              ].map((time, i) => (
                <div key={i} className="calendar-row">
                  <span className="time-label">{time}</span>
                  {[...Array(7)].map((_, j) => (
                    <div key={j} className="calendar-slot-wrapper">
                      <div className={`calendar-slot ${j < 4 && i < 4 ? 'filled' : ''}`}></div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="detail-section reviews-section">
            <h3>Reviews</h3>
            <div className="empty-reviews">
              <p>No reviews yet for this carer.</p>
            </div>
            <div className="comment-input">
              <input type="text" placeholder="Write your comment here" />
            </div>
          </div>
            <button 
              className="btn-book-now"
              onClick={() => {
                if (serviceId) {
                  navigate('/booking', { 
                    state: { 
                      carerId: carer._id, 
                      carerName: fullName,
                      serviceId,
                      serviceTitle
                    } 
                  });
                } else {
                  navigate(`/services?carerId=${carer._id}&carerName=${encodeURIComponent(fullName)}`);
                }
              }}
            >
              {serviceId ? 'Confirm Booking' : 'Book now'}
            </button>
          <Link to="/find-carer" className="btn-explore">Explore more</Link>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CarerDetail;
