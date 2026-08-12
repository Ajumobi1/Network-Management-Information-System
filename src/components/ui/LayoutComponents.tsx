import { ReactNode } from 'react';
import Card from './Card';
import { ArrowUpRight } from 'lucide-react';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
};

export function SectionHeader({ title, subtitle, actions, className = '' }: SectionHeaderProps) {
  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div>
        <h2 className="nmis-section-title">{title}</h2>
        {subtitle && <p className="nmis-section-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

type ChartCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function ChartCard({ title, subtitle, children, action, className = '' }: ChartCardProps) {
  return (
    <Card className={className}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="nmis-section-title">{title}</h2>
          {subtitle && <p className="nmis-section-subtitle">{subtitle}</p>}
        </div>
        {action || <ArrowUpRight className="h-4 w-4 text-brand-subtle" />}
      </div>
      <div className="mt-6">
        {children}
      </div>
    </Card>
  );
}

type MetricCardProps = {
  label: string;
  value: string | number;
  helper?: string;
  icon?: ReactNode;
  className?: string;
};

export function MetricCard({ label, value, helper, icon, className = '' }: MetricCardProps) {
  return (
    <Card className={`p-5 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="nmis-label">{label}</p>
          <p className="mt-2 text-2xl font-black text-brand-foreground">{value}</p>
          {helper && <p className="nmis-helper mt-1">{helper}</p>}
        </div>
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-brand-soft text-brand-blue">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
