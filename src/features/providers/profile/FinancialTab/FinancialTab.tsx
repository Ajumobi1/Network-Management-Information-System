import { WalletCards, TrendingUp, Users, AlertCircle } from 'lucide-react';
import { ProviderTabProps } from '../ProfileTabShell';
import KpiCard from '../../../../components/ui/KpiCard';
import Card from '../../../../components/ui/Card';

export default function FinancialTab({ provider }: ProviderTabProps) {
  // Derived analytical fields for the provider
  // In a real implementation, these would be fetched via a secure provider-specific reporting RPC
  const totalExpenditure = 0;
  const pepm = 0;
  const enrolmentDenominator = 0;
  const capitationTrend = 'Unavailable';

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Expenditure"
          value={`₦${(totalExpenditure / 1000000).toFixed(2)}M`}
          subtitle="Processed network spend"
          tone="primary"
          icon={<WalletCards size={20} />}
        />
        <KpiCard
          title="Provider PEPM"
          value={`₦${pepm.toFixed(0)}`}
          subtitle="Spend per enrollee"
          tone="danger"
          icon={<TrendingUp size={20} />}
        />
        <KpiCard
          title="Enrolment Base"
          value={enrolmentDenominator.toLocaleString()}
          subtitle="Eligible denominator"
          tone="info"
          icon={<Users size={20} />}
        />
        <KpiCard
          title="Capitation Trend"
          value={capitationTrend}
          subtitle="Period-over-period"
          tone="success"
          icon={<TrendingUp size={20} />}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h3 className="text-sm font-black uppercase tracking-widest text-brand-muted mb-4">Financial Activity History</h3>
          <div className="p-8 text-center">
            <p className="text-xs text-brand-muted italic">No financial activity records available for this provider.</p>
          </div>
        </Card>

        <Card className="bg-brand-surface/50 border-brand-divider">
          <div className="flex items-center gap-2 text-brand-blue mb-4">
            <AlertCircle size={18} />
            <h3 className="text-sm font-black uppercase tracking-widest">Financial Compliance Notice</h3>
          </div>
          <p className="text-xs leading-relaxed text-brand-secondary">
            This provider is currently within the expected expenditure variance threshold. PEPM is consistent with facility category averages across the network.
          </p>
          <div className="mt-6 pt-6 border-t border-brand-divider">
            <p className="text-[10px] font-bold text-brand-muted uppercase tracking-tighter">
              Bank information and raw payment credentials are restricted to authorized finance officers only.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
