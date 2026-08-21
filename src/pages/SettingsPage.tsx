import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader';
import { ShieldCheck, Users, Lock, History, Settings as SettingsIcon, WalletCards, AlertTriangle } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useCapitationSettings, useUpdateCapitationRate } from '../hooks/settings';
import { useDashboardIntelligence } from '../hooks/dashboard/dashboardHooks';
import ManagementAttentionPanel from '../components/dashboard/ManagementAttentionPanel';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../auth/authTypes';

function liveCalendarFilters() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1, sector: 'all' as const };
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const userRole = (session?.user?.role as UserRole) || 'network-officer';
  const isAdmin = userRole === 'super-admin';

  const adminStats = [
    { label: 'System Users', value: '4 Active', icon: <Users size={20} /> },
    { label: 'Security Roles', value: '2 Defined', icon: <Lock size={20} /> },
    { label: 'Audit Logs', value: 'Active', icon: <History size={20} /> },
  ];

  const tools = [
    { name: 'Inspection Templates', description: 'Configure facility-type-specific eligibility gates, checklist items, and scoring methods.', link: '/settings/inspection-templates', adminOnly: true },
    { name: 'User Management', description: 'Create and manage administrative accounts, control access levels, and suspend accounts.', link: '/admin/users', adminOnly: true },
    { name: 'Audit Viewer', description: 'Inspect system-wide activity logs, data modifications, and security events.', link: '/admin/audit', adminOnly: true },
    { name: 'System Config', description: 'Manage global application settings, constants, and branding parameters.', link: '#', adminOnly: true },
    { name: 'Data Management', description: 'Advanced tools for manual data correction, archiving, and maintenance.', link: '#', adminOnly: false },
  ];

  const { data: capitationSettings, isLoading: isLoadingCapitation, isError: isCapitationError } = useCapitationSettings();
  const updateCapitationRate = useUpdateCapitationRate();
  const managementQuery = useDashboardIntelligence(liveCalendarFilters());
  const [rate, setRate] = useState('750');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (capitationSettings) setRate(String(capitationSettings.rate));
  }, [capitationSettings]);

  const handleSaveRate = () => {
    if (!isAdmin) return;
    const parsedRate = Number(rate);
    if (!Number.isFinite(parsedRate) || parsedRate < 0 || parsedRate > 1_000_000) {
      setValidationError('Enter a valid monthly rate between ₦0 and ₦1,000,000.');
      return;
    }
    setValidationError('');
    updateCapitationRate.mutate(parsedRate);
  };

  if (!isAdmin) {
    return (
      <main className="nmis-page flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-full bg-status-errorSoft p-6 text-status-error">
          <AlertTriangle size={48} />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-brand-foreground">Administrative Access Restricted</h1>
        <p className="mt-2 max-w-md text-brand-muted">
          Your account is registered as a **Network Officer**. Operational access is granted, 
          but administrative configurations are reserved for **Super Admins**.
        </p>
        <Button className="mt-8" onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
      </main>
    );
  }

  return (
    <main className="nmis-page">
      <PageHeader
        eyebrow="Administration"
        title="System Settings"
        subtitle="Configure global application parameters, manage administrative identities, and monitor system governance."
      />

      <div className="grid gap-6 md:grid-cols-3">
        {adminStats.map(stat => (
          <Card key={stat.label} className="flex items-center gap-4">
            <div className="rounded-2xl bg-brand-blue/10 p-3 text-brand-blue">
              {stat.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-brand-muted">{stat.label}</p>
              <p className="text-2xl font-semibold text-brand-foreground">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="mb-6 flex items-center gap-2 text-brand-blue">
          <WalletCards size={20} />
          <h2 className="text-lg font-semibold uppercase tracking-widest text-brand-foreground">Capitation Configuration</h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <label htmlFor="capitation-rate" className="text-sm font-semibold text-brand-foreground">Monthly fee per enrollee</label>
            <p className="mt-1 text-sm text-brand-muted">Standard rate for capitation disbursement calculations. Changes are recorded in the audit log.</p>
            <div className="mt-4 flex max-w-sm items-center gap-3">
              <span className="text-lg font-bold text-brand-muted">₦</span>
              <input
                id="capitation-rate"
                type="number"
                min="0"
                max="1000000"
                step="0.01"
                value={rate}
                onChange={event => setRate(event.target.value)}
                disabled={isLoadingCapitation || updateCapitationRate.isPending}
                className="nmis-control h-11 text-base font-semibold"
              />
              <span className="shrink-0 text-sm text-brand-muted">per enrollee / month</span>
            </div>
            {capitationSettings ? <p className="mt-2 text-xs text-brand-muted">Current rate: ₦{capitationSettings.rate.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p> : null}
            {validationError ? <p className="mt-2 text-sm text-status-error">{validationError}</p> : null}
          </div>
          <Button onClick={handleSaveRate} disabled={isLoadingCapitation || updateCapitationRate.isPending || isCapitationError}>
            {updateCapitationRate.isPending ? 'Saving…' : 'Save Configuration'}
          </Button>
        </div>
      </Card>

      {managementQuery.data ? <ManagementAttentionPanel intelligence={managementQuery.data} /> : null}

      <Card>
        <div className="mb-6 flex items-center gap-2 text-brand-blue">
          <ShieldCheck size={20} />
          <h2 className="text-lg font-semibold uppercase tracking-widest text-brand-foreground">Governance Tools</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {tools.map(tool => (
            <div key={tool.name} className="group flex flex-col rounded-panel border border-brand-divider bg-brand-surface p-5 transition-all hover:border-brand-blue/30">
              <h3 className="font-semibold text-brand-foreground transition-colors group-hover:text-brand-blue">{tool.name}</h3>
              <p className="mt-1 text-sm text-brand-muted leading-relaxed">{tool.description}</p>
              <div className="mt-4 flex justify-end">
                <Button variant="ghost" size="sm" className="gap-2" disabled={tool.link === '#'} onClick={() => tool.link !== '#' && navigate(tool.link)}>
                  Open <SettingsIcon size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </main>
  );
}
