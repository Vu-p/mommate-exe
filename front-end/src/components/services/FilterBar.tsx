import { ChevronDown } from 'lucide-react';
import './FilterBar.css';

const FilterBar = () => {
  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label>Loại hình chăm sóc</label>
        <div className="select-wrapper">
          <select defaultValue="Dịch vụ cho mẹ sau sinh">
            <option>Dịch vụ cho mẹ sau sinh</option>
            <option>Dịch vụ cho mẹ bầu</option>
            <option>Chăm sóc bé</option>
            <option>Spa & Chăm sóc da</option>
          </select>
          <ChevronDown size={18} />
        </div>
      </div>

      <div className="filter-group">
        <label>Khu vực</label>
        <div className="select-wrapper">
          <select defaultValue="Hồ Chí Minh">
            <option>Hồ Chí Minh</option>
            <option>Hà Nội</option>
            <option>Đà Nẵng</option>
          </select>
          <ChevronDown size={18} />
        </div>
      </div>

      <div className="filter-group sort-filter">
        <label>Sắp xếp</label>
        <div className="select-wrapper">
          <select defaultValue="Tất cả">
            <option>Tất cả</option>
            <option>Mới nhất</option>
            <option>Giá: Thấp đến cao</option>
            <option>Giá: Cao đến thấp</option>
          </select>
          <ChevronDown size={18} />
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
