import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import './Breadcrumbs.css';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const Breadcrumbs = ({ items }: BreadcrumbsProps) => {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <div className="container breadcrumb-list">
        {items.map((item, index) => (
          <Fragment key={index}>
            {index > 0 && <ChevronRight size={14} className="separator" />}
            <span className={`breadcrumb-item ${index === items.length - 1 ? 'active' : ''}`}>
              {index === items.length - 1 ? (
                item.label
              ) : (
                <Link to={item.href || '#'}>{item.label}</Link>
              )}
            </span>
          </Fragment>
        ))}
      </div>
    </nav>
  );
};

export default Breadcrumbs;
