import { Fragment } from 'react';
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
                <a href={item.href}>{item.label}</a>
              )}
            </span>
          </Fragment>
        ))}
      </div>
    </nav>
  );
};

export default Breadcrumbs;
