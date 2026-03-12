import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import serviceA from '../../assets/images/service-a.png';
import serviceRecovery from '../../assets/images/service-recovery.png';
import serviceNewborn from '../../assets/images/service-newborn.png';
import './Services.css';

const services = [
  {
    id: 'Service A',
    title: 'Breast/ Chest Feeding Support',
    desc: 'Expert assistance for your feeding journey, ensuring a healthy start for you and your baby.',
    img: serviceA,
    subImg: serviceNewborn
  },
  {
    id: 'Service B',
    title: 'Postpartum recovery',
    desc: 'Expert care for your recovery journey, ensuring both physical and emotional well-being after childbirth.',
    img: serviceRecovery,
    subImg: serviceA
  },
  {
      id: 'Service C',
      title: 'Newborn care',
      desc: 'Specialized care for your little ones during the most critical first weeks of life. Professional support for your baby\'s health.',
      img: serviceNewborn,
      subImg: serviceRecovery
  }
];

const Services = () => {
  const [activeTab, setActiveTab] = useState('Service A');
  const activeService = services.find(s => s.id === activeTab);

  return (
    <section className="services" id="services">
      <div className="container">
        <div className="services-header">
          <div className="header-text-group">
            <span className="label">CHOOSE YOUR FAVOURITE SERVICE</span>
            <h2>Explore our services</h2>
          </div>
          <div className="service-tabs">
            {['Service A', 'Service B', 'Service C', 'Service D'].map((tab) => (
              <button 
                key={tab} 
                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
            <a href="#" className="see-all-link">See all</a>
          </div>
        </div>

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
                   <img src={activeService?.subImg} alt="" />
                </div>
                <div className="main-img-figma">
                   <img src={activeService?.img} alt={activeService?.title} />
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
                <p>{activeService?.desc || 'Deeply committed to your postpartum wellness and comfort.'}</p>
                <button className="explore-btn-figma">Explore more</button>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;
