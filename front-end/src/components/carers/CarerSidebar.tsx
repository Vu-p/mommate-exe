import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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

type SelectOption = {
  label: string;
  value: string;
};

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

const getOptionLabel = (options: SelectOption[], value: string) =>
  options.find((option) => option.value === value)?.label || options[0]?.label || '';

const CarerFilterSelect = ({
  value,
  options,
  onChange,
}: {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    setIsOpen(false);
  };

  return (
    <div className={`carer-select ${isOpen ? 'is-open' : ''}`} ref={wrapperRef}>
      <button
        type="button"
        className="carer-select-trigger"
        onClick={() => setIsOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{getOptionLabel(options, value)}</span>
        <ChevronDown size={16} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="carer-select-menu"
            role="listbox"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={value === option.value}
                className={`carer-select-option ${value === option.value ? 'selected' : ''}`}
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const areaOptions = [
  { value: '', label: 'Tất cả khu vực' },
  { value: 'Hồ Chí Minh', label: 'Hồ Chí Minh' },
  { value: 'Hà Nội', label: 'Hà Nội' },
  { value: 'Đà Nẵng', label: 'Đà Nẵng' },
];

const priceOptions = [
  { value: '', label: 'Tất cả mức giá' },
  { value: '100000', label: 'Dưới 100.000đ/giờ' },
  { value: '150000', label: 'Dưới 150.000đ/giờ' },
  { value: '200000', label: 'Dưới 200.000đ/giờ' },
  { value: '300000', label: 'Dưới 300.000đ/giờ' },
];

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
        <CarerFilterSelect
          value={filters.area}
          options={areaOptions}
          onChange={(value) => onChange('area', value)}
        />
      </div>

      <div className="sidebar-group">
        <label>Ngân sách tối đa</label>
        <CarerFilterSelect
          value={filters.maxPrice}
          options={priceOptions}
          onChange={(value) => onChange('maxPrice', value)}
        />
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
          Xóa bộ lọc
        </button>
      </div>
    </aside>
  );
};

export default CarerSidebar;
