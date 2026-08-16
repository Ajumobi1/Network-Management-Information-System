import { InfoGrid, ProviderTabProps } from '../ProfileTabShell';
import { getProviderCategoryLabel } from '../../../../constants/providerNetwork';

export default function FacilityTab({ provider }: ProviderTabProps) {
  return <InfoGrid items={[['Facility Type', getProviderCategoryLabel(provider.category)], ['Address', provider.address], ['Staff Strength', provider.staffStrength], ['Services', provider.services.length], ['Departments', provider.departments.length], ['Equipment', provider.equipment.length]]} />;
}
