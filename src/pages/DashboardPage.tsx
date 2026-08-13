import { useMemo } from 'react';
import PageHeader from '../components/PageHeader';
import { ChartBarIcon, ClockIcon, FolderOpenIcon, ShieldCheckIcon, UsersIcon } from '@heroicons/react/24/outline';
import { useProviderDirectory } from '../features/providers/hooks';
import { useInspections } from '../hooks/inspections/inspectionsHooks';
import { useFinancialIntelligence } from '../hooks/financial-intelligence/financialIntelligenceHooks';
import { useNotifications } from '../hooks/notifications/notificationHooks';

function MetricCard({ label, value, trend, icon: Icon, trendColor = 'text-emerald-600' }: { label: string; value: string; trend?: string; icon: any; trendColor?: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
        </div>
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
          <Icon className="h-6 w-6" />
        </div>
      </div>
      {trend && <p className={`mt-4 text-sm ${trendColor}`}>{trend} vs last month</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { data: providers = [] } = useProviderDirectory({
    search: '',
    status: 'all',
    contractStatus: 'all',
    credentialStatus: 'all',
    inspectionStatus: 'all',
    capitationStatus: 'all',
    state: 'all',
    lga: 'all',
    category: 'all',
    subcategory: 'all',
    ownership: 'all',
  });
  const { data: inspections = [] } = useInspections();
  const { data: intelligence } = useFinancialIntelligence({ period: '2026-08' });
  const { data: notifications = [] } = useNotifications();

  const activeProviders = providers.filter(p => p.status === 'active').length;
  const pendingInspections = inspections.filter(i => i.status === 'scheduled').length;
  const pendingApprovals = notifications.length;
  const totalExpenditure = intelligence?.totalExpenditure || 0;

  const formatNaira = (value: number) => {
    if (value >= 1_000_000_000) return `₦${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(1)}M`;
    return `₦${value.toLocaleString()}`;
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <PageHeader
          title="Network management overview"
          description="Track provider performance, capitation status, inspections, and network activity from a single dashboard."
          actions={[
            { label: 'Export report', variant: 'secondary', disabled: true },
            { label: 'New provider', disabled: true },
          ]}
        />

        <section className="grid gap-6 xl:grid-cols-[1.75fr_1fr]">
          <div className="grid gap-6 lg:grid-cols-2">
            <MetricCard label="Active Providers" value={activeProviders.toString()} icon={UsersIcon} trend="+0%" />
            <MetricCard label="Inspections due" value={pendingInspections.toString()} icon={ClockIcon} trend="+0%" />
            <MetricCard label="Pending approvals" value={pendingApprovals.toString()} icon={ShieldCheckIcon} trend="+0%" />
            <MetricCard label="Capitation paid" value={formatNaira(totalExpenditure)} icon={FolderOpenIcon} trend="+0%" />
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Provider distribution</p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">Network coverage map</h2>
                </div>
                <button className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700" disabled>View details</button>
              </div>
              <div className="mt-6 h-72 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400 text-sm font-medium">
                Map data unavailable
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
                <p className="text-sm font-medium text-slate-500">Active cases</p>
                <p className="mt-4 text-3xl font-semibold text-slate-900">0</p>
                <p className="mt-3 text-sm text-slate-500">Cases requiring action this week.</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
                <p className="text-sm font-medium text-slate-500">Inspection score</p>
                <p className="mt-4 text-3xl font-semibold text-slate-900">0%</p>
                <p className="mt-3 text-sm text-slate-500">Average compliance score across facilities.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Recent activity</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">Team updates</h2>
              </div>
              <button className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700" disabled>See all</button>
            </div>
            <div className="mt-6 space-y-4">
              {notifications.length === 0 ? (
                <p className="py-12 text-center text-slate-400 text-sm">No recent activity found.</p>
              ) : (
                notifications.slice(0, 4).map((n, index) => (
                  <div key={n.id} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-sm text-slate-700 font-bold">{n.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{n.message}</p>
                    <p className="mt-2 text-xs text-slate-400">{new Date(n.createdAt).toLocaleDateString()}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <p className="text-sm font-medium text-slate-500">Upcoming events</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Inspection schedule</h2>
            <ul className="mt-6 space-y-4">
              {inspections.filter(i => i.status === 'scheduled').length === 0 ? (
                <p className="py-12 text-center text-slate-400 text-sm">No upcoming inspections scheduled.</p>
              ) : (
                inspections.filter(i => i.status === 'scheduled').slice(0, 3).map((item, index) => (
                  <li key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-slate-900">{item.providerName}</p>
                      <span className="rounded-full bg-slate-200 px-3 py-1 text-xs text-slate-700">{new Date(item.scheduledAt).toLocaleDateString()}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{item.type} Inspection</p>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
