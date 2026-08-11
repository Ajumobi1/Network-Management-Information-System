import { InfoGrid, ProviderTabProps } from '../ProfileTabShell';

export default function FacilityTab({ provider }: ProviderTabProps) {
  return <InfoGrid items={[['Facility Type', provider.category], ['Address', provider.address], ['Staff Strength', provider.staffStrength], ['Services', provider.services.length], ['Departments', provider.departments.length], ['Equipment', provider.equipment.length]]} />;
}
