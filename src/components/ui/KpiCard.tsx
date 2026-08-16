import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { ReactNode } from 'react';

export type KpiTone = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
export type KpiTrendDirection = 'up' | 'down' | 'flat';

type KpiCardProps = {
  title: string;
  value: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  tone?: KpiTone;
  trend?: ReactNode;
  trendDirection?: KpiTrendDirection;
  trendLabel?: string;
  status?: ReactNode;
  action?: ReactNode;
  className?: string;
};

const toneMap: Record<KpiTone, { icon: string; value: string; accent: string }> = {
  primary: { icon: 'bg-brand-soft text-brand-blue', value: 'text-brand-navy', accent: 'bg-brand-blue' },
  success: { icon: 'bg-status-successSoft text-status-success', value: 'text-status-success', accent: 'bg-status-success' },
  warning: { icon: 'bg-status-warningSoft text-status-warning', value: 'text-status-warning', accent: 'bg-status-warning' },
  danger: { icon: 'bg-status-errorSoft text-status-error', value: 'text-status-error', accent: 'bg-status-error' },
  info: { icon: 'bg-status-infoSoft text-status-info', value: 'text-status-info', accent: 'bg-status-info' },
  neutral: { icon: 'bg-slate-100 text-slate-700', value: 'text-slate-900', accent: 'bg-slate-400' },
};

export default function KpiCard({ title, value, subtitle, icon, tone = 'primary', trend, trendDirection = 'flat', trendLabel = 'vs previous period', status, action, className = '' }: KpiCardProps) {
  const colors = toneMap[tone];
  const TrendIcon = trendDirection === 'up' ? ArrowUpRight : trendDirection === 'down' ? ArrowDownRight : Minus;

  // Dynamic font scaling for long financial/enrollee figures
  const valueString = typeof value === 'string' ? value : '';
  const isLongValue = valueString.length > 14;
  const isVeryLongValue = valueString.length > 18;

  const valueFontSize = isVeryLongValue
    ? 'text-base sm:text-lg lg:text-xl'
    : isLongValue
      ? 'text-lg sm:text-xl lg:text-2xl'
      : '';

  return (
    <article className={`nmis-card nmis-card-interactive relative overflow-hidden p-5 ${className}`.trim()}>
      <span className={`absolute inset-x-0 top-0 h-0.5 ${colors.accent}`} aria-hidden="true" />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="nmis-kpi-label leading-tight">{title}</p>
            {action}
          </div>
          <p
            className={`nmis-kpi-value mt-3 ${colors.value} ${valueFontSize} transition-all duration-300`}
            title={valueString}
          >
            {value}
          </p>
          {subtitle ? <p className="nmis-helper mt-2 min-h-5 leading-5">{subtitle}</p> : null}
        </div>
        {icon ? <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-control ${colors.icon}`}>{icon}</span> : null}
      </div>
      {(trend !== undefined || status) ? <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-brand-divider pt-3">
        {trend !== undefined ? <span className={`nmis-kpi-trend ${trendDirection === 'up' ? 'nmis-kpi-trend-up' : trendDirection === 'down' ? 'nmis-kpi-trend-down' : 'text-brand-muted'}`}><TrendIcon className="h-3.5 w-3.5" />{trend}<span className="font-normal text-brand-muted">{trendLabel}</span></span> : <span />}
        {status ? <span>{status}</span> : null}
      </div> : null}
    </article>
  );
}
