import PageHeader from '../components/PageHeader';

function CredentialingPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="Provider credentialing workflow"
          description="Track provider credentialing requests, application status, and documentation reviews in one place."
          actions={[{ label: 'Start verification' }]}
        />

        <div className="grid gap-6 lg:grid-cols-3">
          {[
            { label: 'Applications', value: '42' },
            { label: 'Under review', value: '14' },
            { label: 'Approved', value: '128' },
          ].map(item => (
            <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="mt-4 text-3xl font-semibold text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-500">Pending credential reviews</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Next actions</h2>
            </div>
            <button className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300">
              View tasks
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              'Verify provider documents',
              'Complete site visit authorization',
              'Validate provider credentials',
              'Approve credentialing package',
            ].map(task => (
              <div key={task} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="font-semibold text-slate-900">{task}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

export default CredentialingPage;
