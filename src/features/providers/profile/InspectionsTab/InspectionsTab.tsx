import ProviderStatusBadge from '../../components/ProviderStatusBadge';
import { InfoGrid, ProviderTabProps } from '../ProfileTabShell';

export default function InspectionsTab({ provider }: ProviderTabProps) {
  return <div className="space-y-4"><ProviderStatusBadge status={provider.inspectionStatus} /><InfoGrid items={[['Last Inspection', provider.lastInspectionDate], ['Inspection Rating', `${provider.performance.inspectionRating}%`]]} /></div>;
}
