import React from 'react';
import { Award, ShieldAlert, TrendingUp, Users } from 'lucide-react';
import { ProviderTabProps } from '../ProfileTabShell';
import KpiCard from '../../../../components/ui/KpiCard';

export default function PerformanceTab({ provider }: ProviderTabProps) {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="Inspection Rating"
          value={`${provider.performance.inspectionRating}%`}
          subtitle="Latest assessment score"
          tone="primary"
          icon={<Award size={20} />}
        />
        <KpiCard
          title="Compliance Score"
          value={`${provider.performance.compliance}%`}
          subtitle="Regulatory meeting"
          tone="success"
          icon={<TrendingUp size={20} />}
        />
        <KpiCard
          title="Utilization"
          value={`${provider.performance.utilization}%`}
          subtitle="Capacity vs Enrolment"
          tone="info"
          icon={<Users size={20} />}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-control border border-brand-divider bg-brand-surface p-6">
          <h4 className="text-xs font-black uppercase tracking-widest text-brand-muted mb-4">Financial Trends</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-brand-secondary">Claims Trend</span>
              <span className={`text-sm font-black ${provider.performance.claimsTrend.startsWith('+') ? 'text-status-success' : 'text-status-error'}`}>
                {provider.performance.claimsTrend}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-brand-secondary">Capitation Trend</span>
              <span className="text-sm font-black text-brand-blue">{provider.performance.capitationTrend}</span>
            </div>
          </div>
        </div>

        <div className="rounded-control border border-brand-divider bg-brand-surface p-6">
          <div className="flex items-center gap-2 text-status-warning mb-4">
            <ShieldAlert size={16} />
            <h4 className="text-xs font-black uppercase tracking-widest">Quality Signals</h4>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-brand-secondary">Complaint Score</span>
            <span className="text-sm font-black text-brand-foreground">{provider.performance.complaintScore} / 100</span>
          </div>
          <p className="mt-2 text-xs text-brand-muted leading-relaxed">
            Based on beneficiary feedback and reported service exceptions over the last 90 days.
          </p>
        </div>
      </div>
    </div>
  );
}
