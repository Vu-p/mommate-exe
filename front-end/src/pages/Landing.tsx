import Navbar from '../components/Navbar.tsx'; // PascalCase enforced
import Footer from '../components/Footer.tsx';
import Hero from '../components/landing/Hero.tsx';
import Services from '../components/landing/Services.tsx';
import Values from '../components/landing/Values.tsx';
import Carers from '../components/landing/Carers.tsx';
import Testimonials from '../components/landing/Testimonials.tsx';
import Newsletter from '../components/landing/Newsletter.tsx';
import BackToTop from '../components/common/BackToTop.tsx';
import ScrollReveal from '../components/common/ScrollReveal.tsx';
import './Landing.css';

const Landing = () => {
  return (
    <div className="landing-page">
      <Navbar />
      <main>
        <Hero />
        <ScrollReveal>
          <Services />
        </ScrollReveal>
        <ScrollReveal delay={0.05}>
          <Values />
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <Carers />
        </ScrollReveal>
        <ScrollReveal delay={0.05}>
          <Testimonials />
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <Newsletter />
        </ScrollReveal>
      </main>
      <ScrollReveal>
        <Footer />
      </ScrollReveal>
      <BackToTop />
    </div>
  );
};

export default Landing;
