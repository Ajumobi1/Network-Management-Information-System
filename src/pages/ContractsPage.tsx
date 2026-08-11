const contracts = [
  { partner: 'Sunvale Hospital', type: 'Full service', expiry: 'Nov 2026', status: 'Active' },
  { partner: 'Atlas Pharmacy', type: 'Supply', expiry: 'Sep 2025', status: 'Renewal' },
  { partner: 'Riverside Clinic', type: 'Clinical', expiry: 'Dec 2026', status: 'Active' },
  { partner: 'Bright Health Center', type: 'Data sharing', expiry: 'Aug 2025', status: 'Expired' },
];

function ContractsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium text-slate-500">Contract portfolio</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">Contract management</h1>
            </div>
            <button className="rounded-2xl bg-brand-blue px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-navy">
              Create contract
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            { label: 'Active', value: '144', tone: 'bg-emerald-50 text-emerald-700' },
            { label: 'Renewal due', value: '12', tone: 'bg-amber-50 text-amber-700' },
            { label: 'Expired', value: '8', tone: 'bg-rose-50 text-rose-700' },
          ].map(card => (
            <div key={card.label} className={`rounded-3xl border border-slate-200 p-6 shadow-soft ${card.tone}`}>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-600">{card.label}</p>
              <p className="mt-4 text-4xl font-semibold">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-500">Recent contract activity</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Current contracts</h2>
            </div>
            <button className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300">
              View all
            </button>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Provider</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Contract type</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Expiry</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {contracts.map(item => (
                  <tr key={item.partner} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{item.partner}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.type}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.expiry}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-3 py-1 font-semibold ${
                        item.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : item.status === 'Renewal'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

export default ContractsPage;
