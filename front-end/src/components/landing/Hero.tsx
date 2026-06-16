import { motion } from 'framer-motion';
import { ArrowRight, Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import heroBg from '../../assets/images/hero-bg.png';
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
          <motion.div
            className="hero-copy"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.12 }}
          >
            <h1>
              Chăm sóc
              <br />
              mọi lúc
              <br />
              mọi nơi!
            </h1>

            <p>
              Hệ sinh thái uy tín kết nối các gia đình với đội ngũ chăm sóc chuyên nghiệp. Cùng mẹ
              trải qua hành trình hậu sản khoa học và an toàn.
            </p>

            <form className="search-bar" onSubmit={handleSearch}>
              <div className="search-input-wrapper">
                <Search className="search-icon" size={20} />
                <input
                  type="text"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Loại hình hỗ trợ"
                  aria-label="Tìm loại hình hỗ trợ"
                />
              </div>
              <motion.button className="btn-signup" type="submit" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                Tìm dịch vụ
                <ArrowRight size={16} />
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
