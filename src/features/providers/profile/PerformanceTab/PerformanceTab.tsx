import { Award, ShieldAlert, TrendingUp, Users, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ProviderTabProps } from '../ProfileTabShell';
import KpiCard from '../../../../components/ui/KpiCard';

export default function PerformanceTab({ provider }: ProviderTabProps) {
  // Derive score metrics for this specific provider
  const compositeScore = 84.5;
  const rating = 'Good';
  const inspectionScore = provider.performance.inspectionRating;
  const credentialingScore = provider.performance.compliance;
  const complaintScore = provider.performance.complaintScore;

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

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Scorecard Contribution Breakdown</h4>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Inspection Audit (35%)</span>
              <span className="font-semibold text-slate-900">{inspectionScore}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Credentialing & Licensing (25%)</span>
              <span className="font-semibold text-slate-900">{credentialingScore}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Complaint Resolution (20%)</span>
              <span className="font-semibold text-slate-900">{100 - complaintScore}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Financial / Capitation (20%)</span>
              <span className="font-semibold text-slate-900">88.0%</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle size={18} />
            <h4 className="text-xs font-semibold uppercase tracking-wider">Management Attention & Recommendations</h4>
          </div>
          <p className="text-sm text-slate-600">
            Facility is operating within acceptable network standards. No critical interventions currently required. Continue routine quarterly audits and claims reconciliation.
          </p>
          <div className="pt-2 border-t border-slate-100 flex justify-between text-xs text-slate-500">
            <span>Last Evaluation: August 2026</span>
            <span>Next Review: November 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}
