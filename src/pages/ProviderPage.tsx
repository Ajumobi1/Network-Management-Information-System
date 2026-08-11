import { useMemo, useState } from 'react';
import { UserPlus } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ProviderFilters from '../features/providers/components/ProviderFilters';
import ProviderTable from '../features/providers/components/ProviderTable';
import ProviderRegistrationWizard from '../features/providers/registration/ProviderRegistrationWizard';
import ProviderProfile from '../features/providers/profile/ProviderProfile';
import { useProviderDirectory } from '../features/providers/hooks';
import { ProviderDirectoryFilters } from '../features/providers/types';

export default function ProviderPage() {
  const [filters, setFilters] = useState<ProviderDirectoryFilters>({ search: '', status: 'all', state: 'all', category: 'all' });
  const { data: providers = [], isLoading } = useProviderDirectory(filters);
  const [selectedProviderId, setSelectedProviderId] = useState('prov-1');
  const states = useMemo(() => ['all', ...new Set(providers.map(provider => provider.state))], [providers]);
  const categories = useMemo(() => ['all', ...new Set(providers.map(provider => provider.category))], [providers]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="Provider Management"
          description="Manage the complete provider lifecycle from onboarding and documents to contracts, inspections, capitation, communication, and performance."
          actions={[{ label: 'Import providers', variant: 'secondary' }, { label: 'Register provider' }]}
        />

        <div className="grid gap-4 md:grid-cols-4">
          {[
            ['Total providers', providers.length],
            ['Active', providers.filter(provider => provider.status === 'active').length],
            ['Pending review', providers.filter(provider => provider.status === 'pending').length],
            ['Risk flagged', providers.filter(provider => ['suspended', 'blacklisted', 'expired'].includes(provider.status)).length],
          ].map(([label, value]) => (
            <Card key={label}>
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
            </Card>
          ))}
        </div>

        <ProviderFilters filters={filters} states={states} categories={categories} onChange={setFilters} />
        {isLoading ? <Card>Loading providers...</Card> : <ProviderTable providers={providers} onSelect={setSelectedProviderId} />}
        <ProviderRegistrationWizard />
        <ProviderProfile providerId={selectedProviderId} />

        <Card>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Map and communication</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Prepared extension points</h2>
              <p className="mt-2 text-sm text-slate-600">Map placeholder is ready for Leaflet or Google Maps. Email, SMS, notifications, and communication history are represented through service-driven profile data.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary">CSV</Button>
              <Button variant="secondary">Excel</Button>
              <Button variant="secondary">PDF</Button>
              <Button className="gap-2"><UserPlus className="h-4 w-4" /> Invite</Button>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
