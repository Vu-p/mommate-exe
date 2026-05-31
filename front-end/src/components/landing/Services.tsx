import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import './Services.css';
import { Link } from 'react-router-dom';
import { Clock3, Loader2, Sparkles } from 'lucide-react';
import serviceImg1 from '../../assets/images/service-1.png';
import serviceImg2 from '../../assets/images/service-2.png';

const Services = () => {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Hậu sản');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/services');
        setServices(data);
        
        // Extract unique categories
        const uniqueCategories = Array.from(new Set(data.map((s: any) => s.category))) as string[];
        setCategories(uniqueCategories.length > 0 ? uniqueCategories : ['Hậu sản', 'Thai kỳ', 'Gia đình']);
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
            <span className="label">ĐỒNG HÀNH CÙNG MẸ QUA CÁC GIAI ĐOẠN</span>
            <h2>Khám phá dịch vụ</h2>
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
            <Link to="/services" className="see-all-link">Xem thêm</Link>
          </div>
        </div>

        {loading ? (
          <div className="landing-loading">
            <Loader2 className="spinner" />
            <p>Đang tải dịch vụ...</p>
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
                     <img src={subService?.image || subService?.img || serviceImg1} alt="" />
                  </div>
                  <div className="main-img-figma">
                     <img src={activeService?.image || activeService?.img || serviceImg2} alt={activeService?.title} />
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
                  <h3>{activeService?.title || 'Tên dịch vụ'}</h3>
                  <div className="service-meta-row">
                    <span className="service-meta-chip">
                      <Sparkles size={14} />
                      {activeService?.category || 'Dịch vụ chăm sóc'}
                    </span>
                    <span className="service-meta-chip">
                      <Clock3 size={14} />
                      {activeService?.duration || 'Linh hoạt theo nhu cầu'}
                    </span>
                  </div>
                  <p>{activeService?.description || activeService?.desc || 'Cam kết đồng hành cùng sức khỏe và sự thoải mái sau sinh của bạn.'}</p>
                  {(activeService?.price || activeService?.basePrice) && (
                    <div className="service-price-note">
                      <span>Giá từ</span>
                      <strong>{(activeService?.price || activeService?.basePrice).toLocaleString('vi-VN')} VND</strong>
                    </div>
                  )}
                  <Link to={`/services/${activeService?._id}`} className="explore-btn-figma">Khám phá thêm</Link>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <p>Hiện chưa có dịch vụ nào. Vui lòng quay lại sau!</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Services;
