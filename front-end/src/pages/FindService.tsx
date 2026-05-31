import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FilterBar from '../components/services/FilterBar';
import ServiceCard from '../components/services/ServiceCard';
import api from '../utils/api';
import './FindService.css';

const fallbackImages = ['/src/assets/images/service-1.png', '/src/assets/images/service-2.png'];

const FindService = () => {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
            const carerServiceIds = carerData.services.map((s: any) => s._id || s);
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

  const displayServices = useMemo(
    () => services.map((service, index) => ({
      ...service,
      image: service.image || fallbackImages[index % fallbackImages.length],
    })),
    [services]
  );

  return (
    <div className="find-service-page">
      <Navbar />

      <main className="container main-content">
        <nav className="breadcrumb">
          <Link to="/">Trang chủ</Link>
          <ChevronRight size={14} />
          <span>Tìm dịch vụ</span>
        </nav>

        <FilterBar />

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
        )}
      </main>

      <Footer />
    </div>
  );
};

export default FindService;
