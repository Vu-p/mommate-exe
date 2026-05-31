import { ChevronDown, FilterX, Star } from 'lucide-react';
import './CarerSidebar.css';

const DAYS = [
  { key: 'Monday', label: 'M' },
  { key: 'Tuesday', label: 'T' },
  { key: 'Wednesday', label: 'W' },
  { key: 'Thursday', label: 'T' },
  { key: 'Friday', label: 'F' },
  { key: 'Saturday', label: 'S' },
  { key: 'Sunday', label: 'S' },
];

const TIME_SLOTS = [
  { value: '06:00-09:00', label: '6-9 am' },
  { value: '09:00-12:00', label: '9-12 am' },
  { value: '12:00-15:00', label: '12-3 pm' },
  { value: '15:00-18:00', label: '3-6 pm' },
  { value: '18:00-21:00', label: '6-9 pm' },
  { value: '21:00-00:00', label: '9-12 pm' },
  { value: '00:00-06:00', label: '12-6 am' },
];

interface CarerSidebarProps {
  filters: {
    area: string;
    maxPrice: string;
    minRating: string;
    scheduleSlots: string[];
    workType?: string;
  };
  onChange: (name: string, value: string) => void;
  onToggleSchedule: (day: string, slot: string) => void;
  onClear?: () => void;
}

const CarerSidebar = ({ filters, onChange, onToggleSchedule, onClear }: CarerSidebarProps) => {
  return (
    <aside className="carer-sidebar">
      <div className="sidebar-header">
        <span className="sidebar-eyebrow">Bộ lọc</span>
        <h3>Chuyên gia chăm sóc</h3>
        <p>Thu hẹp danh sách theo khu vực, ngân sách và mức đánh giá phù hợp.</p>
      </div>

      <div className="sidebar-group">
        <label>Khu vực</label>
        <div className="select-wrapper">
          <select value={filters.area} onChange={(e) => onChange('area', e.target.value)}>
            <option value="">Tất cả khu vực</option>
            <option value="Hồ Chí Minh">Hồ Chí Minh</option>
            <option value="Hà Nội">Hà Nội</option>
            <option value="Đà Nẵng">Đà Nẵng</option>
          </select>
          <ChevronDown size={16} />
        </div>
      </div>

      <div className="sidebar-group">
        <label>Ngân sách tối đa</label>
        <div className="select-wrapper">
          <select value={filters.maxPrice} onChange={(e) => onChange('maxPrice', e.target.value)}>
            <option value="">Tất cả mức giá</option>
            <option value="100000">Dưới 100.000đ/giờ</option>
            <option value="150000">Dưới 150.000đ/giờ</option>
            <option value="200000">Dưới 200.000đ/giờ</option>
            <option value="300000">Dưới 300.000đ/giờ</option>
          </select>
          <ChevronDown size={16} />
        </div>
      </div>

      <div className="sidebar-group">
        <label>Đánh giá tối thiểu</label>
        <div className="rating-filter">
          {[
            { value: '', label: 'Tất cả' },
            { value: '4.5', label: '4.5+', icon: 5 },
            { value: '4', label: '4.0+', icon: 4 },
            { value: '3', label: '3.0+', icon: 3 },
          ].map((item) => (
        <button
          key={item.label}
          type="button"
          className={`rating-chip ${filters.minRating === item.value ? 'active' : ''}`}
          onClick={() => onChange('minRating', item.value)}
            >
              {item.icon ? <Star size={14} fill="currentColor" /> : <FilterX size={14} />}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-group">
        <div className="section-label-row">
          <label>Lịch làm việc</label>
          <span className="schedule-count">{filters.scheduleSlots.length} ô đã chọn</span>
        </div>
        <div className="availability-grid">
          <div className="grid-header">
            <span />
            {DAYS.map((day) => (
              <span key={day.key}>{day.label}</span>
            ))}
          </div>

          {TIME_SLOTS.map((slot) => (
            <div key={slot.value} className="grid-row">
              <span className="time-label">{slot.label}</span>
              {DAYS.map((day) => {
                const selectedKey = `${day.key}|${slot.value}`;
                const active = filters.scheduleSlots.includes(selectedKey);

                return (
                  <button
                    key={selectedKey}
                    type="button"
                    className={`cell-button ${active ? 'active' : ''}`}
                    onClick={() => onToggleSchedule(day.key, slot.value)}
                    aria-label={`${day.key} ${slot.label}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="sidebar-actions">
        <button type="button" className="btn-clear-filters" onClick={onClear}>
          Xoá bộ lọc
        </button>
      </div>
    </aside>
  );
};

export default CarerSidebar;
