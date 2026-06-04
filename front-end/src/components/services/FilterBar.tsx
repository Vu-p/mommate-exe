import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import './FilterBar.css';

type FilterOption = {
  label: string;
  value: string;
};

type FilterSelectProps = {
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
};

export type ServiceFilters = {
  category: string;
  area: string;
  sort: string;
};

type FilterBarProps = {
  filters: ServiceFilters;
  onChange: (name: keyof ServiceFilters, value: string) => void;
};

const getOptionLabel = (options: FilterOption[], value: string) =>
  options.find((option) => option.value === value)?.label || options[0]?.label || '';

const FilterSelect = ({ label, options, value, onChange }: FilterSelectProps) => {
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
    <div className="filter-group">
      <label>{label}</label>
      <div className={`filter-select ${isOpen ? 'is-open' : ''}`} ref={wrapperRef}>
        <button
          type="button"
          className="filter-select-trigger"
          onClick={() => setIsOpen((current) => !current)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span>{getOptionLabel(options, value)}</span>
          <ChevronDown size={18} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="filter-select-menu"
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
                  className={`filter-select-option ${value === option.value ? 'selected' : ''}`}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const categoryOptions = [
  { label: 'Tất cả dịch vụ', value: '' },
  { label: 'Medical', value: 'Medical' },
  { label: 'Postpartum Care', value: 'Postpartum Care' },
  { label: 'Consultation', value: 'Consultation' },
];

const areaOptions = [
  { label: 'Tất cả khu vực', value: '' },
  { label: 'Hồ Chí Minh', value: 'Hồ Chí Minh' },
  { label: 'Hà Nội', value: 'Hà Nội' },
  { label: 'Đà Nẵng', value: 'Đà Nẵng' },
];

const sortOptions = [
  { label: 'Mặc định', value: 'default' },
  { label: 'Mới nhất', value: 'newest' },
  { label: 'Giá: Thấp đến cao', value: 'price-asc' },
  { label: 'Giá: Cao đến thấp', value: 'price-desc' },
  { label: 'Tên A-Z', value: 'name-asc' },
];

const FilterBar = ({ filters, onChange }: FilterBarProps) => {
  return (
    <div className="filter-bar">
      <FilterSelect
        label="Loại hình chăm sóc"
        value={filters.category}
        options={categoryOptions}
        onChange={(value) => onChange('category', value)}
      />

      <FilterSelect
        label="Khu vực"
        value={filters.area}
        options={areaOptions}
        onChange={(value) => onChange('area', value)}
      />

      <div className="sort-filter">
        <FilterSelect
          label="Sắp xếp"
          value={filters.sort}
          options={sortOptions}
          onChange={(value) => onChange('sort', value)}
        />
      </div>
    </div>
  );
};

export default FilterBar;
