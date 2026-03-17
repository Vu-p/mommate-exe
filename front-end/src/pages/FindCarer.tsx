import { useState, useEffect } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, X, Loader2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CarerSidebar from '../components/carers/CarerSidebar';
import CarerListItem from '../components/carers/CarerListItem';
import api from '../utils/api';
import './FindCarer.css';

const FindCarer = () => {
  const [carers, setCarers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
  }, []);

  return (
    <div className="find-carer-page">
      <Navbar />

      <main className="container find-carer-content">
        <nav className="breadcrumb">
          <a href="/">Home</a>
          <ChevronRight size={14} />
          <span>Find Carer</span>
        </nav>

        <section className="service-info-header">
          <div className="service-header-card">
            <div className="service-placeholder-img">
              <div className="image-icon-svg">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 21H3V3H21V21ZM5 19H19V5H5V19ZM16 11V16H8V11H16Z" fill="#A78BFA" fillOpacity="0.4" />
                </svg>
              </div>
            </div>
            <div className="service-header-text">
              <h2>Postpartum Medical Carers</h2>
              <p>Connect with vetted, qualified nurses and professional carers specialized in mother and baby recovery. All our carers undergo rigorous background checks.</p>
            </div>
          </div>
        </section>

        <section className="carer-browser-controls">
          <div className="search-tags">
            <div className="tag">
              Carer Ho... <X size={14} />
            </div>
          </div>
          <div className="sort-control">
            <span>View</span>
            <div className="select-wrapper transparent">
              <select defaultValue="All results">
                <option>All results</option>
                <option>Highest Rated</option>
                <option>Price: Low to High</option>
              </select>
              <ChevronDown size={16} />
            </div>
          </div>
        </section>

        <div className="carer-browser-main">
          <aside className="carer-sidebar-area">
            <CarerSidebar />
          </aside>

          <section className="carer-list-area">
            {loading ? (
              <div className="loading-state">
                <Loader2 className="spinner" />
                <p>Verifying available carers...</p>
              </div>
            ) : (
              <>
                <div className="carers-list">
                  {carers.map(carer => (
                    <CarerListItem 
                      key={carer._id} 
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
                              carerName: `${carer.user.firstName} ${carer.user.lastName}`
                            } 
                          });
                        } else {
                          navigate(`/carer/${carer._id}`);
                        }
                      }}
                    />
                  ))}
                  {carers.length === 0 && (
                    <div className="empty-state">
                      <p>No medical carers found at the moment.</p>
                    </div>
                  )}
                </div>

                <div className="pagination">
                  <button className="page-btn arrow"><ChevronLeft size={18} /></button>
                  <button className="page-btn active">1</button>
                  <button className="page-btn">2</button>
                  <button className="page-btn">3</button>
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
