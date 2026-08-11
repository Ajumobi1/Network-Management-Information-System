const inspections = [
  { facility: 'Sunvale Hospital', type: 'Clinical', date: 'Aug 12', score: '94%', status: 'On site' },
  { facility: 'Atlas Pharmacy', type: 'Compliance', date: 'Aug 14', score: '88%', status: 'Scheduled' },
  { facility: 'Riverside Clinic', type: 'Safety', date: 'Aug 18', score: 'Pending', status: 'Pending' },
  { facility: 'Bright Health Center', type: 'Licensing', date: 'Aug 21', score: '91%', status: 'Scheduled' },
];

function InspectionsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium text-slate-500">Inspection Management</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">Inspection rounds</h1>
            </div>
            <button className="rounded-2xl bg-brand-blue px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-navy">
              Schedule inspection
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            { label: 'Due this week', value: '12', tone: 'bg-slate-50 text-slate-900' },
            { label: 'Completed', value: '84', tone: 'bg-emerald-50 text-emerald-700' },
            { label: 'Needs follow-up', value: '5', tone: 'bg-amber-50 text-amber-700' },
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
              <p className="text-sm text-slate-500">Upcoming inspections</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Inspection schedule</h2>
            </div>
            <button className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300">
              Export schedule
            </button>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Facility</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Type</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Date</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Score</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {inspections.map(item => (
                  <tr key={item.facility} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{item.facility}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.type}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.date}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.score}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-3 py-1 font-semibold ${
                        item.status === 'Scheduled'
                          ? 'bg-amber-100 text-amber-700'
                          : item.status === 'On site'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-700'
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

export default InspectionsPage;
