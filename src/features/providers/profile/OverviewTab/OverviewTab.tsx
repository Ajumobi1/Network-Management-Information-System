import { InfoGrid, ProviderTabProps } from '../ProfileTabShell';

export default function OverviewTab({ provider }: ProviderTabProps) {
  return <InfoGrid items={[['Provider Code', provider.providerCode], ['Status', provider.status], ['Category', provider.category], ['State', provider.state], ['LGA', provider.lga], ['Ownership', provider.ownership]]} />;
}
