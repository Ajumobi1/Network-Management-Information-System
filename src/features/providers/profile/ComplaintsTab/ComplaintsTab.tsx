import { InfoGrid, ProviderTabProps } from '../ProfileTabShell';

export default function ComplaintsTab({ provider }: ProviderTabProps) {
  return <InfoGrid items={[['Complaint Score', provider.performance.complaintScore], ['Open Complaints', 0], ['Escalations', provider.performance.complaintScore > 20 ? 1 : 0]]} />;
}
