import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Search } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import type { ServiceFilters } from '../components/services/FilterBar';
import ServiceCard from '../components/services/ServiceCard';
import api from '../utils/api';
import './FindService.css';

const SERVICES_PER_PAGE = 12;

const FindService = () => {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ServiceFilters>({
    category: '',
    area: 'Đà Nẵng',
    sort: 'default',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [areaOptions, setAreaOptions] = useState<{ value: string; label: string; count?: number }[]>([]);
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const carerId = queryParams.get('carerId');
  const carerName = queryParams.get('carerName');
  const querySearch = queryParams.get('search') || '';

  useEffect(() => {
    setSearchTerm(querySearch);
  }, [querySearch]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/services', { params: {
          page: currentPage,
          limit: SERVICES_PER_PAGE,
          search: searchTerm || undefined,
          category: filters.category || undefined,
          area: filters.area || undefined,
          carerId: carerId || undefined,
          sort: filters.sort === 'default' ? undefined : filters.sort,
        }});
        const allServices = Array.isArray(data) ? data : data.items || [];
        const total = data.pagination?.total ?? allServices.length;
        const pages = data.pagination?.totalPages ?? 1;
        setServices(allServices);
        setTotalItems(total);
        setTotalPages(pages);
        setAreaOptions(data.facets?.areas || []);
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [carerId, currentPage, filters.area, filters.category, filters.sort, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters.category, filters.area, filters.sort]);

  const safeCurrentPage = Math.min(currentPage, totalPages);
  const updateFilter = (name: keyof ServiceFilters, value: string) => {
    setFilters((current) => ({ ...current, [name]: value }));
  };

  return (
    <div className="find-service-page">
      <Navbar />

      <div className="stitch-service-filter-shell">
        <div className="container stitch-service-filter-inner">
          <div className="listing-search-box">
              <Search size={18} />
              <input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Tìm kiếm dịch vụ..." aria-label="Tìm dịch vụ" />
          </div>
          <div className="stitch-category-chips">
            {[
              ['', 'Tất cả'],
              ['postpartum', 'Mẹ sau sinh'],
              ['consultation', 'Tư vấn'],
              ['prenatal', 'Mẹ bầu'],
              ['newborn_care', 'Bé'],
            ].map(([value, label]) => (
              <button key={label} type="button" className={filters.category === value ? 'active' : ''} onClick={() => updateFilter('category', value)}>{label}</button>
            ))}
          </div>
          <select className="stitch-area-select" value={filters.area} onChange={(event) => updateFilter('area', event.target.value)}>
            <option value="">⌖ Tất cả khu vực đang hoạt động</option>
            {!areaOptions.some((area) => area.value === 'Đà Nẵng') && <option value="Đà Nẵng">Đà Nẵng</option>}
            {areaOptions.map((area) => <option value={area.value} key={area.value}>{area.label}{area.count ? ` (${area.count})` : ''}</option>)}
          </select>
          <label className="stitch-sort-select">Sắp xếp:
            <select value={filters.sort} onChange={(event) => updateFilter('sort', event.target.value)}>
              <option value="default">Phổ biến nhất</option><option value="price-asc">Giá thấp đến cao</option><option value="price-desc">Giá cao đến thấp</option>
            </select>
          </label>
        </div>
      </div>

      <main className="container main-content">
        <header className="page-header">
          <div><h1>{carerId && carerName ? `Dịch vụ của chuyên gia ${carerName}` : 'Dịch vụ chăm sóc mẹ & bé'}</h1>
          <p>{carerId ? 'Khám phá các dịch vụ mà chuyên gia này có thể hỗ trợ và tiếp tục đặt lịch nhanh chóng.' : 'Khám phá các gói dịch vụ chuẩn y khoa từ đội ngũ chuyên gia tận tâm.'}</p></div>
          <span>Hiển thị <strong>{totalItems}</strong> kết quả</span>
        </header>

        {loading ? (
          <div className="loading-state">
            <Loader2 className="spinner" />
            <p>Đang tải dịch vụ...</p>
          </div>
        ) : (
          <>
            <div className="services-grid">
              {services.map((service) => (
                <ServiceCard
                  key={service._id}
                  service={service}
                  carerId={carerId}
                  carerName={carerName}
                  onSelect={() => {
                    if (carerId) {
                      navigate('/booking', {
                        state: {
                          carerId,
                          carerName,
                          serviceId: service._id,
                          serviceTitle: service.title,
                        },
                      });
                    } else {
                      navigate(`/services/${service._id}`);
                    }
                  }}
                />
              ))}
              {services.length === 0 && (
                <div className="empty-state">
                  <p>Không tìm thấy dịch vụ nào.</p>
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
                {Array.from({ length: Math.min(5, totalPages) }, (_, index) => index + Math.max(1, safeCurrentPage - 2)).filter((page) => page <= totalPages).map((page) => (
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
      </main>

      <Footer />
    </div>
  );
};

export default FindService;
