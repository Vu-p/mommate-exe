import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Star } from 'lucide-react';
import supportImage from '../../assets/stitch/carer-profile.jpg';
import './CarerSidebar.css';

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
  areaOptions?: { value: string; label: string; count?: number }[];
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

const CarerSidebar = ({ filters, onChange, onClear, areaOptions = [] }: CarerSidebarProps) => {
  const availableAreas = [
    { value: '', label: 'Tất cả khu vực' },
    ...areaOptions.map((area) => ({
      value: area.value,
      label: area.count ? `${area.label} (${area.count})` : area.label,
    })),
  ];
  return (
    <aside className="carer-sidebar">
      <div className="sidebar-header">
        <h3>Bộ lọc</h3>
        <button type="button" onClick={onClear}>Xóa tất cả</button>
      </div>

      <div className="sidebar-group">
        <label>Khu vực (Quận/Huyện)</label>
        <CarerFilterSelect
          value={filters.area}
          options={availableAreas}
          onChange={(value) => onChange('area', value)}
        />
      </div>

      <div className="sidebar-group">
        <label>Mức giá (VNĐ/Giờ)</label>
        <input className="carer-price-range" type="range" min="100000" max="1000000" step="50000"
          value={filters.maxPrice || '500000'} onChange={(event) => onChange('maxPrice', event.target.value)} />
        <div className="price-range-labels"><span>100k</span><span>1.000k</span></div>
      </div>

      <div className="sidebar-group">
        <label>Đánh giá</label>
        <div className="sidebar-rating-list">
          <button type="button" onClick={() => onChange('minRating', '4.5')}>○ 4.5+ <Star size={13} fill="currentColor" /></button>
          <button type="button" onClick={() => onChange('minRating', '4')}>○ 4.0+ <Star size={13} fill="currentColor" /></button>
        </div>
      </div>

      <div className="carer-support-card" style={{ backgroundImage: `linear-gradient(180deg, transparent, rgba(10,35,18,.9)), url(${supportImage})` }}>
        <strong>Cần hỗ trợ gấp?</strong>
        <span>Liên hệ đội ngũ điều dưỡng trực 24/7 của chúng tôi.</span>
      </div>
    </aside>
  );
};

export default CarerSidebar;
