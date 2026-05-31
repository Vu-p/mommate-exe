import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Sparkles, Users } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CarerSidebar from '../components/carers/CarerSidebar';
import CarerListItem from '../components/carers/CarerListItem';
import api from '../utils/api';
import './FindCarer.css';

const FindCarer = () => {
  const [carers, setCarers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
        // Filter by service if serviceId is provided
        if (serviceId) {
          const filtered = data.filter((carer: any) => 
            carer.services && carer.services.some((s: any) => 
              (typeof s === 'string' ? s : s._id) === serviceId
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

  const visibleCarers = carers.filter((carer) => {
    const matchesArea = !filters.area || carer.location === filters.area;
    const matchesPrice = !filters.maxPrice || Number(carer.hourlyRate || 0) <= Number(filters.maxPrice);
    const matchesRating = !filters.minRating || Number(carer.rating || 0) >= Number(filters.minRating);
    const matchesSchedule =
      filters.scheduleSlots.length === 0 ||
      carer.availability?.some((dayAvailability: { day: string; slots: string[] }) =>
        dayAvailability.slots?.some((slot) =>
          filters.scheduleSlots.includes(`${dayAvailability.day}|${slot}`)
        )
      );

    return matchesArea && matchesPrice && matchesRating && matchesSchedule;
  });

  const updateFilter = (name: string, value: string) => {
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const clearFilters = () => {
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
            <span className="carer-hero-eyebrow">TÌM CHUYÊN GIA</span>
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
                <div className="carer-results-toolbar">
                  <span>{visibleCarers.length.toLocaleString('vi-VN')} chuyên gia phù hợp</span>
                  <button type="button" onClick={clearFilters} className="btn-reset-inline">
                    Đặt lại bộ lọc
                  </button>
                </div>
                <div className="carers-list">
                  {visibleCarers.map((carer, index) => (
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
                              carerName: `${carer.user?.firstName || ''} ${carer.user?.lastName || ''}`.trim()
                            } 
                          });
                        } else {
                          navigate(`/carers/${carer._id}`);
                        }
                      }}
                    />
                  ))}
                  {visibleCarers.length === 0 && (
                    <div className="empty-state">
                      <p>Không tìm thấy chuyên gia phù hợp với tiêu chí của bạn.</p>
                    </div>
                  )}
                </div>

                <div className="pagination">
                  <button className="page-btn arrow"><ChevronLeft size={18} /></button>
                  <button className="page-btn active">1</button>
                  <button className="page-btn">2</button>
                  <button className="page-btn">3</button>
                  <button className="page-btn">4</button>
                  <span className="dots">...</span>
                  <button className="page-btn">7</button>
                  <button className="page-btn arrow"><ChevronRight size={18} /></button>
                </div>
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
