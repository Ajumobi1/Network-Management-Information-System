import { InfoGrid, ProviderTabProps } from '../ProfileTabShell';

export default function ContactsTab({ provider }: ProviderTabProps) {
  return <InfoGrid items={[['Contact Person', provider.contactPerson], ['Phone', provider.phone], ['Email', provider.email]]} />;
}
