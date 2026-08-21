import { Clock3, CheckCircle2, FilePlus, ShieldCheck, ShieldAlert, Zap } from 'lucide-react';
import { useDashboardActivities } from '../../hooks/dashboard/dashboardHooks';
import EmptyState from './EmptyState';
import LoadingSkeletons from './LoadingSkeletons';

const badgeStyles = {
  Onboarding: 'bg-slate-100 text-slate-700',
  Inspection: 'bg-sky-100 text-sky-700',
  Finance: 'bg-emerald-100 text-emerald-700',
  Contract: 'bg-amber-100 text-amber-700',
  Credentialing: 'bg-indigo-100 text-indigo-700',
  Support: 'bg-rose-100 text-rose-700',
};

const iconMap = {
  Onboarding: FilePlus,
  Inspection: ShieldCheck,
  Finance: CheckCircle2,
  Contract: Zap,
  Credentialing: ShieldAlert,
  Support: Clock3,
};

export default function ActivityTimeline() {
  const { data: activities, isLoading } = useDashboardActivities();

  return (
    <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">Recent activity</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Network activity timeline</h2>
        </div>
        <span className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">Latest 24 hours</span>
      </div>

      {isLoading ? (
        <LoadingSkeletons rows={5} className="mt-6" />
      ) : activities?.length ? (
        <div className="mt-6 space-y-6">
          {activities.map((item, index) => {
            const Icon = iconMap[item.badge as keyof typeof iconMap] ?? CheckCircle2;
            return (
              <div key={item.id} className="relative flex gap-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="relative flex h-14 w-14 items-center justify-center rounded-3xl bg-white shadow-sm">
                  <Icon className="h-6 w-6 text-slate-600" />
                  {index < activities.length - 1 && <span className="absolute left-1/2 top-full h-20 w-px -translate-x-1/2 bg-slate-200" />}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 shadow-sm">
                      {item.badge}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{item.description}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.28em] text-slate-400">{item.timestamp}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No activity recorded"
          description="All systems are stable and there are no recent items to display right now."
          actionLabel="Reload activity"
        />
      )}
    </div>
  );
}
