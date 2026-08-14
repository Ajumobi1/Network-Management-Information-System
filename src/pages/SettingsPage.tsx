import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import { ShieldCheck, Users, Lock, History, Settings as SettingsIcon, WalletCards } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useCapitationSettings, useUpdateCapitationRate } from '../hooks/settings';

export default function SettingsPage() {
  const adminStats = [
    { label: 'System Users', value: '0', icon: <Users size={20} /> },
    { label: 'Security Roles', value: '0', icon: <Lock size={20} /> },
    { label: 'Audit Logs', value: '0', icon: <History size={20} /> },
  ];

  const tools = [
    { name: 'User Management', description: 'Create and manage administrative accounts and roles.', link: '/settings/users' },
    { name: 'Audit Viewer', description: 'Inspect system-wide activity logs and security events.', link: '/settings/audit' },
    { name: 'System Config', description: 'Manage global application settings and constants.', link: '#' },
    { name: 'Data Management', description: 'Tools for manual data correction and maintenance.', link: '#' },
  ];

  const { data: capitationSettings, isLoading: isLoadingCapitation, isError: isCapitationError } = useCapitationSettings();
  const updateCapitationRate = useUpdateCapitationRate();
  const [rate, setRate] = useState('750');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (capitationSettings) setRate(String(capitationSettings.rate));
  }, [capitationSettings]);

  const handleSaveRate = () => {
    const parsedRate = Number(rate);
    if (!Number.isFinite(parsedRate) || parsedRate < 0 || parsedRate > 1_000_000) {
      setValidationError('Enter a valid monthly rate between ₦0 and ₦1,000,000.');
      return;
    }
    setValidationError('');
    updateCapitationRate.mutate(parsedRate);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="System administration"
          description="Configure users, roles, notifications, and audit settings for the NMIS platform."
          actions={[{ label: 'Manage roles (Coming Soon)', disabled: true }]}
        />

        <div className="grid gap-6 md:grid-cols-3">
          {adminStats.map(stat => (
            <Card key={stat.label} className="flex items-center gap-4">
              <div className="rounded-2xl bg-brand-blue/10 p-3 text-brand-blue">
                {stat.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
              </div>
            </Card>
          ))}
        </div>

        <Card>
          <div className="mb-6 flex items-center gap-2 text-brand-blue">
            <WalletCards size={20} />
            <h2 className="text-lg font-semibold uppercase tracking-widest text-slate-900">Capitation Configuration</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <label htmlFor="capitation-rate" className="text-sm font-semibold text-slate-900">Monthly fee per enrollee</label>
              <p className="mt-1 text-sm text-slate-500">Facilities are paid this amount for each active enrollee for each reporting month. Changes apply to future analytics calculations and are recorded in the audit log.</p>
              <div className="mt-4 flex max-w-sm items-center gap-3">
                <span className="text-lg font-bold text-slate-500">₦</span>
                <input
                  id="capitation-rate"
                  type="number"
                  min="0"
                  max="1000000"
                  step="0.01"
                  value={rate}
                  onChange={event => setRate(event.target.value)}
                  disabled={isLoadingCapitation || updateCapitationRate.isPending}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base font-semibold text-slate-900 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 disabled:bg-slate-100"
                />
                <span className="shrink-0 text-sm text-slate-500">per enrollee / month</span>
              </div>
              {capitationSettings ? <p className="mt-2 text-xs text-slate-500">Current configured rate: ₦{capitationSettings.rate.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p> : null}
              {validationError ? <p className="mt-2 text-sm text-rose-700">{validationError}</p> : null}
              {isCapitationError ? <p className="mt-2 text-sm text-rose-700">The capitation settings contract is unavailable or you do not have permission to edit it.</p> : null}
              {updateCapitationRate.isError ? <p className="mt-2 text-sm text-rose-700">The capitation rate could not be saved. No change was applied.</p> : null}
              {updateCapitationRate.isSuccess ? <p className="mt-2 text-sm text-emerald-700">Capitation rate saved and dashboard calculations refreshed.</p> : null}
            </div>
            <Button onClick={handleSaveRate} disabled={isLoadingCapitation || updateCapitationRate.isPending || isCapitationError}>
              {updateCapitationRate.isPending ? 'Saving…' : 'Save capitation rate'}
            </Button>
          </div>
        </Card>

        <Card>
          <div className="mb-6 flex items-center gap-2 text-brand-blue">
            <ShieldCheck size={20} />
            <h2 className="text-lg font-semibold uppercase tracking-widest text-slate-900">Administrative Tools</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {tools.map(tool => (
              <div key={tool.name} className="group flex flex-col rounded-3xl border border-slate-200 bg-slate-50 p-5 transition-colors hover:border-brand-blue/30">
                <h3 className="font-semibold text-slate-900 transition-colors group-hover:text-brand-blue">{tool.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{tool.description}</p>
                <div className="mt-4 flex justify-end">
                  <Button variant="ghost" size="sm" className="gap-2" disabled={tool.link === '#'}>
                    Open <SettingsIcon size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </main>
  );
}
