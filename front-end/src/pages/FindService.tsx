import { useState, useEffect } from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FilterBar from '../components/services/FilterBar';
import ServiceCard from '../components/services/ServiceCard';
import api from '../utils/api';
import './FindService.css';

// Mock data removed - fetching from API

const FindService = () => {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const carerId = queryParams.get('carerId');
  const carerName = queryParams.get('carerName');

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const { data: allServices } = await api.get('/services');
        
        if (carerId) {
          // If we have a carer context, we should ideally show services that this carer provides
          try {
            const { data: carerData } = await api.get(`/carers/${carerId}`);
            const carerServiceIds = carerData.services.map((s: any) => s._id || s);
            const filtered = allServices.filter((s: any) => carerServiceIds.includes(s._id));
            setServices(filtered);
          } catch (err) {
            console.error('Error fetching carer for filtering:', err);
            setServices(allServices); // Fallback
          }
        } else {
          setServices(allServices);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  return (
    <div className="find-service-page">
      <Navbar />
      
      <main className="container main-content">
        <nav className="breadcrumb">
          <a href="/">Home</a>
          <ChevronRight size={14} />
          <span>Find Service</span>
        </nav>

        <FilterBar />

        <header className="page-header">
          <h1>Postpartumcare</h1>
          <p>Explore our premium selection of postpartum and family care services delivered by medical professionals.</p>
        </header>

        {loading ? (
          <div className="loading-state">
            <Loader2 className="spinner" />
            <p>Gathering services...</p>
          </div>
        ) : (
          <div className="services-grid">
            {services.map(service => (
              <ServiceCard 
                key={service._id} 
                service={service} 
                carerId={carerId}
                carerName={carerName}
                onSelect={() => {
                  if (carerId) {
                    navigate('/booking', {
                      state: {
                        carerId,
                        carerName,
                        serviceId: service._id,
                        serviceTitle: service.title
                      }
                    });
                  } else {
                    navigate(`/services/${service._id}`);
                  }
                }}
              />
            ))}
            {services.length === 0 && (
              <div className="empty-state">
                <p>No services found. Add some in the Admin Panel!</p>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default FindService;
