import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Star } from 'lucide-react';
import './CarerSidebar.css';

type SelectOption = {
  label: string;
  value: string;
};

interface CarerSidebarProps {
  filters: {
    area: string;
    district?: string;
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
    ...(!areaOptions.some((area) => area.value === 'Đà Nẵng') ? [{ value: 'Đà Nẵng', label: 'Đà Nẵng' }] : []),
    ...(!areaOptions.some((area) => area.value === 'Hà Nội') ? [{ value: 'Hà Nội', label: 'Hà Nội' }] : []),
    ...(!areaOptions.some((area) => area.value === 'TP. Hồ Chí Minh') ? [{ value: 'TP. Hồ Chí Minh', label: 'TP. Hồ Chí Minh' }] : []),
    ...areaOptions.map((area) => ({
      value: area.value,
      label: area.count ? `${area.label} (${area.count})` : area.label,
    })).filter((item) => !['Đà Nẵng', 'Hà Nội', 'TP. Hồ Chí Minh'].includes(item.value)),
  ];

  const daNangDistricts = [
    { value: '', label: 'Tất cả quận/huyện' },
    { value: 'Hải Châu', label: 'Hải Châu' },
    { value: 'Thanh Khê', label: 'Thanh Khê' },
    { value: 'Sơn Trà', label: 'Sơn Trà' },
    { value: 'Ngũ Hành Sơn', label: 'Ngũ Hành Sơn' },
    { value: 'Liên Chiểu', label: 'Liên Chiểu' },
    { value: 'Cẩm Lệ', label: 'Cẩm Lệ' },
    { value: 'Hòa Vang', label: 'Hòa Vang' },
  ];

  const hnDistricts = [
    { value: '', label: 'Tất cả quận/huyện' },
    { value: 'Ba Đình', label: 'Ba Đình' },
    { value: 'Hoàn Kiếm', label: 'Hoàn Kiếm' },
    { value: 'Đống Đa', label: 'Đống Đa' },
    { value: 'Thanh Xuân', label: 'Thanh Xuân' },
    { value: 'Cầu Giấy', label: 'Cầu Giấy' },
    { value: 'Hoàng Mai', label: 'Hoàng Mai' },
    { value: 'Hai Bà Trưng', label: 'Hai Bà Trưng' },
    { value: 'Hà Đông', label: 'Hà Đông' },
    { value: 'Long Biên', label: 'Long Biên' },
    { value: 'Nam Từ Liêm', label: 'Nam Từ Liêm' },
    { value: 'Bắc Từ Liêm', label: 'Bắc Từ Liêm' },
    { value: 'Tây Hồ', label: 'Tây Hồ' }
  ];

  const hcmDistricts = [
    { value: '', label: 'Tất cả quận/huyện' },
    { value: 'Quận 1', label: 'Quận 1' },
    { value: 'Quận 3', label: 'Quận 3' },
    { value: 'Quận 4', label: 'Quận 4' },
    { value: 'Quận 5', label: 'Quận 5' },
    { value: 'Quận 6', label: 'Quận 6' },
    { value: 'Quận 7', label: 'Quận 7' },
    { value: 'Quận 8', label: 'Quận 8' },
    { value: 'Quận 10', label: 'Quận 10' },
    { value: 'Quận 11', label: 'Quận 11' },
    { value: 'Quận 12', label: 'Quận 12' },
    { value: 'Tân Bình', label: 'Tân Bình' },
    { value: 'Bình Tân', label: 'Bình Tân' },
    { value: 'Bình Thạnh', label: 'Bình Thạnh' },
    { value: 'Tân Phú', label: 'Tân Phú' },
    { value: 'Gò Vấp', label: 'Gò Vấp' },
    { value: 'Phú Nhuận', label: 'Phú Nhuận' },
    { value: 'Thủ Đức', label: 'TP. Thủ Đức' }
  ];

  let currentDistricts: { value: string; label: string }[] = [];
  if (filters.area === 'Đà Nẵng') currentDistricts = daNangDistricts;
  else if (filters.area === 'Hà Nội') currentDistricts = hnDistricts;
  else if (filters.area === 'TP. Hồ Chí Minh' || filters.area === 'Hồ Chí Minh') currentDistricts = hcmDistricts;

  return (
    <aside className="carer-sidebar">
      <div className="sidebar-header">
        <h3>Bộ lọc</h3>
        <button type="button" onClick={onClear}>Xóa tất cả</button>
      </div>

      <div className="sidebar-group">
        <label>Tỉnh/Thành phố</label>
        <CarerFilterSelect
          value={filters.area}
          options={availableAreas}
          onChange={(value) => {
            onChange('area', value);
            if (filters.district) onChange('district', '');
          }}
        />
      </div>

      {currentDistricts.length > 0 && (
        <div className="sidebar-group">
          <label>Quận/Huyện</label>
          <CarerFilterSelect
            value={filters.district || ''}
            options={currentDistricts}
            onChange={(value) => onChange('district', value)}
          />
        </div>
      )}

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

    </aside>
  );
};

export default CarerSidebar;
