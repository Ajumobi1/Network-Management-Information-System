import PageHeader from '../components/PageHeader';

const reports = [
  { title: 'Provider performance', description: 'Track inspection trends and compliance results.', action: 'Open report' },
  { title: 'Network capacity', description: 'Analyze provider coverage and utilization.', action: 'Open report' },
  { title: 'Contract renewals', description: 'View upcoming contract expiries and follow-up tasks.', action: 'Open report' },
];

function ReportsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="Analytics and exports"
          description="Generate operational, financial, and provider reports with export-ready output for management review. [Planned Functionality]"
          actions={[{ label: 'Create report (Coming Soon)', disabled: true }]}
        />

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {reports.map(report => (
            <div key={report.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Report</p>
              <h2 className="mt-4 text-xl font-semibold text-slate-900">{report.title}</h2>
              <p className="mt-3 text-sm text-slate-600">{report.description}</p>
              <button disabled className="mt-6 inline-flex rounded-2xl bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-400 cursor-not-allowed">
                {report.action} (Coming Soon)
              </button>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-500">Quick exports</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Saved report templates</h2>
            </div>
            <button className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300">
              Manage templates
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {['Monthly compliance summary', 'Inspection completion chart', 'Provider onboarding trend', 'Credentialing status overview'].map(item => (
              <div key={item} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="font-semibold text-slate-900">{item}</p>
                <p className="mt-2 text-sm text-slate-600">Use this report to keep stakeholders updated on network performance.</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

export default ReportsPage;
