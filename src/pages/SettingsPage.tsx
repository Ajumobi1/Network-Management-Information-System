import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader';
import { 
  ShieldCheck, Users, Lock, History, Settings as SettingsIcon, 
  WalletCards, AlertTriangle, Database, Globe, Bell, ChevronRight,
  ShieldAlert, ExternalLink, HardDrive
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useCapitationSettings, useUpdateCapitationRate } from '../hooks/settings';
import { useDashboardIntelligence } from '../hooks/dashboard/dashboardHooks';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../auth/authTypes';

function liveCalendarFilters() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1, sector: 'all' as const };
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);
  const userRole = (session?.user?.role as UserRole) || 'network-officer';
  const isAdmin = userRole === 'super-admin';

  const adminSections = [
    {
      title: 'Identity & Access',
      description: 'Manage user accounts, roles, and security policies.',
      icon: Users,
      link: '/admin/users',
      color: 'text-brand-blue',
      bg: 'bg-brand-blue/10'
    },
    {
      title: 'System Configuration',
      description: 'Global portal parameters, branding, and regional settings.',
      icon: SettingsIcon,
      link: '/admin/config',
      color: 'text-brand-orange',
      bg: 'bg-brand-orange/10'
    },
    {
      title: 'Data Management',
      description: 'Database health, snapshots, and integrity tools.',
      icon: Database,
      link: '/admin/data',
      color: 'text-status-success',
      bg: 'bg-status-successSoft'
    },
    {
      title: 'Security Audit Logs',
      description: 'Immutable record of all administrative and sensitive actions.',
      icon: History,
      link: '/admin/audit',
      color: 'text-brand-navy',
      bg: 'bg-brand-soft'
    }
  ];

  const generalSections = [
    {
      title: 'Notification Preferences',
      description: 'Configure how and when you receive system alerts.',
      icon: Bell,
      link: '/settings/notifications',
      disabled: false
    },
    {
      title: 'Security & Password',
      description: 'Update your credentials and enable two-factor authentication.',
      icon: Lock,
      link: '/settings/security',
      disabled: false
    },
    {
      title: 'Regional & Localization',
      description: 'Timezone, currency display, and language settings.',
      icon: Globe,
      link: '/settings/regional',
      disabled: false
    }
  ];

  const { data: capitationSettings, isLoading: isLoadingCapitation, isError: isCapitationError } = useCapitationSettings();
  const updateCapitationRate = useUpdateCapitationRate();
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
        eyebrow="Portal Control"
        title="System Settings"
        subtitle="Manage your personal preferences and global portal configurations."
      />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-brand-blue">
              <ShieldCheck size={20} />
              <h2 className="text-sm font-black uppercase tracking-widest">Administrative Controls</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {adminSections.map((section, idx) => (
                <div 
                  key={idx} 
                  className="nmis-card nmis-card-interactive group cursor-pointer p-5"
                  onClick={() => navigate(section.link)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-2xl ${section.bg} ${section.color} transition-transform group-hover:scale-110`}>
                      <section.icon size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-black text-brand-foreground">{section.title}</h3>
                        <ChevronRight size={16} className="text-brand-subtle group-hover:text-brand-blue transition-colors" />
                      </div>
                      <p className="mt-1 text-xs font-medium text-brand-muted leading-relaxed">
                        {section.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <Card>
            <div className="mb-6 flex items-center gap-2 text-brand-blue">
              <WalletCards size={20} className="text-brand-orange" />
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

          <section className="space-y-4">
            <div className="flex items-center gap-2 text-brand-secondary">
              <SettingsIcon size={20} />
              <h2 className="text-sm font-black uppercase tracking-widest">General Preferences</h2>
            </div>
            <div className="space-y-3">
              {generalSections.map((section, idx) => (
                <Card 
                  key={idx} 
                  className={`flex items-center justify-between p-4 ${section.disabled ? 'opacity-60 grayscale' : 'nmis-card-interactive cursor-pointer'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-xl bg-brand-soft text-brand-muted">
                      <section.icon size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-brand-foreground">{section.title}</h3>
                      <p className="text-[11px] text-brand-muted">{section.description}</p>
                    </div>
                  </div>
                  {section.disabled ? (
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-subtle bg-brand-soft px-2 py-1 rounded-md">Coming Soon</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-status-success bg-status-successSoft px-2 py-1 rounded-md">ACTIVE</span>
                      <ChevronRight size={16} className="text-brand-subtle" />
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <Card className="bg-brand-navy text-white border-none overflow-hidden relative">
            <div className="relative z-10">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/60 mb-4">Portal Integrity</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-status-success animate-pulse" />
                  <span className="text-xs font-bold">System Online & Secure</span>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <p className="text-[10px] text-white/50 uppercase tracking-widest font-black">Portal Version</p>
                  <p className="text-lg font-black mt-1">v2.4.0-authoritative</p>
                </div>
                <Button variant="secondary" onClick={() => setShowReleaseNotes(true)} className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white gap-2">
                  <HardDrive size={16} /> View Release Notes
                </Button>
              </div>
            </div>
            <div className="absolute -right-12 -bottom-12 opacity-10 rotate-12">
              <ShieldCheck size={240} />
            </div>
          </Card>

          <Card className="border-brand-orange/20 bg-brand-orange/5">
            <div className="flex items-center gap-2 text-brand-orange mb-3">
              <ShieldAlert size={18} />
              <h3 className="text-[10px] font-black uppercase tracking-widest">Security Protocol</h3>
            </div>
            <p className="text-xs font-bold text-brand-secondary leading-relaxed">
              Administrative actions are recorded in the immutable **Security Audit Log**. Multi-factor authentication is required for all Super Admin accounts.
            </p>
            <div className="mt-4 pt-4 border-t border-brand-orange/10">
              <a href="#" className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-brand-orange hover:underline">
                Read Security Whitepaper <ExternalLink size={10} />
              </a>
            </div>
          </Card>
        </div>
      </div>
      {showReleaseNotes ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="release-notes-title">
          <Card className="w-full max-w-2xl shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-brand-divider pb-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-blue">Portal release</p>
                <h2 id="release-notes-title" className="mt-1 text-2xl font-black text-brand-foreground">v2.4.0-authoritative</h2>
                <p className="mt-1 text-sm text-brand-muted">Production release notes</p>
              </div>
              <button type="button" onClick={() => setShowReleaseNotes(false)} className="rounded-lg px-3 py-2 text-sm font-bold text-brand-muted hover:bg-brand-soft hover:text-brand-foreground">Close</button>
            </div>
            <div className="mt-5 space-y-4 text-sm text-brand-secondary">
              <p>This release strengthens operational reliability and protects sensitive records through named secure database contracts.</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>Enrolment CSV export now retrieves every matching record with pagination validation and retry handling.</li>
                <li>Reporting periods are ordered newest-first so the register selects the latest available month.</li>
                <li>Security audit logs and administrator snapshot manifests use protected, role-checked contracts.</li>
                <li>July Phone Backfill has been permanently removed from the portal.</li>
                <li>Live data and duplicate-check failures are surfaced instead of being represented as empty or safe results.</li>
              </ul>
            </div>
            <div className="mt-6 flex justify-end border-t border-brand-divider pt-4">
              <Button variant="secondary" onClick={() => setShowReleaseNotes(false)}>Done</Button>
            </div>
          </Card>
        </div>
      ) : null}
    </main>
  );
}
