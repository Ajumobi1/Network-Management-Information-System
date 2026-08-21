import { Award, ShieldAlert, TrendingUp, Users, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ProviderTabProps } from '../ProfileTabShell';
import KpiCard from '../../../../components/ui/KpiCard';

export default function PerformanceTab({ provider }: ProviderTabProps) {
  // Derive score metrics for this specific provider
  const compositeScore = 0;
  const rating = 'N/A';
  const inspectionScore = 0;
  const credentialingScore = 0;
  const complaintScore = 0;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Composite Score"
          value={`${compositeScore}%`}
          subtitle={`Rating: ${rating}`}
          tone="primary"
          icon={<Award size={20} />}
        />
        <KpiCard
          title="Inspection Audit"
          value={`${inspectionScore}%`}
          subtitle="Latest facility audit"
          tone="success"
          icon={<CheckCircle2 size={20} />}
        />
        <KpiCard
          title="Credentialing"
          value={`${credentialingScore}%`}
          subtitle="Licensing & docs"
          tone="info"
          icon={<TrendingUp size={20} />}
        />
        <KpiCard
          title="Complaints Metric"
          value={`${100 - complaintScore}%`}
          subtitle="Grievance index"
          tone={complaintScore > 20 ? 'warning' : 'success'}
          icon={<Users size={20} />}
        />
      </div>

      <div className="p-12 text-center border border-dashed border-slate-200 rounded-3xl">
        <p className="text-sm text-slate-500">No performance analytics available for this provider.</p>
        <p className="mt-1 text-xs text-slate-400 italic">Performance scoring and management evaluations will appear here once the secure performance contract is active.</p>
      </div>
    </div>
  );
}
