import { InfoGrid, ProviderTabProps } from '../ProfileTabShell';
import { getProviderCategoryLabel } from '../../../../constants/providerNetwork';

export default function OverviewTab({ provider }: ProviderTabProps) {
  return <InfoGrid items={[['Provider Code', provider.providerCode], ['Status', provider.status], ['Category', getProviderCategoryLabel(provider.category)], ['LGA', provider.lga], ['Ownership', provider.ownership]]} />;
}
