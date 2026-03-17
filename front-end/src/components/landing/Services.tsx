import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import './Services.css';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const Services = () => {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Postpartum care');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/services');
        setServices(data);
        
        // Extract unique categories
        const uniqueCategories = Array.from(new Set(data.map((s: any) => s.category))) as string[];
        setCategories(uniqueCategories.length > 0 ? uniqueCategories : ['Postpartum care', 'Pregnancy', 'Family']);
        if (uniqueCategories.length > 0) setActiveTab(uniqueCategories[0]);
      } catch (error) {
        console.error('Error fetching services for landing:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  // Find a service for the active category
  const activeService = services.find(s => s.category === activeTab) || services[0];
  // Find a secondary image for the stack if available
  const subService = services.find(s => s.category === activeTab && s._id !== activeService?._id) || services[1] || activeService;

  return (
    <section className="services" id="services">
      <div className="container">
        <div className="services-header">
          <div className="header-text-group">
            <span className="label">CHOOSE YOUR FAVOURITE SERVICE</span>
            <h2>Explore our services</h2>
          </div>
          <div className="service-tabs">
            {categories.map((tab) => (
              <button 
                key={tab} 
                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
            <Link to="/services" className="see-all-link">See all</Link>
          </div>
        </div>

        {loading ? (
          <div className="landing-loading">
            <Loader2 className="spinner" />
            <p>Loading premium services...</p>
          </div>
        ) : services.length > 0 ? (
          <div className="service-content-figma">
            <div className="service-images-figma">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={activeTab}
                  className="image-stack-figma"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="sub-img-figma">
                     <img src={subService?.image || subService?.img} alt="" />
                  </div>
                  <div className="main-img-figma">
                     <img src={activeService?.image || activeService?.img} alt={activeService?.title} />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
            
            <div className="service-info-figma">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <h3>{activeService?.title || 'Service Title'}</h3>
                  <p>{activeService?.description || activeService?.desc || 'Deeply committed to your postpartum wellness and comfort.'}</p>
                  <Link to={`/services/${activeService?._id}`} className="explore-btn-figma">Explore more</Link>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <p>No services available at the moment. Check back soon!</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Services;
