import { ChevronDown } from 'lucide-react';
import './CarerSidebar.css';

const CarerSidebar = () => {
  return (
    <div className="carer-sidebar">
      <div className="sidebar-group">
        <label>Type of Care</label>
        <div className="select-wrapper">
          <select defaultValue="Breast/ Chest Feeding Su...">
            <option>Breast/ Chest Feeding Su...</option>
            <option>Postpartum Care</option>
            <option>Pregnancy</option>
          </select>
          <ChevronDown size={16} />
        </div>
      </div>

      <div className="sidebar-group">
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

      <div className="sidebar-group">
        <label>Employment type</label>
        <div className="checkbox-group">
          <label className="checkbox-item">
            <input type="radio" name="emp-type" defaultChecked />
            <span className="checkmark"></span>
            Full time employment
          </label>
          <label className="checkbox-item">
            <input type="radio" name="emp-type" />
            <span className="checkmark"></span>
            Part time employment
          </label>
          <label className="checkbox-item">
            <input type="radio" name="emp-type" />
            <span className="checkmark"></span>
            Casual employment
          </label>
          <label className="checkbox-item">
            <input type="radio" name="emp-type" />
            <span className="checkmark"></span>
            Live-in
          </label>
        </div>
      </div>

      <div className="sidebar-group">
        <div className="availability-grid">
          <div className="grid-header">
            <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
          </div>
          {[
            '6-9 am', '9-12 am', '12-3 pm', '3-6 pm', '6-9 pm', '9-12 pm', '12-6 am'
          ].map((time, i) => (
            <div key={i} className="grid-row">
              <span className="time-label">{time}</span>
              {[...Array(7)].map((_, j) => (
                <div key={j} className={`cell ${j < 2 && i < 3 ? 'active' : ''}`}></div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <button className="btn-search-sidebar">Search</button>
    </div>
  );
};

export default CarerSidebar;
