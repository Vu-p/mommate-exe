import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import './ServiceDetail.css';

interface ServiceStep {
  title: string;
  text: string;
  image?: string;
}

interface Service {
  _id: string;
  title: string;
  description: string;
  image: string;
  price: number;
  category: string;
  duration: string;
  steps: ServiceStep[];
}

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const carerId = queryParams.get('carerId');
  const carerName = queryParams.get('carerName');

  useEffect(() => {
    const fetchService = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/services/${id}`);
        setService(data);
      } catch (error) {
        console.error('Error fetching service detail:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchService();
  }, [id]);

  if (loading) {
    return (
      <div className="service-detail-loading">
        <Loader2 className="spinner" />
        <p>Loading service details...</p>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="service-not-found">
        <h2>Service not found</h2>
        <Link to="/services">Back to services</Link>
      </div>
    );
  }

  return (
    <div className="service-detail-page">
      <Navbar />

      <main className="container service-detail-content">
        <nav className="breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={14} />
          <Link to="/services">Find Service</Link>
          <ChevronRight size={14} />
          <span>{service.title}</span>
        </nav>

        <section className="service-top-section">
          <div className="gallery-container">
            <div className="thumbnails">
              <div className="thumb active"><img src={service.image} alt="Thumbnail 1" /></div>
              {service.steps?.slice(0, 2).map((step, i) => (
                <div key={i} className="thumb">
                  {step.image ? <img src={step.image} alt={step.title} /> : <div className="placeholder-thumb" />}
                </div>
              ))}
            </div>
            <div className="main-image">
              <img src={service.image} alt={service.title} />
            </div>
            <div className="service-intro-card">
              <h2>{service.title}</h2>
              <div className="user-type">{service.category}</div>
              <p>{service.description}</p>
              <div className="service-meta-info">
                <span className="info-price">{service.price.toLocaleString()} VND</span>
                <span className="info-duration">{service.duration}</span>
              </div>
              <button 
                onClick={() => {
                  if (carerId) {
                    navigate('/booking', {
                      state: {
                        serviceId: service._id,
                        serviceTitle: service.title,
                        carerId,
                        carerName
                      }
                    });
                  } else {
                    navigate(`/carers?serviceId=${service._id}&serviceTitle=${encodeURIComponent(service.title)}`);
                  }
                }} 
                className="btn-booking-primary"
              >
                {carerId ? 'Confirm Booking' : 'Booking Here'}
              </button>
            </div>
          </div>
        </section>

        <section className="service-benefits">
          <h3>Description & Benefits</h3>
          <p>{service.description}</p>
          <div className="action-buttons">
            <button
              className="btn-book-top"
              onClick={() => {
                if (carerId) {
                  navigate('/booking', {
                    state: {
                      serviceId: service._id,
                      serviceTitle: service.title,
                      carerId,
                      carerName
                    }
                  });
                } else {
                  navigate(`/carers?serviceId=${service._id}&serviceTitle=${encodeURIComponent(service.title)}`);
                }
              }}
            >
              {carerId ? 'Confirm' : 'Booking Here'}
            </button>
            <button className="btn-consultation">Request Consultation</button>
          </div>
        </section>

        {service.steps && service.steps.length > 0 && (
          <section className="treatment-details">
            <h3>Treatment Details</h3>
            <div className="steps-list">
              {service.steps.map((step, index) => (
                <div key={index} className="treatment-step-card">
                  <div className="step-header">
                    <h4>{step.title || `Step ${index + 1}`}</h4>
                  </div>
                  <div className="step-body">
                    <div className="step-img-placeholder">
                      {step.image && <img src={step.image} alt={step.title} />}
                    </div>
                    <div className="step-text">
                      <p>{step.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="bottom-cta">
          <div className="book-now-section">
            <button
              className="btn-book-now-large"
              onClick={() => {
                if (carerId) {
                  navigate('/booking', {
                    state: {
                      serviceId: service._id,
                      serviceTitle: service.title,
                      carerId,
                      carerName
                    }
                  });
                } else {
                  navigate(`/carers?serviceId=${service._id}&serviceTitle=${encodeURIComponent(service.title)}`);
                }
              }}
            >
              {carerId ? 'Book Now' : 'Book now'}
            </button>
          </div>
          <Link to="/services" className="btn-explore">Explore more</Link>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ServiceDetail;
