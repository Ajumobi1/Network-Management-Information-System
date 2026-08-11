import PageHeader from '../components/PageHeader';

function CommunicationPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="Communication hub"
          description="Send provider messages, manage notifications, and track communication threads. [Planned Functionality]" 
          actions={[{ label: 'New message (Coming Soon)', disabled: true }]}
        />
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

        <div className="grid gap-6 lg:grid-cols-3">
          {[
            { label: 'Messages', value: '112' },
            { label: 'Open threads', value: '26' },
            { label: 'Urgent alerts', value: '7' },
          ].map(item => (
            <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="mt-4 text-3xl font-semibold text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <p className="text-sm text-slate-500">Recent communication</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Latest provider messages</h2>
          <div className="mt-6 space-y-4">
            {[
              { title: 'Credentialing documents needed', provider: 'Atlas Pharmacy', time: '2 hrs ago' },
              { title: 'Inspection schedule update', provider: 'Sunvale Hospital', time: '5 hrs ago' },
              { title: 'Contract renewal reminder', provider: 'Riverside Clinic', time: '1 day ago' },
            ].map(message => (
              <div key={message.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">{message.title}</p>
                <p className="mt-2 text-sm text-slate-500">{message.provider} · {message.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </main>
  );
}

export default CommunicationPage;
