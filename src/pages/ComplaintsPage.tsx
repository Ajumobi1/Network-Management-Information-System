import PageHeader from '../components/PageHeader';

function ComplaintsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="Provider complaints"
          description="Track and resolve provider issues with complaint workflows and escalation statuses."
          actions={[{ label: 'Review complaints' }]}
        />
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

        <div className="grid gap-6 lg:grid-cols-3">
          {[
            { label: 'Open complaints', value: '18' },
            { label: 'Resolved', value: '124' },
            { label: 'Escalated', value: '3' },
          ].map(item => (
            <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="mt-4 text-3xl font-semibold text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <p className="text-sm text-slate-500">Recent complaints</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Latest issues</h2>
          <div className="mt-6 space-y-4">
            {[
              { title: 'Late payment follow-up', provider: 'Sunvale Hospital', status: 'Open' },
              { title: 'Claim rejection complaint', provider: 'Atlas Pharmacy', status: 'Resolved' },
              { title: 'Inspection report delay', provider: 'Riverside Clinic', status: 'Escalated' },
            ].map(item => (
              <div key={item.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    item.status === 'Open' ? 'bg-amber-100 text-amber-700' : item.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-500">{item.provider}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </main>
  );
}

export default ComplaintsPage;
