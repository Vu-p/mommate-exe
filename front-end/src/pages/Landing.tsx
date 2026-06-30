import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  Baby,
  BriefcaseMedical,
  ChevronDown,
  HeartHandshake,
  Loader2,
  MapPin,
  Quote,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  WalletCards,
} from 'lucide-react';
import api from '../utils/api';
import { formatExperienceShort, formatLocation, getCarerAvatar, getCarerFullName, getDisplayRating } from '../utils/carerDisplay';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BackToTop from '../components/common/BackToTop';
import { trackEvent } from '../utils/analytics';
import './Landing.css';

type Carer = {
  _id: string;
  id?: string;
  displayName?: string;
  name?: string;
  rating?: number;
  reviewCount?: number;
  location?: string;
  avatar?: string;
  img?: string;
  bio?: string;
  position?: string;
  workplaceName?: string;
  experienceYears?: number;
  hourlyRate?: number;
  verificationStatus?: string;
  isVerified?: boolean;
  skills?: string[];
  services?: {
    category?: string;
    title?: string;
  }[];
  user?: {
    firstName?: string;
    lastName?: string;
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

const toArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? value : []);
const calmEase = [0.16, 1, 0.3, 1] as const;

const reveal = {
  initial: { opacity: 1, y: 0, filter: 'blur(0px)' },
  whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' },
  viewport: { once: true, amount: 0.22 },
  transition: { duration: 0.78, ease: calmEase },
};

const fallbackReviews: ReviewCard[] = [
  {
    id: 'fallback-1',
    name: 'Minh Anh',
    role: 'Mẹ lần đầu tại Đà Nẵng',
    text: 'Tôi không còn phải tự đoán điều gì là đúng trong những tuần đầu sau sinh. Mọi bước đều rõ ràng và rất nhẹ nhàng.',
    rating: 5,
  },
  {
    id: 'fallback-2',
    name: 'Hoàng Vy',
    role: 'Đặt chăm sóc sau sinh tại nhà',
    text: 'Cảm giác tin tưởng đến từ hồ sơ chuyên gia, lịch hẹn minh bạch và cách MomMate giữ mọi thứ bình tĩnh.',
    rating: 5,
  },
];

const fallbackFeaturedCarers: Carer[] = [
  {
    _id: 'featured-carer-1',
    displayName: 'Mai Anh',
    avatar: '/src/assets/stitch/carer-profile.jpg',
    rating: 4.9,
    reviewCount: 18,
    location: 'Hải Châu, Đà Nẵng',
    experienceYears: 6,
    verificationStatus: 'verified',
    skills: ['Chăm sóc mẹ sau sinh'],
    bio: 'Theo dõi nhịp hồi phục của mẹ, hỗ trợ sinh hoạt nhẹ nhàng và giữ gia đình luôn nắm rõ từng buổi chăm sóc.',
  },
  {
    _id: 'featured-carer-2',
    displayName: 'Thu Hà',
    avatar: '/src/assets/stitch/service-postpartum.jpg',
    rating: 4.8,
    reviewCount: 14,
    location: 'Sơn Trà, Đà Nẵng',
    experienceYears: 5,
    verificationStatus: 'verified',
    skills: ['Tắm bé và chăm sóc sơ sinh'],
    bio: 'Ưu tiên sự bình tĩnh trong từng thao tác, giúp mẹ an tâm hơn khi chăm sóc bé trong những tuần đầu.',
  },
  {
    _id: 'featured-carer-3',
    displayName: 'Ngọc Linh',
    avatar: '/src/assets/stitch/booking-parent.jpg',
    rating: 5,
    reviewCount: 11,
    location: 'Ngũ Hành Sơn, Đà Nẵng',
    experienceYears: 7,
    verificationStatus: 'verified',
    skills: ['Đồng hành sau sinh tại nhà'],
    bio: 'Giữ lịch chăm sóc rõ ràng, lắng nghe nhu cầu của mẹ và phối hợp với gia đình bằng cách nhẹ nhàng.',
  },
  {
    _id: 'featured-carer-4',
    displayName: 'Bảo Trân',
    avatar: '/src/assets/stitch/hero-maternal-care.jpg',
    rating: 4.9,
    reviewCount: 16,
    location: 'Thanh Khê, Đà Nẵng',
    experienceYears: 4,
    verificationStatus: 'verified',
    skills: ['Hỗ trợ mẹ và bé tại nhà'],
    bio: 'Tập trung vào sự thoải mái của mẹ, nếp sinh hoạt của bé và những chi tiết nhỏ giúp một ngày bớt căng thẳng.',
  },
  {
    _id: 'featured-carer-5',
    displayName: 'Hồng Vân',
    avatar: '/src/assets/stitch/hero-maternal-care-aurora.png',
    rating: 4.8,
    reviewCount: 12,
    location: 'Cẩm Lệ, Đà Nẵng',
    experienceYears: 8,
    verificationStatus: 'verified',
    skills: ['Điều phối chăm sóc sau sinh'],
    bio: 'Giúp gia đình hiểu việc cần chuẩn bị, theo dõi lịch hẹn và giữ nhịp chăm sóc ổn định hơn.',
  },
];

const featuredCarerNote = (carer: Carer, specialty: string) => {
  if (carer.bio && carer.bio.trim()) {
    return carer.bio.trim().length > 116 ? `${carer.bio.trim().slice(0, 112)}...` : carer.bio.trim();
  }

  return `Đồng hành cùng gia đình trong các buổi ${specialty.toLowerCase()}, với nhịp chăm sóc rõ ràng và nhẹ nhàng.`;
};

const faqItems = [
  {
    question: 'MomMate có phù hợp với mẹ lần đầu không?',
    answer: 'Có. MomMate được thiết kế cho những gia đình cần một quy trình rõ ràng sau sinh, từ tìm dịch vụ, xem hồ sơ chuyên gia đến đặt lịch và theo dõi trạng thái.',
  },
  {
    question: 'Làm sao để biết chuyên gia đáng tin cậy?',
    answer: 'Gia đình có thể xem hồ sơ, kinh nghiệm, khu vực phục vụ, đánh giá và trạng thái xác minh trước khi đặt lịch.',
  },
  {
    question: 'Tôi có thể tìm dịch vụ theo nhu cầu cụ thể không?',
    answer: 'Có. Thanh tìm kiếm dẫn đến danh sách dịch vụ, nơi bạn có thể tiếp tục lọc theo nhu cầu chăm sóc, khu vực và lịch phù hợp.',
  },
  {
    question: 'Chi phí được hiển thị khi nào?',
    answer: 'Giá dịch vụ được hiển thị trước khi đặt lịch và được hệ thống xác nhận trong quy trình thanh toán.',
  },
];

const Landing = () => {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const [keyword, setKeyword] = useState('');
  const [featuredCarers, setFeaturedCarers] = useState<Carer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesFailed, setServicesFailed] = useState(false);
  const [reviews, setReviews] = useState<ReviewCard[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState(0);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const portraitY = useTransform(scrollYProgress, [0, 1], [0, 72]);
  const glassY = useTransform(scrollYProgress, [0, 1], [0, -54]);

  useEffect(() => {
    api.get('/carers', { params: { limit: 5 } })
      .then((res) => {
        const items = toArray<Carer>(res.data?.items).length ? toArray<Carer>(res.data.items) : toArray<Carer>(res.data);
        const featured = [...items]
          .sort((first, second) => {
            const ratingDifference = Number(second.rating || 0) - Number(first.rating || 0);
            return ratingDifference || Number(second.reviewCount || 0) - Number(first.reviewCount || 0);
          })
          .slice(0, 5);
        setFeaturedCarers(featured);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    api.get('/services', { params: { page: 1, limit: 4, area: 'Đà Nẵng' } })
      .then(({ data }) => {
        const items = toArray<Service>(data?.items).length ? toArray<Service>(data.items) : toArray<Service>(data);
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
        const items = toArray<Review>(data?.items).length ? toArray<Review>(data.items) : toArray<Review>(data);
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

  const displayedReviews = reviews.length ? reviews : fallbackReviews;
  const displayedFeaturedCarers = featuredCarers.length ? featuredCarers : fallbackFeaturedCarers;

  const averageRating = useMemo(() => {
    const list = reviews.length ? reviews : fallbackReviews;
    const total = list.reduce((sum, review) => sum + Number(review.rating || 0), 0);
    return (total / list.length).toFixed(1);
  }, [reviews]);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    const query = keyword.trim();
    if (query) trackEvent('search', { search_term: query, source_screen: 'landing' });
    navigate(query ? `/services?search=${encodeURIComponent(query)}` : '/services');
  };

  return (
    <div className="landing-page aurora-home">
      <Navbar />
      <main>
        <section className="aurora-hero" ref={heroRef}>
          <div className="aurora-ambient" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="container aurora-hero-grid">
            <motion.div
              className="aurora-hero-copy"
              initial={{ opacity: 0, y: 28, filter: 'blur(12px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.9, ease: calmEase }}
            >
              <span className="aurora-kicker">Chăm sóc sau sinh MomMate</span>
              <h1>Hãy để chúng tôi chăm sóc mẹ trong những ngày đầu sau sinh.</h1>
              <p>MomMate được xây dựng bởi một người từng trải qua khủng hoảng sau sinh, để không người mẹ nào phải tự xoay xở trong im lặng.</p>
              <form className="aurora-search" onSubmit={handleSearch}>
                <label className="aurora-search-main">
                  <Search size={19} aria-hidden="true" />
                  <span>
                    <small>Tìm dịch vụ</small>
                    <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Chăm sóc sau sinh, tắm bé..." aria-label="Tìm dịch vụ" />
                  </span>
                </label>
                <div className="aurora-search-location">
                  <MapPin size={18} aria-hidden="true" />
                  <span><small>Khu vực</small>TP. Đà Nẵng</span>
                </div>
                <motion.button className="aurora-primary-action" type="submit" whileTap={{ scale: 0.98 }}>
                  Tìm kiếm <ArrowRight size={17} aria-hidden="true" />
                </motion.button>
              </form>
            </motion.div>

            <div className="aurora-hero-stage" aria-hidden="true">
              <motion.div className="aurora-portrait" style={{ y: portraitY }}>
                <img src="/src/assets/stitch/hero-maternal-care.jpg" alt="" />
              </motion.div>
              <motion.div className="aurora-floating-note aurora-floating-note-one" style={{ y: glassY }}>
                <ShieldCheck size={18} />
                <span>Hồ sơ xác minh</span>
              </motion.div>
              <motion.div className="aurora-floating-note aurora-floating-note-two" style={{ y: portraitY }}>
                <BriefcaseMedical size={18} />
                <span>Chăm sóc tại nhà</span>
              </motion.div>
              <div className="aurora-pulse-card">
                <strong>4 bước</strong>
                <span>từ tìm kiếm đến lịch chăm sóc</span>
              </div>
            </div>
          </div>
        </section>

        <motion.section className="aurora-trust" {...reveal}>
          <div className="container aurora-trust-band">
            <article>
              <ShieldCheck />
              <strong>Chuyên môn rõ ràng</strong>
              <span>Hồ sơ, kinh nghiệm và đánh giá được đặt trước quyết định đặt lịch.</span>
            </article>
            <article>
              <HeartHandshake />
              <strong>Nhẹ hơn cho mẹ</strong>
              <span>Quy trình ít nhiễu giúp gia đình không phải tự đoán trong giai đoạn nhạy cảm.</span>
            </article>
            <article>
              <WalletCards />
              <strong>Chi phí minh bạch</strong>
              <span>Giá dịch vụ được hiển thị và xác nhận trước khi thanh toán.</span>
            </article>
          </div>
        </motion.section>

        <section className="aurora-service-discovery" id="services">
          <div className="container">
            <motion.div className="aurora-section-stack" {...reveal}>
            <span className="aurora-kicker">Khám phá dịch vụ</span>
              <h2>Lựa chọn dịch vụ theo nhu cầu thật của mẹ và bé.</h2>
              <p>Không bắt đầu bằng một danh sách lạnh. MomMate đưa dịch vụ, khu vực và tín hiệu tin cậy vào cùng một bề mặt tìm kiếm.</p>
            </motion.div>
            {servicesLoading ? (
              <div className="aurora-loading"><Loader2 className="spinner" /><p>Đang tải dịch vụ...</p></div>
            ) : (
              <div className="aurora-service-mosaic">
                {services.map((service, index) => (
                  <motion.article
                    key={service._id}
                    className={`aurora-living-card aurora-service-${index + 1}`}
                    initial={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    viewport={{ once: true, amount: 0.18 }}
                    transition={{ duration: 0.72, delay: index * 0.08, ease: calmEase }}
                  >
                    <Link to={`/services/${service._id}`}>
                      <div className="aurora-service-image">
                        {service.image ? <img src={service.image} alt={service.title} /> : <Baby aria-hidden="true" />}
                      </div>
                      <div className="aurora-service-body">
                        <span>{service.category || 'Chăm sóc mẹ và bé'}</span>
                        <h3>{service.title}</h3>
                        <div>
                          <small><Star size={14} fill="currentColor" /> {service.reviewCount && service.reviewCount > 0 ? `${Number(service.rating).toFixed(1)} (${service.reviewCount})` : 'Chưa có đánh giá'}</small>
                          <strong>Từ {Number(service.price || service.basePrice || 0).toLocaleString('vi-VN')}đ</strong>
                        </div>
                      </div>
                    </Link>
                  </motion.article>
                ))}
                {!services.length && <p className="aurora-empty">{servicesFailed ? 'Không thể tải dịch vụ lúc này.' : 'Chưa có dịch vụ khả dụng tại Đà Nẵng.'}</p>}
              </div>
            )}
            <div className="aurora-line-action">
              <Link to="/services">Xem tất cả dịch vụ <ArrowRight size={17} /></Link>
            </div>
          </div>
        </section>

        <section className="aurora-how">
          <div className="container aurora-how-grid">
            <motion.div className="aurora-section-stack" {...reveal}>
              <span className="aurora-kicker">Quy trình đặt lịch</span>
              <h2>Một quy trình đủ rõ để mẹ không phải giữ mọi thứ trong đầu.</h2>
            </motion.div>
            <div className="aurora-steps">
              {[
                ['01', 'Chọn nhu cầu', 'Tìm dịch vụ theo tình trạng của mẹ, bé, khu vực và thời gian mong muốn.'],
                ['02', 'Kiểm tra hồ sơ', 'Xem kinh nghiệm, chứng chỉ, đánh giá đã duyệt và lịch khả dụng của chuyên gia.'],
                ['03', 'Đặt lịch minh bạch', 'Nhận báo giá từ hệ thống, thanh toán và theo dõi trạng thái ngay trên tài khoản.'],
              ].map(([step, title, text], index) => (
                <motion.article
                  key={step}
                  initial={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  viewport={{ once: true, amount: 0.24 }}
                  transition={{ duration: 0.7, delay: index * 0.08, ease: calmEase }}
                >
                  <b>{step}</b>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="aurora-featured-carers">
          <div className="aurora-carer-glow" aria-hidden="true">
            <span />
            <span />
          </div>
          <div className="container aurora-featured-carers-grid">
            <motion.div className="aurora-featured-carers-copy" {...reveal}>
              <span className="aurora-kicker">Đội ngũ MomMate</span>
              <h2>Những điều dưỡng viên đồng hành cùng mẹ.</h2>
              <p>Mỗi hồ sơ được đặt trong một không gian dễ đọc để gia đình cảm nhận được con người phía sau lịch chăm sóc: kinh nghiệm, khu vực, đánh giá và cách họ đồng hành.</p>
              <div className="aurora-featured-carers-actions">
                <Link to="/carers">Xem đội ngũ chuyên gia <ArrowRight size={17} /></Link>
                <span><ShieldCheck size={16} /> Hồ sơ, đánh giá và trạng thái xác thực hiển thị trước khi đặt lịch</span>
              </div>
            </motion.div>

            <motion.div className="aurora-carer-carousel-shell" {...reveal}>
              {displayedFeaturedCarers.length ? (
                <div className="aurora-carer-carousel" aria-label="Điều dưỡng viên nổi bật của MomMate">
                  <div className="aurora-carer-ring">
                    {displayedFeaturedCarers.map((carer, index) => {
                      const carerId = carer._id || carer.id;
                      const name = carer.displayName || getCarerFullName(carer);
                      const specialty = carer.skills?.[0] || carer.services?.[0]?.category || carer.position || 'Chăm sóc sau sinh';
                      const rating = getDisplayRating(carer);
                      const verified = carer.verificationStatus === 'verified' || carer.isVerified;
                      const location = formatLocation(carer.location);
                      const experience = formatExperienceShort(carer.experienceYears);

                      return (
                        <Link
                          to={carerId ? `/carers/${carerId}` : '/carers'}
                          className={`aurora-carer-orbit-card aurora-carer-orbit-card-${index + 1}`}
                          key={carerId || `${name}-${index}`}
                        >
                          <div className="aurora-carer-photo">
                            <img src={getCarerAvatar(carer)} alt={name} loading="lazy" />
                            {verified && <span><ShieldCheck size={14} />Đã xác thực</span>}
                          </div>
                          <div className="aurora-carer-card-body">
                            <div>
                              <span className="aurora-carer-role">{specialty}</span>
                              <h3>{name}</h3>
                            </div>
                            <p>{featuredCarerNote(carer, specialty)}</p>
                            <footer>
                              <span className="aurora-carer-rating">
                                <Star size={15} fill="currentColor" />
                                {rating || 'Mới'}
                              </span>
                              <span>{experience}</span>
                              <span>{location}</span>
                            </footer>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="aurora-featured-carers-empty">
                  <Loader2 className="spinner" />
                  <p>Đang chuẩn bị hồ sơ điều dưỡng viên nổi bật...</p>
                </div>
              )}
            </motion.div>
          </div>
        </section>

        <section className="aurora-reviews">
          <div className="container aurora-review-grid">
            <motion.div className="aurora-review-lead" {...reveal}>
              <span className="aurora-kicker">Đánh giá</span>
              <h2>Những lời nhắn bình tĩnh từ các gia đình đã đi qua giai đoạn đầu.</h2>
              <div className="aurora-score">
                <strong>{averageRating}/5</strong>
                <span>{reviews.length || fallbackReviews.length} đánh giá đang hiển thị</span>
              </div>
            </motion.div>
            <div className="aurora-review-river">
              {reviewsLoading && <p className="aurora-empty">Đang tải đánh giá...</p>}
              {!reviewsLoading && displayedReviews.map((review, index) => (
                <motion.article
                  key={review.id || index}
                  initial={{ opacity: 1, y: 0, rotate: index % 2 ? 0.6 : -0.4 }}
                  whileInView={{ opacity: 1, y: 0, rotate: index % 2 ? 0.6 : -0.4 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.78, delay: index * 0.08, ease: calmEase }}
                >
                  <Quote size={20} />
                  <p>"{review.text}"</p>
                  <footer>
                    <strong>{review.name}</strong>
                    <span>{review.role}</span>
                  </footer>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="aurora-faq">
          <div className="container aurora-faq-grid">
            <motion.div className="aurora-section-stack" {...reveal}>
              <span className="aurora-kicker">Câu hỏi thường gặp</span>
              <h2>Câu hỏi thường gặp trước khi gia đình đặt lịch.</h2>
              <p>Những điểm cần biết được đặt gần cuối trang để mẹ có thể kiểm tra nhanh trước khi chuyển sang tìm dịch vụ.</p>
            </motion.div>
            <div className="aurora-faq-list">
              {faqItems.map((item, index) => {
                const active = openFaq === index;
                return (
                  <motion.article
                    key={item.question}
                    className={active ? 'is-open' : ''}
                    initial={{ opacity: 1, y: 0 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.52, delay: index * 0.05 }}
                  >
                    <button onClick={() => setOpenFaq(active ? -1 : index)} aria-expanded={active}>
                      <span>{item.question}</span>
                      <ChevronDown size={19} />
                    </button>
                    <motion.div
                      initial={false}
                      animate={{ height: active ? 'auto' : 0, opacity: active ? 1 : 0 }}
                      transition={{ duration: 0.34, ease: calmEase }}
                    >
                      <p>{item.answer}</p>
                    </motion.div>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
};

export default Landing;
