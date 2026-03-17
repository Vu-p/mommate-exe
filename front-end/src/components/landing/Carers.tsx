import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import api from '../../utils/api';
import './Carers.css';

const Carers = () => {
  const [carers, setCarers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCarers = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/carers');
        setCarers(data.slice(0, 4)); // Show top 4
      } catch (error) {
        console.error('Error fetching carers for landing:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCarers();
  }, []);

  return (
    <section className="carers">
      <div className="container">
        <h2 className="section-title">Meet our carers</h2>
        
        {loading ? (
          <div className="landing-loading">
            <Loader2 className="spinner" />
            <p>Loading our medical professionals...</p>
          </div>
        ) : carers.length > 0 ? (
          <div className="carer-track">
            {carers.map((carer) => {
              const firstName = carer.user?.firstName || 'Nurse';
              const lastName = carer.user?.lastName || '';
              const fullName = `${firstName} ${lastName}`;
              const avatar = carer.user?.avatar || carer.avatar || '';

              return (
                <Link to={`/carers/${carer._id}`} key={carer._id} className="carer-link-wrapper">
                  <motion.div 
                    className="carer-card"
                    whileHover={{ y: -15, scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <img src={avatar} alt={fullName} className="carer-img" />
                    <div className="carer-info">
                      <h4>{fullName}</h4>
                      <p>{carer.location || 'Specialist Care'}</p>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <p>Our carers are currently busy. Please check back later!</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Carers;
