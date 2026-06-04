import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronLeft, ChevronRight, Loader2, Search, Sparkles, Users } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CarerSidebar from '../components/carers/CarerSidebar';
import CarerListItem from '../components/carers/CarerListItem';
import api from '../utils/api';
import './FindCarer.css';

const CARERS_PER_PAGE = 5;

const normalizeText = (value: unknown) => String(value || '').toLowerCase().trim();
const getCarerName = (carer: any) =>
  `${carer.user?.firstName || carer.name?.split(' ')[0] || ''} ${carer.user?.lastName || carer.name?.split(' ').slice(1).join(' ') || ''}`.trim();

const sortOptions = [
  { label: 'Phù hợp nhất', value: 'default' },
  { label: 'Đánh giá cao nhất', value: 'rating-desc' },
  { label: 'Giá thấp nhất', value: 'price-asc' },
  { label: 'Giá cao nhất', value: 'price-desc' },
  { label: 'Kinh nghiệm nhiều nhất', value: 'experience-desc' },
  { label: 'Tên A-Z', value: 'name-asc' },
];

const SortDropdown = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selectedLabel = sortOptions.find((option) => option.value === value)?.label || sortOptions[0].label;

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
    <div className={`carer-sort-select ${isOpen ? 'is-open' : ''}`} ref={wrapperRef}>
      <button
        type="button"
        className="carer-sort-trigger"
        onClick={() => setIsOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{selectedLabel}</span>
        <ChevronDown size={16} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="carer-sort-menu"
            role="listbox"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            {sortOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={value === option.value}
                className={`carer-sort-option ${value === option.value ? 'selected' : ''}`}
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

const FindCarer = () => {
  const [carers, setCarers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    area: '',
    maxPrice: '',
    minRating: '',
    scheduleSlots: [] as string[],
  });
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const serviceId = queryParams.get('serviceId');
  const serviceTitle = queryParams.get('serviceTitle');

  useEffect(() => {
    const fetchCarers = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/carers');
        if (serviceId) {
          const filtered = data.filter((carer: any) =>
            carer.services && carer.services.some((service: any) =>
              (typeof service === 'string' ? service : service._id) === serviceId
            )
          );
          setCarers(filtered);
        } else {
          setCarers(data);
        }
      } catch (error) {
        console.error('Error fetching carers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCarers();
  }, [serviceId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, filters.area, filters.maxPrice, filters.minRating, filters.scheduleSlots]);

  const visibleCarers = useMemo(() => {
    const keyword = normalizeText(searchTerm);
    const nextCarers = carers.filter((carer) => {
      const fullName = getCarerName(carer);
      const searchableText = normalizeText([
        fullName,
        carer.bio,
        carer.location,
        carer.age,
        carer.experienceYears,
        ...(carer.certifications || []),
        ...(carer.services || []).map((service: any) => service.title || service.category || ''),
      ].join(' '));
      const matchesSearch = !keyword || searchableText.includes(keyword);
      const matchesArea = !filters.area || normalizeText(carer.location).includes(normalizeText(filters.area));
      const matchesPrice = !filters.maxPrice || Number(carer.hourlyRate || 0) <= Number(filters.maxPrice);
      const matchesRating = !filters.minRating || Number(carer.rating || 0) >= Number(filters.minRating);
      const matchesSchedule =
        filters.scheduleSlots.length === 0 ||
        carer.availability?.some((dayAvailability: { day: string; slots: string[] }) =>
          dayAvailability.slots?.some((slot) =>
            filters.scheduleSlots.includes(`${dayAvailability.day}|${slot}`)
          )
        );

      return matchesSearch && matchesArea && matchesPrice && matchesRating && matchesSchedule;
    });

    return [...nextCarers].sort((first, second) => {
      if (sortBy === 'rating-desc') {
        return Number(second.rating || 0) - Number(first.rating || 0);
      }

      if (sortBy === 'price-asc') {
        return Number(first.hourlyRate || 0) - Number(second.hourlyRate || 0);
      }

      if (sortBy === 'price-desc') {
        return Number(second.hourlyRate || 0) - Number(first.hourlyRate || 0);
      }

      if (sortBy === 'experience-desc') {
        return Number(second.experienceYears || 0) - Number(first.experienceYears || 0);
      }

      if (sortBy === 'name-asc') {
        return getCarerName(first).localeCompare(getCarerName(second), 'vi');
      }

      return 0;
    });
  }, [carers, filters, searchTerm, sortBy]);

  const totalPages = Math.max(1, Math.ceil(visibleCarers.length / CARERS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedCarers = visibleCarers.slice(
    (safeCurrentPage - 1) * CARERS_PER_PAGE,
    safeCurrentPage * CARERS_PER_PAGE
  );

  const updateFilter = (name: string, value: string) => {
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSortBy('default');
    setFilters({
      area: '',
      maxPrice: '',
      minRating: '',
      scheduleSlots: [],
    });
  };

  const toggleSchedule = (day: string, slot: string) => {
    const key = `${day}|${slot}`;
    setFilters((current) => ({
      ...current,
      scheduleSlots: current.scheduleSlots.includes(key)
        ? current.scheduleSlots.filter((item) => item !== key)
        : [...current.scheduleSlots, key],
    }));
  };

  const flowTitle = serviceId
    ? `Chuyên gia phù hợp cho ${serviceTitle || 'dịch vụ bạn đã chọn'}`
    : 'Tìm chuyên gia chăm sóc phù hợp';

  const flowDescription = serviceId
    ? 'Danh sách này đã được lọc theo dịch vụ bạn đang quan tâm. Chọn một chuyên gia để tiếp tục đặt lịch ngay.'
    : 'Khám phá toàn bộ chuyên gia chăm sóc trên hệ thống, sau đó vào hồ sơ chuyên gia để chọn dịch vụ phù hợp và đặt lịch.';

  return (
    <div className="find-carer-page">
      <Navbar />

      <main className="container find-carer-content">
        <nav className="breadcrumb">
          <Link to="/">Trang chủ</Link>
          <ChevronRight size={14} />
          <span>Tìm chuyên gia chăm sóc</span>
        </nav>

        <section className="carer-hero-card">
          <div className="carer-hero-copy">
            <span className="carer-hero-eyebrow">Tìm chuyên gia</span>
            <h1>{flowTitle}</h1>
            <p>{flowDescription}</p>
          </div>

          <div className="carer-hero-stats">
            <div className="carer-stat">
              <Users size={18} />
              <div>
                <strong>{visibleCarers.length.toLocaleString('vi-VN')}</strong>
                <span>Chuyên gia phù hợp</span>
              </div>
            </div>
            <div className="carer-stat">
              <Sparkles size={18} />
              <div>
                <strong>{serviceId ? 'Theo dịch vụ' : 'Tất cả dịch vụ'}</strong>
                <span>Chế độ khám phá</span>
              </div>
            </div>
          </div>
        </section>

        <div className="carer-browser-main">
          <aside className="carer-sidebar-area">
            <CarerSidebar
              filters={filters}
              onChange={updateFilter}
              onToggleSchedule={toggleSchedule}
              onClear={clearFilters}
            />
          </aside>

          <section className="carer-list-area">
            {loading ? (
              <div className="loading-state">
                <Loader2 className="spinner" />
                <p>Đang tìm chuyên gia phù hợp...</p>
              </div>
            ) : (
              <>
                <div className="carer-list-controls">
                  <div className="listing-search-box">
                    <Search size={20} />
                    <input
                      type="search"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Tìm theo tên, khu vực, kinh nghiệm..."
                      aria-label="Tìm chuyên gia"
                    />
                  </div>
                  <SortDropdown value={sortBy} onChange={setSortBy} />
                </div>

                <div className="carer-results-toolbar">
                  <span>{visibleCarers.length.toLocaleString('vi-VN')} chuyên gia phù hợp</span>
                  <button type="button" onClick={clearFilters} className="btn-reset-inline">
                    Đặt lại bộ lọc
                  </button>
                </div>

                <div className="carers-list">
                  {paginatedCarers.map((carer, index) => (
                    <CarerListItem
                      key={carer._id || index}
                      carer={carer}
                      serviceId={serviceId}
                      serviceTitle={serviceTitle}
                      onSelect={() => {
                        if (serviceId) {
                          navigate('/booking', {
                            state: {
                              serviceId,
                              serviceTitle,
                              carerId: carer._id,
                              carerName: getCarerName(carer),
                            },
                          });
                        } else {
                          navigate(`/carers/${carer._id}`);
                        }
                      }}
                    />
                  ))}
                  {paginatedCarers.length === 0 && (
                    <div className="empty-state">
                      <p>Không tìm thấy chuyên gia phù hợp với tiêu chí của bạn.</p>
                    </div>
                  )}
                </div>

                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      type="button"
                      className="page-btn arrow"
                      disabled={safeCurrentPage === 1}
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                      <button
                        key={page}
                        type="button"
                        className={`page-btn ${safeCurrentPage === page ? 'active' : ''}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="page-btn arrow"
                      disabled={safeCurrentPage === totalPages}
                      onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FindCarer;
