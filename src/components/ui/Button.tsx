import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  to?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand-blue text-white hover:bg-brand-hover shadow-soft',
  secondary: 'bg-brand-surface text-brand-secondary border-brand-border hover:bg-brand-card hover:text-brand-foreground border',
  outline: 'bg-transparent border-brand-border text-brand-secondary hover:border-brand-blue hover:text-brand-blue border',
  ghost: 'bg-transparent text-brand-muted hover:bg-brand-surface hover:text-brand-foreground',
  danger: 'bg-status-errorSoft text-status-error hover:bg-status-error hover:text-white border border-status-error/10',
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider',
  sm: 'px-3.5 py-1.5 text-xs font-bold',
  md: 'px-5 py-2.5 text-sm font-bold',
  lg: 'px-7 py-3.5 text-base font-bold',
};

export default function Button({ variant = 'primary', size = 'md', className = '', children, to, ...props }: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded-control transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 gap-2';
  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim();

  if (to) {
    return (
      <Link to={to} className={combinedClasses}>
        {children}
      </Link>
    );
  }

  return (
    <button className={combinedClasses} {...props}>
      {children}
    </button>
  );
}
