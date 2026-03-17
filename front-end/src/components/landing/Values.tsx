import { Shield, Users, ThumbsUp } from 'lucide-react';
import './Values.css';

const valuesData = [
  {
    icon: <Shield size={24} className="v-icon" />,
    title: 'Verification process',
    desc: 'Each profile has its own level of verification.'
  },
  {
    icon: <Users size={24} className="v-icon" />,
    title: 'Meet up with carers',
    desc: 'Feel safe because we are in search of the best profiles.'
  },
  {
    icon: <ThumbsUp size={24} className="v-icon" />,
    title: 'Reviews from families',
    desc: 'Read reviews from other families.'
  }
];

const Values = () => {
  return (
    <section className="values-figma">
      <div className="container values-container-figma">
        <div className="values-intro-figma">
           <span className="label">WHY TRUST US</span>
           <h2>Top Values For You</h2>
           <p>We are committed to providing the best profiles and certified support for every family.</p>
        </div>
        
        <div className="values-grid-figma">
          {valuesData.map((v, i) => (
            <div key={i} className="value-item-figma">
              <div className="icon-box-figma">{v.icon}</div>
              <div className="value-text-figma">
                <h4>{v.title}</h4>
                <p>{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Values;
