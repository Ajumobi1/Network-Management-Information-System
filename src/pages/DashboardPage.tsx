import { useMemo } from 'react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { ChartBarIcon, ClockIcon, FolderOpenIcon, ShieldCheckIcon, UsersIcon } from '@heroicons/react/24/outline';
import { useProviderDirectory } from '../features/providers/hooks';
import { useInspections } from '../hooks/inspections/inspectionsHooks';
import { useFinancialIntelligence } from '../hooks/financial-intelligence/financialIntelligenceHooks';
import { useNotifications } from '../hooks/notifications/notificationHooks';

type MetricTone = 'blue' | 'orange' | 'navy' | 'sky';

function MetricCard({ label, value, trend, icon: Icon, tone = 'blue' }: { label: string; value: string; trend?: string; icon: any; tone?: MetricTone }) {
  const toneStyles = {
    blue: { accent: 'bg-[#0b65a1]', icon: 'bg-[#eaf4fb] text-[#0b65a1]' },
    orange: { accent: 'bg-[#f7931e]', icon: 'bg-[#fff4e6] text-[#d97908]' },
    navy: { accent: 'bg-[#0b4f82]', icon: 'bg-[#e9f0f6] text-[#0b4f82]' },
    sky: { accent: 'bg-[#62a8d2]', icon: 'bg-[#eef9fe] text-[#3b91bd]' },
  }[tone];

  return (
    <article className="nmis-card nmis-card-interactive relative overflow-hidden p-5">
      <span className={`absolute inset-x-0 top-0 h-1 ${toneStyles.accent}`} aria-hidden="true" />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="nmis-kpi-label">{label}</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-[#123b5d]">{value}</p>
        </div>
        <div className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${toneStyles.icon}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      {trend && <p className="mt-4 text-xs font-bold text-[#55738b]">{trend} <span className="font-normal text-slate-400">vs last month</span></p>}
    </article>
  );
}

function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`nmis-card overflow-hidden p-5 sm:p-6 ${className}`.trim()}>{children}</section>;
}

export default function DashboardPage() {
  const { data: providers = [] } = useProviderDirectory({
    search: '',
    status: 'all',
    contractStatus: 'all',
    credentialStatus: 'all',
    inspectionStatus: 'all',
    capitationStatus: 'all',
    lga: 'all',
    category: 'all',
    subcategory: 'all',
    ownership: 'all',
    service: 'all',
  });
  const { data: inspections = [] } = useInspections();
  const { data: intelligence } = useFinancialIntelligence({ period: '2026-08' });
  const { data: notifications = [] } = useNotifications();

  const activeProviders = (providers as any).activeCount ?? providers.filter(p => p.status === 'active').length;
  const pendingInspections = inspections.filter(i => i.status === 'scheduled').length;
  const pendingApprovals = notifications.length;
  const totalExpenditure = intelligence?.totalExpenditure || 0;

  const formatNaira = (value: number) => {
    if (value >= 1_000_000_000) return `₦${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(1)}M`;
    return `₦${value.toLocaleString()}`;
  };

  const scheduledInspections = useMemo(() => inspections.filter(i => i.status === 'scheduled'), [inspections]);

  return (
    <main className="nmis-page">
      <div className="relative overflow-hidden rounded-[1.75rem] bg-[#0b4f82] px-5 py-6 text-white shadow-[0_20px_42px_-26px_rgba(11,79,130,0.8)] sm:px-7">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#f7931e]/20 blur-2xl" aria-hidden="true" />
        <div className="absolute bottom-0 right-24 h-20 w-20 rounded-full bg-[#62a8d2]/20 blur-xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-200">ODCHC ORANGHIS · NMIS COMMAND CENTRE</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Network management overview</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">A single operating view of provider coverage, inspections, capitation activity, and management attention.</p>
          </div>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-orange-200 backdrop-blur-sm">
            <ChartBarIcon className="h-7 w-7" />
          </div>
        </div>
      </div>

      <PageHeader
        eyebrow="Executive oversight"
        title="Current network position"
        subtitle="Monitor the operational signals that need attention across the Ondo State provider network."
        actions={<div className="flex flex-wrap gap-2"><Button variant="secondary" size="sm" disabled>Export report</Button><Button size="sm" disabled>New provider</Button></div>}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active providers" value={activeProviders.toLocaleString()} icon={UsersIcon} trend="+0%" tone="blue" />
        <MetricCard label="Inspections due" value={pendingInspections.toLocaleString()} icon={ClockIcon} trend="+0%" tone="orange" />
        <MetricCard label="Pending approvals" value={pendingApprovals.toLocaleString()} icon={ShieldCheckIcon} trend="+0%" tone="navy" />
        <MetricCard label="Capitation paid" value={formatNaira(totalExpenditure)} icon={FolderOpenIcon} trend="+0%" tone="sky" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <SectionCard>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="nmis-kpi-label">Provider distribution</p>
              <h2 className="mt-2 text-xl font-black text-[#123b5d]">Network coverage map</h2>
            </div>
            <button className="rounded-xl border border-[#cfe0ee] bg-[#f7fbfe] px-3 py-2 text-xs font-black text-[#0b4f82] transition hover:border-[#a9c9df] hover:bg-[#fff8ef]" disabled>View details</button>
          </div>
          <div className="mt-5 flex h-72 items-center justify-center rounded-2xl border border-[#d6e5f0] bg-[radial-gradient(circle_at_30%_30%,rgba(98,168,210,0.18),transparent_25%),linear-gradient(135deg,#eef6fb,#f9fcfe)] text-sm font-bold text-[#55738b]">
            <div className="text-center"><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#0b65a1] shadow-sm"><ChartBarIcon className="h-6 w-6" /></div><p>Map data unavailable</p><p className="mt-1 text-xs font-normal text-slate-400">Network coverage visualization will appear when map data is available.</p></div>
          </div>
        </SectionCard>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
          <SectionCard className="bg-gradient-to-br from-white to-[#f7fbfe]">
            <p className="nmis-kpi-label">Active cases</p>
            <p className="mt-3 text-3xl font-black text-[#123b5d]">0</p>
            <p className="mt-2 text-sm text-[#55738b]">Cases requiring action this week.</p>
            <div className="mt-5 h-1.5 rounded-full bg-[#eaf1f6]"><div className="h-full w-1/4 rounded-full bg-[#f7931e]" /></div>
          </SectionCard>
          <SectionCard className="bg-gradient-to-br from-white to-[#f7fbfe]">
            <p className="nmis-kpi-label">Inspection score</p>
            <p className="mt-3 text-3xl font-black text-[#123b5d]">0%</p>
            <p className="mt-2 text-sm text-[#55738b]">Average compliance score across facilities.</p>
            <div className="mt-5 h-1.5 rounded-full bg-[#eaf1f6]"><div className="h-full w-0 rounded-full bg-[#0b65a1]" /></div>
          </SectionCard>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <SectionCard>
          <div className="flex items-center justify-between gap-4">
            <div><p className="nmis-kpi-label">Recent activity</p><h2 className="mt-2 text-xl font-black text-[#123b5d]">Team updates</h2></div>
            <button className="rounded-xl border border-[#cfe0ee] bg-[#f7fbfe] px-3 py-2 text-xs font-black text-[#0b4f82] transition hover:border-[#a9c9df] hover:bg-[#fff8ef]" disabled>See all</button>
          </div>
          <div className="mt-5 space-y-3">
            {notifications.length === 0 ? <p className="rounded-2xl border border-dashed border-[#cfe0ee] bg-[#f7fbfe] py-12 text-center text-sm text-[#55738b]">No recent activity found.</p> : notifications.slice(0, 4).map(n => <div key={n.id} className="rounded-2xl border border-[#d6e5f0] bg-[#f7fbfe] px-4 py-4 transition hover:border-[#a9c9df] hover:bg-white"><p className="text-sm font-black text-[#123b5d]">{n.title}</p><p className="mt-1 text-sm text-[#55738b]">{n.message}</p><p className="mt-2 text-xs font-semibold text-slate-400">{new Date(n.createdAt).toLocaleDateString()}</p></div>)}
          </div>
        </SectionCard>

        <SectionCard>
          <p className="nmis-kpi-label">Upcoming events</p>
          <h2 className="mt-2 text-xl font-black text-[#123b5d]">Inspection schedule</h2>
          <ul className="mt-5 space-y-3">
            {scheduledInspections.length === 0 ? <p className="rounded-2xl border border-dashed border-[#cfe0ee] bg-[#f7fbfe] py-12 text-center text-sm text-[#55738b]">No upcoming inspections scheduled.</p> : scheduledInspections.slice(0, 3).map(item => <li key={item.id} className="rounded-2xl border border-[#d6e5f0] bg-[#f7fbfe] px-4 py-4 transition hover:border-[#a9c9df] hover:bg-white"><div className="flex items-center justify-between gap-2"><p className="font-black text-[#123b5d]">{item.providerName}</p><span className="rounded-full bg-[#fff4e6] px-3 py-1 text-[11px] font-bold text-[#b86606]">{new Date(item.scheduledAt).toLocaleDateString()}</span></div><p className="mt-2 text-sm text-[#55738b]">{item.type} Inspection</p></li>)}
          </ul>
        </SectionCard>
      </section>
    </main>
  );
}
