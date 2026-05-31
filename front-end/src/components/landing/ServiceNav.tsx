import { Link } from 'react-router-dom';
import './ServiceNav.css';

const ServiceNav = () => {
  const navItems = [
    { label: 'Về chúng tôi', path: '#about' },
    { label: 'Tìm dịch vụ', path: '/services' },
    { label: 'Tìm chuyên gia chăm sóc', path: '/carers' },
    { label: 'Cộng đồng', path: '#community' },
    { label: 'Tin tức & Sự kiện', path: '#news' }
  ];

  return (
    <div className="service-nav">
      <div className="container service-nav-content">
        {navItems.map((item, index) =>
          item.path.startsWith('#') ? (
            <a key={index} href={item.path} className="service-link">
              {item.label}
            </a>
          ) : (
            <Link key={index} to={item.path} className="service-link">
              {item.label}
            </Link>
          )
        )}
      </div>
    </div>
  );
};

export default ServiceNav;
