import { useState } from 'react';
import { Mail, MapPin, MessageSquare } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Card from '../../../../components/ui/Card';
import { useProviderProfile } from '../../hooks';
import ProviderStatusBadge from '../../components/ProviderStatusBadge';
import AuditLogTab from '../AuditLogTab';
import CapitationTab from '../CapitationTab';
import ComplaintsTab from '../ComplaintsTab';
import ContactsTab from '../ContactsTab';
import ContractsTab from '../ContractsTab';
import CredentialingTab from '../CredentialingTab';
import DocumentsTab from '../DocumentsTab';
import FacilityTab from '../FacilityTab';
import FinancialTab from '../FinancialTab';
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
  'Financials',
  'Documents',
  'Audit Log',
  'Timeline',
] as const;

type ProviderProfileTab = (typeof tabs)[number];

export default function ProviderProfile({ providerId }: { providerId: string }) {
  const { data: provider } = useProviderProfile(providerId);
  const [activeTab, setActiveTab] = useState<ProviderProfileTab>('Overview');

  if (!provider) return null;

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
    Financials: <FinancialTab provider={provider} />,
    Documents: <DocumentsTab provider={provider} />,
    'Audit Log': <AuditLogTab provider={provider} />,
    Timeline: <TimelineTab provider={provider} />,
  };

  return (
    <Card>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Provider profile</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">{provider.providerName}</h2>
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-600"><MapPin className="h-4 w-4" /> {provider.address}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" className="gap-2"><Mail className="h-4 w-4" /> Email</Button>
          <Button variant="secondary" className="gap-2"><MessageSquare className="h-4 w-4" /> SMS</Button>
          <ProviderStatusBadge status={provider.status} />
        </div>
      </div>
      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${activeTab === tab ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-700'}`}>{tab}</button>
        ))}
      </div>
      <div className="mt-6">{tabContent[activeTab]}</div>
    </Card>
  );
}
