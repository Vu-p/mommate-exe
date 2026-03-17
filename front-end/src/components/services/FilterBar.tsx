import { ChevronDown } from 'lucide-react';
import './FilterBar.css';

const FilterBar = () => {
  return (
    <div className="filter-bar">
      <div className="filter-left">
        <div className="filter-group">
          <label>Type of Care</label>
          <div className="select-wrapper">
            <select defaultValue="Postpartum Care">
              <option>Postpartum Care</option>
              <option>Pregnancy</option>
              <option>Family</option>
            </select>
            <ChevronDown size={16} />
          </div>
        </div>

        <div className="filter-group">
          <label>Area</label>
          <div className="select-wrapper">
            <select defaultValue="Ho Chi Minh">
              <option>Ho Chi Minh</option>
              <option>Ha Noi</option>
              <option>Da Nang</option>
            </select>
            <ChevronDown size={16} />
          </div>
        </div>
      </div>

      <div className="filter-right">
        <div className="filter-group view-filter">
          <label>View</label>
          <div className="select-wrapper transparent">
            <select defaultValue="All results">
              <option>All results</option>
              <option>Newest</option>
              <option>Price: Low to High</option>
            </select>
            <ChevronDown size={16} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
