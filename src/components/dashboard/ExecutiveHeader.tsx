import { Search } from 'lucide-react';
import { useExecutiveSummary } from '../../hooks/dashboard/dashboardHooks';
import Button from '../ui/Button';
import Input from '../ui/Input';

export default function ExecutiveHeader() {
  const { data: summary } = useExecutiveSummary();

  return (
    <section className="rounded-[32px] border border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-8 text-white shadow-elevated sm:p-10">
      <div className="grid gap-8 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          <div className="inline-flex rounded-full bg-white/10 px-4 py-2 text-sm uppercase tracking-[0.35em] text-slate-300 shadow-sm">
            Executive command center
          </div>
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-300">{summary?.greeting ?? 'Welcome back'}</p>
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
              {summary?.userName ?? 'Health Network Executive'}
            </h1>
            <p className="max-w-2xl text-base text-slate-300 sm:text-lg">
              {summary?.organization ?? 'NMIS health network'} · {summary?.dateLabel ?? 'Today'}
            </p>
          </div>
          <p className="max-w-2xl text-sm text-slate-300/90">{summary?.todayFocus ?? 'Monitor today’s approvals, inspections, and network status in one place.'}</p>
        </div>

        <div className="space-y-5 rounded-[28px] border border-white/10 bg-slate-950/70 p-6 shadow-soft backdrop-blur-xl">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search providers, approvals, inspections..." className="bg-slate-900/90 text-white placeholder:text-slate-500" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {summary?.quickActions.map(action => (
              <Button
                key={action.label}
                variant={action.variant === 'primary' ? 'primary' : action.variant === 'secondary' ? 'secondary' : 'ghost'}
                className="w-full justify-center text-sm"
              >
                {action.label}
              </Button>
            ))}
          </div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Action-ready workflow</p>
        </div>
      </div>
    </section>
  );
}
