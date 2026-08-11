import { MessageSquare, Sparkles, AlertTriangle, ShieldCheck, MapPin } from 'lucide-react';
import { useAiInsights } from '../../hooks/dashboard/dashboardHooks';
import Badge from '../ui/Badge';
import EmptyState from './EmptyState';
import LoadingSkeletons from './LoadingSkeletons';

const iconMap = {
  Action: Sparkles,
  Strategy: MapPin,
  Alert: AlertTriangle,
  Compliance: ShieldCheck,
};

export default function AiInsightsPanel() {
  const { data: insights, isLoading } = useAiInsights();

  return (
    <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">AI insights</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Smart recommendations</h2>
        </div>
        <div className="inline-flex items-center gap-2 rounded-3xl bg-slate-50 px-4 py-2 text-sm text-slate-600">
          <MessageSquare className="h-4 w-4" />
          Real-time advisory
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeletons rows={4} className="mt-6" />
      ) : insights?.length ? (
        <div className="mt-6 space-y-4">
          {insights.map(insight => {
            const Icon = iconMap[insight.badge as keyof typeof iconMap] ?? Sparkles;
            return (
              <div key={insight.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-white shadow-sm">
                    <Icon className="h-5 w-5 text-slate-900" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{insight.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{insight.detail}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <Badge variant="info">{insight.badge}</Badge>
                  <span>{insight.insight}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No AI insights"
          description="The assistant did not detect any high-priority recommendations at this time."
          actionLabel="Sync with data"
        />
      )}
    </div>
  );
}
