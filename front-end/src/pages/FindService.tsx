import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Search } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FilterBar, { type ServiceFilters } from '../components/services/FilterBar';
import ServiceCard from '../components/services/ServiceCard';
import api from '../utils/api';
import './FindService.css';

const fallbackImages = ['/src/assets/images/service-1.png', '/src/assets/images/service-2.png'];
const SERVICES_PER_PAGE = 6;

const normalizeText = (value: unknown) => String(value || '').toLowerCase().trim();
const getServicePrice = (service: any) => Number(service.price || service.basePrice || 0);

const FindService = () => {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ServiceFilters>({
    category: '',
    area: '',
    sort: 'default',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const carerId = queryParams.get('carerId');
  const carerName = queryParams.get('carerName');

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const { data: allServices } = await api.get('/services');

        if (carerId) {
          try {
            const { data: carerData } = await api.get(`/carers/${carerId}`);
            const carerServiceIds = carerData.services.map((service: any) => service._id || service);
            setServices(allServices.filter((service: any) => carerServiceIds.includes(service._id)));
          } catch (err) {
            console.error('Error fetching carer for filtering:', err);
            setServices(allServices);
          }
        } else {
          setServices(allServices);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [carerId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters.category, filters.area, filters.sort]);

  const filteredServices = useMemo(() => {
    const keyword = normalizeText(searchTerm);

    const nextServices = services.filter((service) => {
      const searchableText = normalizeText([
        service.title,
        service.description,
        service.category,
        ...(service.tags || []),
      ].join(' '));
      const serviceArea = normalizeText(service.area || service.location || service.city);
      const matchesSearch = !keyword || searchableText.includes(keyword);
      const matchesCategory = !filters.category || service.category === filters.category;
      const matchesArea = !filters.area || !serviceArea || serviceArea.includes(normalizeText(filters.area));

      return matchesSearch && matchesCategory && matchesArea;
    });

    return [...nextServices].sort((first, second) => {
      if (filters.sort === 'newest') {
        return new Date(second.createdAt || 0).getTime() - new Date(first.createdAt || 0).getTime();
      }

      if (filters.sort === 'price-asc') {
        return getServicePrice(first) - getServicePrice(second);
      }

      if (filters.sort === 'price-desc') {
        return getServicePrice(second) - getServicePrice(first);
      }

      if (filters.sort === 'name-asc') {
        return String(first.title || '').localeCompare(String(second.title || ''), 'vi');
      }

      return 0;
    });
  }, [filters, searchTerm, services]);

  const totalPages = Math.max(1, Math.ceil(filteredServices.length / SERVICES_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const displayServices = useMemo(
    () => filteredServices
      .slice((safeCurrentPage - 1) * SERVICES_PER_PAGE, safeCurrentPage * SERVICES_PER_PAGE)
      .map((service, index) => ({
        ...service,
        image: service.image || fallbackImages[index % fallbackImages.length],
      })),
    [filteredServices, safeCurrentPage]
  );

  const updateFilter = (name: keyof ServiceFilters, value: string) => {
    setFilters((current) => ({ ...current, [name]: value }));
  };

  return (
    <div className="find-service-page">
      <Navbar />

      <main className="container main-content">
        <nav className="breadcrumb">
          <Link to="/">Trang chủ</Link>
          <ChevronRight size={14} />
          <span>Tìm dịch vụ</span>
        </nav>

        <FilterBar filters={filters} onChange={updateFilter} />

        <div className="listing-search-row">
          <div className="listing-search-box">
            <Search size={20} />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tìm theo tên dịch vụ, mô tả hoặc tag..."
              aria-label="Tìm dịch vụ"
            />
          </div>
        </div>

        <header className="page-header">
          <span className="page-eyebrow">Tìm dịch vụ</span>
          <h1>
            {carerId && carerName
              ? `Dịch vụ của chuyên gia ${carerName}`
              : 'Dịch vụ cho mẹ sau sinh'}
          </h1>
          <p>
            {carerId
              ? 'Khám phá các dịch vụ mà chuyên gia này có thể hỗ trợ và tiếp tục đặt lịch nhanh chóng.'
              : 'Khám phá các dịch vụ chăm sóc mẹ và bé được thiết kế theo từng giai đoạn phục hồi, từ hậu sản đến chăm sóc tại nhà.'}
          </p>
        </header>

        {loading ? (
          <div className="loading-state">
            <Loader2 className="spinner" />
            <p>Đang tải dịch vụ...</p>
          </div>
        ) : (
          <>
            <div className="listing-results-summary">
              {filteredServices.length.toLocaleString('vi-VN')} dịch vụ phù hợp
            </div>

            <div className="services-grid">
              {displayServices.map((service) => (
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
              {displayServices.length === 0 && (
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
      </main>

      <Footer />
    </div>
  );
};

export default FindService;
