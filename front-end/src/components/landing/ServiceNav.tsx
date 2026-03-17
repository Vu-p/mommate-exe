import { Link } from 'react-router-dom';
import './ServiceNav.css';

const ServiceNav = () => {
  const navItems = [
    { label: 'About us', path: '#about' },
    { label: 'Find Service', path: '/services' },
    { label: 'Find Carer', path: '/carers' },
    { label: 'Community', path: '#community' },
    { label: 'Media & News', path: '#news' }
  ];

  return (
    <div className="service-nav">
      <div className="container service-nav-content">
        {navItems.map((item, index) => (
          item.path.startsWith('#') ? (
            <a key={index} href={item.path} className="service-link">
              {item.label}
            </a>
          ) : (
            <Link key={index} to={item.path} className="service-link">
              {item.label}
            </Link>
          )
        ))}
      </div>
    </div>
  );
};

export default ServiceNav;
