import { motion } from 'framer-motion';
import { BriefcaseMedical, MapPin, Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Hero.css';

const Hero = () => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const query = keyword.trim();
    navigate(query ? `/services?search=${encodeURIComponent(query)}` : '/services');
  };

  return (
    <section className="hero">
      <div className="hero-main-container">
        <div className="container hero-content">
          <motion.div className="hero-copy" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65 }}>
            <h1>Hãy để chúng tôi chăm sóc<br />mẹ – vì một thế hệ khởi đầu<br />khỏe mạnh</h1>
            <p>MomMate được xây dựng bởi một người từng trải qua khủng hoảng sau sinh – và chúng tôi sẽ không để bất kỳ người mẹ nào phải chịu đựng điều tương tự.</p>
            <form className="search-bar" onSubmit={handleSearch}>
              <div className="search-input-wrapper">
                <BriefcaseMedical className="search-icon" size={20} />
                <label><small>DỊCH VỤ</small><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Chăm sóc sau sinh, tắm bé..." aria-label="Tìm dịch vụ" /></label>
              </div>
              <div className="search-location"><MapPin size={20} /><span><small>KHU VỰC</small>TP. Đà Nẵng</span></div>
              <motion.button className="btn-signup" type="submit" whileTap={{ scale: .98 }}><Search size={17} />Tìm kiếm</motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
