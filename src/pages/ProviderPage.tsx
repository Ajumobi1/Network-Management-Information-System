import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Upload, Filter, RotateCcw } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import KpiCard from '../components/ui/KpiCard';
import ProviderFilters from '../features/providers/components/ProviderFilters';
import ProviderTable from '../features/providers/components/ProviderTable';
import ProviderGrid from '../features/providers/components/ProviderGrid';
import ProviderRegistrationWizard from '../features/providers/registration/ProviderRegistrationWizard';
import { LayoutGrid, List } from 'lucide-react';
import ProviderProfile from '../features/providers/profile/ProviderProfile';
import { useProviderDirectory } from '../features/providers/hooks';
import { ProviderDirectoryFilters } from '../features/providers/types';
import { LoadingState, ErrorState } from '../components/ui/FeedbackStates';
import { SectionHeader } from '../components/ui/LayoutComponents';
import { isSecureContractError } from '../lib/security/secureContracts';

export default function ProviderPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [filters, setFilters] = useState<ProviderDirectoryFilters>({
    search: '',
    status: 'all',
    contractStatus: 'all',
    credentialStatus: 'all',
    inspectionStatus: 'all',
    capitationStatus: 'all',
    lga: 'all',
    category: 'all',
    subcategory: 'all',
    ownership: 'all',
  });

  const { data: providers = [], isLoading, isError, error, refetch } = useProviderDirectory(filters);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);

  const categories = useMemo(() => ['all', ...new Set(providers.map(p => p.category))].sort(), [providers]);
  const ownerships = useMemo(() => ['all', ...new Set(providers.map(p => p.ownership))].sort(), [providers]);

  const stats = useMemo(() => ({
    total: providers.length,
    active: providers.filter(p => p.status === 'active').length,
    pending: providers.filter(p => p.status === 'pending').length,
    risk: providers.filter(p => ['suspended', 'blacklisted', 'expired'].includes(p.status)).length,
  }), [providers]);

  if (isError) {
    const secure = isSecureContractError(error);
    return (
      <main className="nmis-page">
        <ErrorState
          title={secure ? 'Secure provider access unavailable' : 'Unable to load Provider Directory'}
          description={secure ? 'No provider records were loaded. This screen requires the approved field-minimized provider directory contract.' : 'We encountered an issue while fetching the provider records. Please check your network connection or repository configuration.'}
          action={{ label: secure ? 'Retry secure contract' : 'Retry Fetch', onClick: () => refetch() }}
        />
      </main>
    );
  }

  return (
    <main className="nmis-page">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Provider Network"
          title="Provider Directory"
          subtitle="The authoritative registry of healthcare facilities within the NMIS network. Manage onboarding, compliance, and operational status."
          actions={
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" className="gap-2" onClick={() => navigate('/financial/upload?type=provider-network')}>
                <Upload size={16} /> Import
              </Button>
              <Button to="/provider-registration" className="gap-2">
                <UserPlus size={16} /> Register Provider
              </Button>
            </div>
          }
        />

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard title="Total providers" value={stats.total.toLocaleString()} subtitle="Registered in network" tone="primary" />
          <KpiCard title="Active" value={stats.active.toLocaleString()} subtitle="Operational facilities" tone="success" />
          <KpiCard title="Pending review" value={stats.pending.toLocaleString()} subtitle="Awaiting verification" tone="warning" />
          <KpiCard title="Risk flagged" value={stats.risk.toLocaleString()} subtitle="Suspended or expired" tone="danger" />
        </section>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="flex-1">
            <ProviderFilters
              filters={filters}
              categories={categories}
              ownerships={ownerships}
              onChange={setFilters}
            />
          </div>
          
          <div className="flex shrink-0 items-center gap-1 rounded-2xl bg-slate-100 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                viewMode === 'grid' ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Profile View"
            >
              <LayoutGrid size={20} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                viewMode === 'table' ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Table View"
            >
              <List size={20} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <LoadingState title="Loading provider directory..." />
        ) : viewMode === 'grid' ? (
          <ProviderGrid providers={providers} onSelect={setSelectedProviderId} />
        ) : (
          <ProviderTable providers={providers} onSelect={setSelectedProviderId} />
        )}

        {selectedProviderId && (
          <section className="mt-12">
            <ProviderProfile providerId={selectedProviderId} />
          </section>
        )}

        <ProviderRegistrationWizard />

        <Card className="bg-brand-soft/30 border-brand-blue/10">
          <SectionHeader
            title="Operational Extensions"
            subtitle="Prepared integration points for network management automation."
            actions={
              <div className="flex gap-2">
                <Button variant="secondary" size="sm">Export CSV</Button>
                <Button variant="secondary" size="sm">Export PDF</Button>
                <Button size="sm" className="gap-2"><UserPlus size={14} /> Invite Officer</Button>
              </div>
            }
          />
          <p className="mt-4 text-sm text-brand-secondary leading-relaxed">
            The provider directory is prepared for Leaflet/Google Maps integration. Communication channels (Email, SMS) are represented through service-driven profile data for future operational deployment.
          </p>
        </Card>
      </div>
    </main>
  );
}
