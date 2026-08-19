import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Mail, MapPin, MessageSquare, ShieldCheck, ChevronRight } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Card from '../../../../components/ui/Card';
import { useProviderProfile } from '../../hooks';
import ProviderStatusBadge from '../../components/ProviderStatusBadge';
import { SectionHeader } from '../../../../components/ui/LayoutComponents';
import { LoadingState, ErrorState } from '../../../../components/ui/FeedbackStates';
import { isSecureContractError } from '../../../../lib/security/secureContracts';
import ProviderOperationalEditor from './ProviderOperationalEditor';
import { getProviderCategoryLabel } from '../../../../constants/providerNetwork';

import AuditLogTab from '../AuditLogTab';
import CapitationTab from '../CapitationTab';
import CommunicationTab from '../CommunicationTab/CommunicationTab';
import ComplaintsTab from '../ComplaintsTab';
import ContactsTab from '../ContactsTab';
import ContractsTab from '../ContractsTab';
import CredentialingTab from '../CredentialingTab';
import DocumentsTab from '../DocumentsTab';
import FacilityTab from '../FacilityTab';
import FinancialTab from '../FinancialTab';
import EnrolmentTab from '../EnrolmentTab';
import InspectionsTab from '../InspectionsTab';
import OverviewTab from '../OverviewTab';
import PerformanceTab from '../PerformanceTab';
import TimelineTab from '../TimelineTab';

const tabs = [
  'Overview',
  'Facility Details',
  'Contacts',
  'Credentialing',
  'Contracts',
  'Capitation',
  'Inspections',
  'Complaints',
  'Performance',
  'Claims/FFS',
  'Enrolment / Population',
  'Communication',
  'Documents',
  'Audit Log',
  'Timeline',
] as const;

type ProviderProfileTab = (typeof tabs)[number];

export default function ProviderProfile({ providerId }: { providerId: string }) {
  const { data: provider, isLoading, isError, error, refetch } = useProviderProfile(providerId);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') as ProviderProfileTab | null;
  const [activeTab, setActiveTab] = useState<ProviderProfileTab>(
    initialTab && tabs.includes(initialTab) ? initialTab : 'Overview',
  );

  const handleTabChange = (tab: ProviderProfileTab) => {
    setActiveTab(tab);
    const nextParams = new URLSearchParams(searchParams);
    if (tab === 'Overview') nextParams.delete('tab');
    else nextParams.set('tab', tab);
    setSearchParams(nextParams, { replace: true });
  };

  if (isLoading) return <LoadingState title="Loading provider profile..." />;
  if (isError || !provider) return <ErrorState title={isSecureContractError(error) ? 'Secure provider profile unavailable' : 'Profile not found'} description={isSecureContractError(error) ? 'No provider profile was loaded because the approved operational-profile contract is unavailable.' : undefined} action={{ label: 'Retry', onClick: () => refetch() }} />;

  const tabContent: Record<ProviderProfileTab, JSX.Element> = {
    Overview: <OverviewTab provider={provider} />,
    'Facility Details': <FacilityTab provider={provider} />,
    Contacts: <ContactsTab provider={provider} />,
    Credentialing: <CredentialingTab provider={provider} />,
    Contracts: <ContractsTab provider={provider} />,
    Capitation: <CapitationTab provider={provider} />,
    Inspections: <InspectionsTab provider={provider} />,
    Complaints: <ComplaintsTab provider={provider} />,
    Performance: <PerformanceTab provider={provider} />,
    'Claims/FFS': <FinancialTab provider={provider} />,
    'Enrolment / Population': <EnrolmentTab provider={provider} />,
    Communication: <CommunicationTab provider={provider} />,
    Documents: <DocumentsTab provider={provider} />,
    'Audit Log': <AuditLogTab provider={provider} />,
    Timeline: <TimelineTab provider={provider} />,
  };

  return (
    <Card className="p-0 overflow-hidden">
      {/* Profile Header */}
      <div className="bg-brand-surface/50 border-b border-brand-divider p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand-blue shadow-sm">
              <ShieldCheck size={32} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-muted">
                <span className="font-mono text-brand-blue bg-brand-blue/5 px-2 py-0.5 rounded-md">
                  {provider.registerPosition ? String(provider.registerPosition).padStart(3, '0') : provider.providerCode}
                </span>
                <span className="opacity-30">|</span>
                <span>{getProviderCategoryLabel(provider.category)}</span>
              </div>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-brand-foreground sm:text-3xl">
                {provider.providerName}
              </h2>
              <p className="mt-2 flex items-center gap-2 text-sm font-medium text-brand-secondary">
                <MapPin className="h-4 w-4 text-brand-subtle" />
                {provider.lga}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" className="gap-2" size="md" disabled title="Provider contact data is not available through this secure profile contract.">
              <Mail size={16} /> Email unavailable
            </Button>
            <Button variant="secondary" className="gap-2" size="md" disabled title="Provider contact data is not available through this secure profile contract.">
              <MessageSquare size={16} /> SMS unavailable
            </Button>
            <div className="h-8 w-px bg-brand-divider mx-1 hidden sm:block" />
            <ProviderStatusBadge status={provider.status} />
          </div>
        </div>
      </div>

      <div className="border-b border-brand-divider bg-white px-4 py-3 sm:px-8 sm:py-4">
        <ProviderOperationalEditor provider={provider} />
      </div>

      {/* Navigation Tabs */}
      <div className="nmis-tab-scroll border-b border-brand-divider bg-white px-4 sm:px-6">
        <nav className="flex min-w-max gap-5 sm:gap-8" aria-label="Profile sections">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`relative py-3 text-sm font-bold transition-colors sm:py-4 ${
                activeTab === tab
                  ? 'text-brand-blue'
                  : 'text-brand-muted hover:text-brand-secondary'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 h-0.5 w-full bg-brand-blue" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white p-4 sm:p-8">
        <div className="mx-auto max-w-5xl animate-in fade-in slide-in-from-bottom-2 duration-300">
          {tabContent[activeTab]}
        </div>
      </div>
    </Card>
  );
}
