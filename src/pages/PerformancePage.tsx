import PageHeader from '../components/PageHeader';

function PerformancePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="Network performance overview"
          description="Monitor provider performance metrics and identify opportunities for operational improvement."
          actions={[{ label: 'View analytics' }]}
        />
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

        <div className="grid gap-6 lg:grid-cols-3">
          {[
            { label: 'Average score', value: '91%' },
            { label: 'Providers above target', value: '74%' },
            { label: 'Underperforming', value: '8%' },
          ].map(stat => (
            <div key={stat.label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className="mt-4 text-3xl font-semibold text-slate-900">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <p className="text-sm text-slate-500">Performance highlights</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Top provider performers</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              'Sunvale Hospital – 96% compliance',
              'Bright Health Center – 94% service quality',
              'Riverside Clinic – 92% inspection score',
              'Atlas Pharmacy – 90% turnaround time',
            ].map(item => (
              <div key={item} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </main>
  );
}

export default PerformancePage;
