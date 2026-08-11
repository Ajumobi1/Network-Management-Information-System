import PageHeader from '../components/PageHeader';
import { ChartBarIcon, ClockIcon, FolderOpenIcon, ShieldCheckIcon, SparklesIcon, UsersIcon } from '@heroicons/react/24/outline';

const metrics = [
  { label: 'Active Providers', value: '1,274', icon: UsersIcon, trend: '+4.2%' },
  { label: 'Inspections due', value: '28', icon: ClockIcon, trend: '-3.4%' },
  { label: 'Pending approvals', value: '16', icon: ShieldCheckIcon, trend: '+9.6%' },
  { label: 'Capitation paid', value: '₦458.7M', icon: FolderOpenIcon, trend: '+12.1%' },
];

function MetricCard({ label, value, trend, icon: Icon }: { label: string; value: string; trend: string; icon: typeof ChartBarIcon }) {
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
      <p className="mt-4 text-sm text-emerald-600">{trend} vs last month</p>
    </div>
  );
}

function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <PageHeader
          title="Network management overview"
          description="Track provider performance, capitation status, inspections, and network activity from a single dashboard."
          actions={[
            { label: 'Export report', variant: 'secondary' },
            { label: 'New provider' },
          ]}
        />

        <section className="grid gap-6 xl:grid-cols-[1.75fr_1fr]">
          <div className="grid gap-6 lg:grid-cols-2">
            {metrics.map(metric => (
              <MetricCard key={metric.label} label={metric.label} value={metric.value} trend={metric.trend} icon={metric.icon} />
            ))}
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Provider distribution</p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">Network coverage map</h2>
                </div>
                <button className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">View details</button>
              </div>
              <div className="mt-6 h-72 rounded-3xl bg-slate-100" />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
                <p className="text-sm font-medium text-slate-500">Active cases</p>
                <p className="mt-4 text-3xl font-semibold text-slate-900">128</p>
                <p className="mt-3 text-sm text-slate-500">Cases requiring action this week.</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
                <p className="text-sm font-medium text-slate-500">Inspection score</p>
                <p className="mt-4 text-3xl font-semibold text-slate-900">92%</p>
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
              <button className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">See all</button>
            </div>
            <div className="mt-6 space-y-4">
              {['New provider registration submitted', 'Inspection report approved', 'Capitation batch finalized', 'Credential renewal reminder sent'].map((item, index) => (
                <div key={index} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-sm text-slate-700">{item}</p>
                  <p className="mt-2 text-xs text-slate-500">{index === 0 ? '3 min ago' : index === 1 ? '1 hr ago' : index === 2 ? '2 hrs ago' : 'Yesterday'}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <p className="text-sm font-medium text-slate-500">Upcoming events</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Inspection schedule</h2>
            <ul className="mt-6 space-y-4">
              {[
                { title: 'Sunvale Hospital inspection', date: 'Aug 12', status: 'On site' },
                { title: 'Atlas Pharmacy compliance review', date: 'Aug 14', status: 'Scheduled' },
                { title: 'Lakeside Lab equipment audit', date: 'Aug 18', status: 'Pending' },
              ].map((item, index) => (
                <li key={index} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <span className="rounded-full bg-slate-200 px-3 py-1 text-xs text-slate-700">{item.date}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{item.status}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}

export default DashboardPage;
