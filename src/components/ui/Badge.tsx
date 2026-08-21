import { ReactNode } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md';

type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
};

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700',
  success: 'bg-status-successSoft text-status-success',
  warning: 'bg-status-warningSoft text-status-warning',
  error: 'bg-status-errorSoft text-status-error',
  info: 'bg-status-infoSoft text-status-info',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[0.6875rem]',
  md: 'px-2.5 py-1 text-xs',
};

export default function Badge({ children, variant = 'default', size = 'md', className = '' }: BadgeProps) {
  return <span className={`inline-flex items-center rounded-pill font-semibold leading-5 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`.trim()}>{children}</span>;
}
