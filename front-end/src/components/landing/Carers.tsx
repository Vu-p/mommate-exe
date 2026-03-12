import { motion } from 'framer-motion';
import carerImg from '../../assets/images/carer-1.png';
import './Carers.css';

const carersList = [1, 2, 3, 4]; 

const Carers = () => {
  return (
    <section className="carers">
      <div className="container">
        <h2 className="section-title">Meet our carers</h2>
        
        <div className="carer-track">
          {carersList.map((_, i) => (
            <motion.div 
              key={i} 
              className="carer-card"
              whileHover={{ y: -15, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <img src={carerImg} alt={`Featured Carer ${i + 1}`} className="carer-img" />
              <div className="carer-info">
                <h4>Nurse {i + 1}</h4>
                <p>Specialist Care</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Carers;
