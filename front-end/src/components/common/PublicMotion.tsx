import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const REVEAL_SELECTOR = [
  '.public-app main > section',
  '.public-app .page-header',
  '.public-app .carer-hero-card',
  '.public-app .service-top-section',
  '.public-app .service-benefits',
  '.public-app .treatment-details',
  '.public-app .carer-profile-card',
  '.public-app .booking-form-section',
  '.public-app .summary-card',
  '.public-app .payment-methods-col',
  '.public-app .auth-panel',
  '.public-app .account-card',
  '.public-app .request-card',
  '.public-app .review-form-card',
].join(',');

const PublicMotion = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let revealFallback: number | undefined;
    const frame = window.requestAnimationFrame(() => {
      const elements = Array.from(document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR));
      elements.forEach((element, index) => {
        element.classList.add('motion-reveal');
        element.style.setProperty('--motion-delay', `${Math.min(index % 5, 4) * 55}ms`);
      });

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.08, rootMargin: '0px 0px -30px' },
      );

      elements.forEach((element) => observer.observe(element));
      revealFallback = window.setTimeout(() => {
        elements.forEach((element) => element.classList.add('is-visible'));
        observer.disconnect();
      }, 900);
      (window as Window & { __mommateMotionObserver?: IntersectionObserver }).__mommateMotionObserver = observer;
    });

    return () => {
      window.cancelAnimationFrame(frame);
      if (revealFallback !== undefined) window.clearTimeout(revealFallback);
      (window as Window & { __mommateMotionObserver?: IntersectionObserver }).__mommateMotionObserver?.disconnect();
    };
  }, [pathname]);

  return null;
};

export default PublicMotion;
