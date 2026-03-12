import './ServiceNav.css';

const ServiceNav = () => {
  const links = ['Many-sitter', 'Home wellness', 'Bathing', 'Services B'];
  
  return (
    <div className="service-nav">
      <div className="container service-nav-content">
        {links.map((link, index) => (
          <a key={index} href={`#${link.toLowerCase().replace(' ', '-')}`} className="service-link">
            {link}
          </a>
        ))}
      </div>
    </div>
  );
};

export default ServiceNav;
