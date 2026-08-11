import PageHeader from '../components/PageHeader';

function SettingsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="System administration"
          description="Configure users, roles, notifications, and audit settings for the NMIS platform."
          actions={[{ label: 'Manage roles' }]}
        />
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

        <div className="grid gap-6 lg:grid-cols-3">
          {[
            { label: 'Users', value: '32' },
            { label: 'Roles', value: '6' },
            { label: 'Audit logs', value: '1,248' },
          ].map(item => (
            <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="mt-4 text-3xl font-semibold text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <p className="text-sm text-slate-500">Administration tools</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Platform configuration</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              'Manage user permissions',
              'Configure notification channels',
              'Review audit trail',
              'Set system preferences',
            ].map(item => (
              <div key={item} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="font-semibold text-slate-900">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </main>
  );
}

export default SettingsPage;
