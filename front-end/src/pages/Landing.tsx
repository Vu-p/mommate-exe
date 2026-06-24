import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Baby,
  BriefcaseMedical,
  HeartHandshake,
  Info,
  Loader2,
  MapPin,
  Quote,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  WalletCards,
} from 'lucide-react';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BackToTop from '../components/common/BackToTop';
import './Landing.css';

type Carer = {
  _id: string;
  displayName?: string;
  rating?: number;
  reviewCount?: number;
  location?: string;
  user?: {
    avatar?: string;
  };
};

type Service = {
  _id: string;
  title: string;
  image?: string;
  category?: string;
  price?: number;
  basePrice?: number;
  rating?: number;
  reviewCount?: number;
};

type Review = {
  _id: string;
  parent?: {
    firstName?: string;
    lastName?: string;
  };
  carer?: {
    user?: {
      firstName?: string;
      lastName?: string;
    };
  };
  content?: string;
  title?: string;
  score?: number;
};

type ReviewCard = {
  id: string;
  name: string;
  role: string;
  text: string;
  rating: number;
};

const initials = (name: string) => name.split(' ').slice(-2).map((part) => part[0]).join('').toUpperCase();

const Landing = () => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [featuredCarers, setFeaturedCarers] = useState<Carer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesFailed, setServicesFailed] = useState(false);
  const [reviews, setReviews] = useState<ReviewCard[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  useEffect(() => {
    api.get('/carers', { params: { limit: 3 } })
      .then((res) => setFeaturedCarers(res.data.items || res.data || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    api.get('/services', { params: { page: 1, limit: 4, area: 'Đà Nẵng' } })
      .then(({ data }) => {
        const items = Array.isArray(data) ? data : data.items || [];
        setServices(items.slice(0, 4));
      })
      .catch((error) => {
        console.error('Error fetching services:', error);
        setServicesFailed(true);
      })
      .finally(() => setServicesLoading(false));
  }, []);

  useEffect(() => {
    api.get('/reviews', { params: { limit: 4 } })
      .then(({ data }) => {
        const items: Review[] = Array.isArray(data) ? data : data.items || [];
        setReviews(items.map((review) => {
          const parent = review.parent || {};
          const carerUser = review.carer?.user || {};
          const name = [parent.firstName, parent.lastName].filter(Boolean).join(' ') || 'Phụ huynh ẩn danh';
          const role = [carerUser.firstName, carerUser.lastName].filter(Boolean).join(' ');

          return {
            id: review._id,
            name,
            role: role ? `Được chăm sóc bởi ${role}` : 'Đánh giá từ khách hàng',
            text: review.content || review.title || 'Khách hàng chưa để lại nội dung đánh giá.',
            rating: Number(review.score || 0),
          };
        }));
      })
      .catch((error) => console.error('Failed to load reviews for landing page:', error))
      .finally(() => setReviewsLoading(false));
  }, []);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return null;
    const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    const query = keyword.trim();
    navigate(query ? `/services?search=${encodeURIComponent(query)}` : '/services');
  };

  return (
    <div className="landing-page aurora-home">
      <Navbar />
      <main>
        <section className="aurora-hero">
          <div className="aurora-field" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="container aurora-hero-grid">
            <motion.div
              className="aurora-hero-copy"
              initial={{ opacity: 0, y: 28, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="aurora-kicker">MomMate</span>
              <h1>Hãy để chúng tôi chăm sóc<br />mẹ – vì một thế hệ khởi đầu<br />khỏe mạnh</h1>
              <p>MomMate được xây dựng bởi một người từng trải qua khủng hoảng sau sinh – và chúng tôi sẽ không để bất kỳ người mẹ nào phải chịu đựng điều tương tự.</p>
              <form className="aurora-search" onSubmit={handleSearch}>
                <div className="aurora-search-field">
                  <BriefcaseMedical size={20} />
                  <label>
                    <small>DỊCH VỤ</small>
                    <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Chăm sóc sau sinh, tắm bé..." aria-label="Tìm dịch vụ" />
                  </label>
                </div>
                <div className="aurora-search-place">
                  <MapPin size={20} />
                  <span><small>KHU VỰC</small>TP. Đà Nẵng</span>
                </div>
                <motion.button className="aurora-primary-action" type="submit" whileTap={{ scale: 0.98 }}>
                  <Search size={17} />
                  Tìm kiếm
                </motion.button>
              </form>
            </motion.div>

            <motion.div
              className="aurora-hero-visual"
              initial={{ opacity: 0, y: 42, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1.1, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
              aria-hidden="true"
            >
              <div className="aurora-orbit-panel">
                <span>Premium postpartum healthcare</span>
                <strong>Đà Nẵng</strong>
              </div>
              <div className="aurora-glass-plate">
                <div>
                  <Sparkles size={18} />
                  <span>Hồ sơ xác minh</span>
                </div>
                <strong>chăm sóc dịu dàng, rõ ràng</strong>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="aurora-proof">
          <div className="container aurora-proof-grid">
            <article>
              <ShieldCheck />
              <strong>Hồ sơ chuyên môn</strong>
              <span>Chuyên gia công khai bằng cấp, kinh nghiệm và trạng thái xác minh.</span>
            </article>
            <article>
              <HeartHandshake />
              <strong>Chăm sóc phù hợp</strong>
              <span>Gia đình chọn dịch vụ và chuyên gia theo nhu cầu, khu vực và lịch khả dụng.</span>
            </article>
            <article>
              <WalletCards />
              <strong>Giá cả minh bạch</strong>
              <span>Chi phí được backend tính và xác nhận trước khi thanh toán.</span>
            </article>
          </div>
        </section>

        <section className="aurora-editorial">
          <div className="container aurora-editorial-grid">
            <div>
              <span className="aurora-kicker">TỪ NHU CẦU ĐẾN MỘT CA CHĂM SÓC AN TOÀN</span>
              <h2>Quy trình rõ ràng giúp gia đình tìm đúng người, đúng dịch vụ và theo dõi toàn bộ lịch chăm sóc.</h2>
            </div>
            <p>MomMate đặt cảm giác an toàn của mẹ sau sinh ở trung tâm: ít nhiễu, nhiều xác nhận, và từng bước đều có ngữ cảnh để gia đình không phải tự đoán.</p>
          </div>
        </section>

        <section className="aurora-journey">
          <div className="container aurora-journey-grid">
            <article>
              <b>1</b>
              <h3>Chọn nhu cầu</h3>
              <p>Tìm dịch vụ theo tình trạng của mẹ, bé, khu vực và thời gian mong muốn.</p>
            </article>
            <article>
              <b>2</b>
              <h3>Kiểm tra hồ sơ</h3>
              <p>Xem kinh nghiệm, chứng chỉ, đánh giá đã duyệt và lịch khả dụng của chuyên gia.</p>
            </article>
            <article>
              <b>3</b>
              <h3>Đặt lịch minh bạch</h3>
              <p>Nhận báo giá từ hệ thống, thanh toán và theo dõi trạng thái ngay trên tài khoản.</p>
            </article>
          </div>
        </section>

        <section className="aurora-services" id="services">
          <div className="container">
            <div className="aurora-section-head">
              <div>
                <span className="aurora-kicker">DỊCH VỤ NỔI BẬT</span>
                <h2>Lựa chọn hàng đầu của các mẹ</h2>
              </div>
              <Link to="/services">Xem tất cả dịch vụ <ArrowRight size={17} /></Link>
            </div>
            {servicesLoading ? (
              <div className="aurora-loading"><Loader2 className="spinner" /><p>Đang tải dịch vụ...</p></div>
            ) : (
              <div className="aurora-service-grid">
                {services.map((service, index) => (
                  <Link to={`/services/${service._id}`} className={`aurora-service-card aurora-service-card-${index + 1}`} key={service._id}>
                    {service.image ? <img src={service.image} alt={service.title} /> : <div className="aurora-image-placeholder">{service.title.slice(0, 1)}</div>}
                    <div>
                      <span>{service.category || 'Chăm sóc mẹ và bé'}</span>
                      <h3>{service.title}</h3>
                      <div className="aurora-rating">
                        <span>★</span>
                        {service.reviewCount && service.reviewCount > 0 ? (
                          <>
                            <strong>{Number(service.rating).toFixed(1)}</strong>
                            <small>({service.reviewCount})</small>
                          </>
                        ) : <small>Chưa có đánh giá</small>}
                      </div>
                      <p>Từ {Number(service.price || service.basePrice || 0).toLocaleString('vi-VN')}đ / buổi</p>
                    </div>
                  </Link>
                ))}
                {!services.length && <p className="aurora-empty">{servicesFailed ? 'Không thể tải dịch vụ lúc này.' : 'Chưa có dịch vụ khả dụng tại Đà Nẵng.'}</p>}
              </div>
            )}
          </div>
        </section>

        <section className="aurora-testimonials">
          <div className="container aurora-testimonial-grid">
            <div className="aurora-testimonial-lead">
              <span className="aurora-kicker">CÂU CHUYỆN THỰC</span>
              <h2>Khách hàng nói về chúng tôi</h2>
              <p>Những chia sẻ thực tế từ các gia đình đã trải nghiệm dịch vụ cùng Mommate.</p>
              {!reviewsLoading && averageRating && (
                <div className="aurora-summary-row">
                  <div><strong>{averageRating}/5</strong><span>điểm hài lòng trung bình</span></div>
                  <div><strong>{reviews.length}</strong><span>đánh giá thực tế</span></div>
                </div>
              )}
            </div>
            <div className="aurora-review-stack">
              {reviewsLoading && <p className="aurora-empty">Đang tải đánh giá...</p>}
              {!reviewsLoading && reviews.map((review, index) => (
                <motion.article
                  key={review.id || index}
                  className="aurora-review-card"
                  initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
                  whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.68, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Quote size={20} />
                  <div>
                    {[...Array(Math.round(review.rating || 0))].map((_, starIndex) => (
                      <Star key={starIndex} size={14} fill="currentColor" />
                    ))}
                  </div>
                  <p>"{review.text}"</p>
                  <footer>
                    <strong>{review.name}</strong>
                    <span>{review.role}</span>
                  </footer>
                </motion.article>
              ))}
              {!reviewsLoading && reviews.length === 0 && <p className="aurora-empty">Chưa có đánh giá nào. Hãy quay lại sau.</p>}
            </div>
          </div>
        </section>

        <section className="aurora-team">
          <div className="container">
            <div className="aurora-section-head aurora-section-head-centered">
              <div>
                <span className="aurora-kicker">Chuyên gia nổi bật</span>
                <h2>Lựa chọn những chuyên gia chăm sóc được đánh giá cao và đáng tin cậy nhất trên hệ thống MomMate.</h2>
              </div>
            </div>
            <div className="aurora-team-grid">
              {featuredCarers.slice(0, 3).map((carer) => (
                <article key={carer._id}>
                  {carer.user?.avatar ? (
                    <img src={carer.user.avatar} alt={carer.displayName || 'Chuyên gia MomMate'} />
                  ) : (
                    <div aria-hidden="true">{initials(carer.displayName || 'CG')}</div>
                  )}
                  <h3>{carer.displayName}</h3>
                  <span><Star size={14} fill="currentColor" /> {carer.rating && carer.rating > 0 ? `${carer.rating} (${carer.reviewCount} đánh giá)` : 'Chưa có đánh giá'}</span>
                  <small><MapPin size={12} /> {carer.location || 'Chưa cập nhật khu vực'}</small>
                </article>
              ))}
            </div>
            <div className="aurora-center-action">
              <Link to="/carers">Xem tất cả chuyên gia</Link>
            </div>
          </div>
        </section>

        <section className="aurora-parent-cta">
          <div className="container aurora-cta-panel">
            <div>
              <span className="aurora-kicker">Dành cho gia đình</span>
              <h2>Dành cho gia đình</h2>
              <p>Tìm chuyên gia đã xác minh và đặt lịch chăm sóc phù hợp tại Đà Nẵng.</p>
              <Link to="/carers">Tìm chuyên gia <Search size={17} /></Link>
            </div>
            <Baby aria-hidden="true" />
          </div>
        </section>

        <section className="aurora-carer-cta">
          <div className="container aurora-cta-panel aurora-cta-panel-alt">
            <div>
              <span className="aurora-kicker">Dành cho chuyên gia</span>
              <h2>Dành cho chuyên gia</h2>
              <p>Đăng ký hồ sơ chuyên môn và theo dõi quy trình xét duyệt minh bạch.</p>
              <Link to="/carer/apply">Đăng ký chuyên gia <Info size={17} /></Link>
            </div>
            <Stethoscope aria-hidden="true" />
          </div>
        </section>
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
};

export default Landing;
