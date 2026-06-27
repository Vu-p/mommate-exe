import { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import './DesignFoundation.css';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'error';

type SurfaceProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export const PageShell = ({ children, className = '', ...props }: SurfaceProps) => (
  <div className={`mm-page-shell ${className}`.trim()} {...props}>
    {children}
  </div>
);

export const GlassCard = ({ children, className = '', ...props }: SurfaceProps) => (
  <div className={`mm-glass-panel ${className}`.trim()} {...props}>
    {children}
  </div>
);

type GradientButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
};

export const GradientButton = ({ children, className = '', variant = 'primary', ...props }: GradientButtonProps) => (
  <button className={`mm-gradient-button ${variant === 'secondary' ? 'secondary' : ''} ${className}`.trim()} {...props}>
    {children}
  </button>
);

export const FloatingBackground = ({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={`mm-floating-background ${className}`.trim()} aria-hidden="true" {...props}>
    <span />
    <span />
  </div>
);

type AnimatedSectionProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  id?: string;
  role?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
};

export const AnimatedSection = ({ children, className = '', delay = 0, ...props }: AnimatedSectionProps) => {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <section className={`mm-section ${className}`.trim()} {...props}>{children}</section>;
  }

  return (
    <motion.section
      className={`mm-section ${className}`.trim()}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2, margin: '0px 0px -32px 0px' }}
      transition={{ duration: 0.42, delay, ease: [0.16, 1, 0.3, 1] }}
      {...props}
    >
      {children}
    </motion.section>
  );
};

type SectionHeaderProps = HTMLAttributes<HTMLDivElement> & {
  eyebrow?: ReactNode;
  title: ReactNode;
  children?: ReactNode;
};

export const SectionHeader = ({ eyebrow, title, children, className = '', ...props }: SectionHeaderProps) => (
  <div className={`mm-section-header ${className}`.trim()} {...props}>
    {eyebrow && <span>{eyebrow}</span>}
    <h2>{title}</h2>
    {children}
  </div>
);

type StatusBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone;
};

export const StatusBadge = ({ children, tone = 'neutral', className = '', ...props }: StatusBadgeProps) => (
  <span className={`mm-status-badge ${tone !== 'neutral' ? tone : ''} ${className}`.trim()} {...props}>
    {children}
  </span>
);

type StateProps = HTMLAttributes<HTMLDivElement> & {
  title?: ReactNode;
  description?: ReactNode;
};

const StateBlock = ({ title, description, children, className = '', ...props }: StateProps) => (
  <div className={`mm-state ${className}`.trim()} {...props}>
    {children}
    {title && <strong>{title}</strong>}
    {description && <p>{description}</p>}
  </div>
);

export const EmptyState = (props: StateProps) => <StateBlock {...props} />;

export const ErrorState = ({ className = '', ...props }: StateProps) => (
  <StateBlock className={`error ${className}`.trim()} {...props} />
);

export const LoadingState = ({ title = 'Đang tải...', description, className = '', ...props }: StateProps) => (
  <StateBlock title={title} description={description} className={`loading ${className}`.trim()} {...props}>
    <Loader2 className="spinner" aria-hidden="true" />
  </StateBlock>
);

export const AdminTableShell = ({ children, className = '', ...props }: SurfaceProps) => (
  <div className={`mm-admin-shell mm-admin-table-shell ${className}`.trim()} {...props}>
    {children}
  </div>
);

export const FormShell = ({ children, className = '', ...props }: SurfaceProps) => (
  <div className={`mm-glass-panel mm-form-shell ${className}`.trim()} {...props}>
    {children}
  </div>
);
