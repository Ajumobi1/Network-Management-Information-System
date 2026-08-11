import PageHeader from '../components/PageHeader';

function CapitationPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="Capitation workflow"
          description="Review capitation balances, pending batches, and payment status for network providers."
          actions={[{ label: 'Process payments' }]}
        />
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

        <div className="grid gap-6 lg:grid-cols-3">
          {[
            { label: 'Total capitation', value: '₦458.7M' },
            { label: 'Paid this month', value: '₦138.2M' },
            { label: 'Pending', value: '₦20.4M' },
          ].map(item => (
            <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="mt-4 text-3xl font-semibold text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <p className="text-sm font-medium text-slate-500">Payment status</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Upcoming capitation batches</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              { label: 'Next payout', value: 'Sep 5, 2026' },
              { label: 'Review queue', value: '10 batches' },
            ].map(item => (
              <div key={item.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </main>
  );
}

export default CapitationPage;
