import { usePerformanceGauges } from '../../hooks/dashboard/dashboardHooks';
import { Circle } from 'lucide-react';
import EmptyState from './EmptyState';
import LoadingSkeletons from './LoadingSkeletons';

const gaugeColors = {
  emerald: '#10b981',
  cyan: '#06b6d4',
  indigo: '#0f3c91',
  amber: '#f59e0b',
  rose: '#f43f5e',
};

function CircularGauge({ value, label, suffix, color }: { value: number; label: string; suffix: string; color: keyof typeof gaugeColors }) {
  const stroke = 10;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex items-center gap-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
      <svg width="112" height="112" viewBox="0 0 112 112">
        <circle cx="56" cy="56" r={radius} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle
          cx="56"
          cy="56"
          r={radius}
          fill="none"
          stroke={gaugeColors[color]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 56 56)"
        />
      </svg>
      <div>
        <p className="text-2xl font-semibold text-slate-900">{value}{suffix}</p>
        <p className="text-sm text-slate-600">{label}</p>
      </div>
    </div>
  );
}

export default function PerformancePanel() {
  const { data: gauges, isLoading } = usePerformanceGauges();

  return (
    <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">Performance dashboard</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Operational performance</h2>
        </div>
        <p className="rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-600">Goal tracking</p>
      </div>

      {isLoading ? (
        <LoadingSkeletons rows={4} className="mt-6" />
      ) : gauges?.length ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {gauges.map(gauge => (
            <CircularGauge key={gauge.id} value={gauge.value} label={gauge.label} suffix={gauge.suffix} color={gauge.color as keyof typeof gaugeColors} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No performance data"
          description="Performance metrics will appear here once the dashboard syncs with the network service."
          actionLabel="Refresh metrics"
        />
      )}
    </div>
  );
}
