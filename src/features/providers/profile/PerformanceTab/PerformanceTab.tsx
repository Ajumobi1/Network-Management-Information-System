import { InfoGrid, ProviderTabProps } from '../ProfileTabShell';

export default function PerformanceTab({ provider }: ProviderTabProps) {
  return <InfoGrid items={[['Inspection Rating', `${provider.performance.inspectionRating}%`], ['Complaint Score', provider.performance.complaintScore], ['Utilization', `${provider.performance.utilization}%`], ['Claims Trend', provider.performance.claimsTrend], ['Capitation Trend', provider.performance.capitationTrend], ['Compliance', `${provider.performance.compliance}%`]]} />;
}
