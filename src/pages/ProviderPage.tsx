import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Upload } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import KpiCard from '../components/ui/KpiCard';
import ProviderFilters from '../features/providers/components/ProviderFilters';
import ProviderTable from '../features/providers/components/ProviderTable';
import ProviderRegistrationWizard from '../features/providers/registration/ProviderRegistrationWizard';
import { useProviderDirectory } from '../features/providers/hooks';
import { ProviderDirectoryFilters } from '../features/providers/types';
import { LoadingState, ErrorState } from '../components/ui/FeedbackStates';
import { SectionHeader } from '../components/ui/LayoutComponents';
import { isSecureContractError } from '../lib/security/secureContracts';

export default function ProviderPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
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

  const { data: providers = [], isLoading, isError, error, refetch } = useProviderDirectory({
    ...filters,
    page,
    pageSize,
  });

  const totalCount = (providers as any).totalCount ?? providers.length;

  const handleFilterChange = (newFilters: ProviderDirectoryFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to page 1 on filter change
  };

  const categories = useMemo(() => ['all', 'Hospital', 'Primary Health Centre (PHC)', 'Clinic', 'Diagnostic Centre', 'Pharmacy'], []);
  const ownerships = useMemo(() => ['all', 'Government', 'Private'], []);
  const lgas = useMemo(() => ['all', 'Akoko North-East', 'Akoko North-West', 'Akoko South-East', 'Akoko South-West', 'Akure North', 'Akure South', 'Ese Odo', 'Idanre', 'Ifedore', 'Ilaje', 'Ile Oluji/Okeigbo', 'Irele', 'Okitipupa', 'Ondo East', 'Ondo West', 'Ose', 'Owo'], []);

  const stats = useMemo(() => ({
    total: totalCount,
    active: providers.filter(p => p.status === 'active').length,
    pending: providers.filter(p => p.status === 'pending').length,
    risk: providers.filter(p => ['suspended', 'blacklisted', 'expired'].includes(p.status)).length,
  }), [totalCount, providers]);

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
          title="Providers"
          subtitle="The authoritative official Network Provider Register within NMIS. Search, filter, and inspect facility records and operational status."
          actions={
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" className="gap-2" onClick={() => navigate('/financial/upload?type=provider-network')}>
                <Upload size={16} /> Import Directory
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

        <ProviderFilters
          filters={filters}
          categories={categories}
          ownerships={ownerships}
          lgas={lgas}
          onChange={handleFilterChange}
        />

        {isLoading ? (
          <LoadingState title="Loading provider directory register..." />
        ) : (
          <ProviderTable
            providers={providers}
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={setPage}
          />
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
            The provider register is synchronized with secure Supabase RPC contracts. All facility records maintain strict audit attribution and least-privilege access control.
          </p>
        </Card>
      </div>
    </main>
  );
}
