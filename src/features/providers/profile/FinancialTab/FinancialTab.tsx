import { AlertCircle, FileText, TrendingUp, WalletCards } from 'lucide-react';
import KpiCard from '../../../../components/ui/KpiCard';
import Card from '../../../../components/ui/Card';
import Badge from '../../../../components/ui/Badge';
import { useFinancialRecords } from '../../../../hooks/financial-data/financialDataHooks';
import { ProviderTabProps } from '../ProfileTabShell';
import { isSecureContractError } from '../../../../lib/security/secureContracts';

const naira = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 });

function paidAmount(record: { amountPaid?: number; netAmountPaid?: number; amountApproved?: number; amountClaimed?: number; amountSubmitted?: number; amount?: number }) {
  return record.amountPaid ?? record.netAmountPaid ?? record.amountApproved ?? record.amountClaimed ?? record.amountSubmitted ?? record.amount ?? 0;
}

function submittedAmount(record: { amountSubmitted?: number; amountClaimed?: number; amountApproved?: number; amountPaid?: number; amount?: number }) {
  return record.amountSubmitted ?? record.amountClaimed ?? record.amountApproved ?? record.amountPaid ?? record.amount ?? 0;
}

export default function FinancialTab({ provider }: ProviderTabProps) {
  const query = useFinancialRecords({
    providerId: provider.id,
    dataTypes: ['claims', 'ffs'],
    page: 1,
    pageSize: 1000,
  });
  const records = query.data ?? [];
  const expenditure = records.reduce((sum, record) => sum + paidAmount(record), 0);
  const submitted = records.reduce((sum, record) => sum + submittedAmount(record), 0);
  const totalClaims = records.reduce((sum, record) => sum + (record.claimCount ?? record.encounterCount ?? 0), 0);
  const paid = records.reduce((sum, record) => sum + (record.amountPaid ?? record.netAmountPaid ?? record.amountApproved ?? 0), 0);
  const rejected = records.reduce((sum, record) => sum + (record.amountRejected ?? 0), 0);
  const latest = [...records].sort((left, right) => right.period.localeCompare(left.period)).slice(0, 12);
  const byType = records.reduce<Record<string, number>>((acc, record) => {
    acc[record.dataType] = (acc[record.dataType] ?? 0) + 1;
    return acc;
  }, {});

  if (query.isLoading) {
    return <div className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-blue" /></div>;
  }

  if (query.isError) {
    const secureUnavailable = isSecureContractError(query.error);
    return (
      <div className="rounded-card border border-amber-200 bg-amber-50 p-6 text-center text-amber-800">
        <AlertCircle className="mx-auto mb-2 h-8 w-8" />
        <h4 className="font-semibold">{secureUnavailable ? 'Secure Claims/FFS contract unavailable' : 'Unable to load Claims/FFS records'}</h4>
        <p className="mt-1 text-sm">{query.error instanceof Error ? query.error.message : 'An unexpected error occurred while loading this provider financial history.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Claims/FFS Expenditure" value={naira.format(expenditure)} subtitle={`${records.length.toLocaleString('en-NG')} uploaded records`} tone="primary" icon={<WalletCards size={20} />} />
        <KpiCard title="Submitted / Claimed" value={naira.format(submitted)} subtitle="Source amount supplied" tone="info" icon={<FileText size={20} />} />
        <KpiCard title="Paid / Approved" value={naira.format(paid)} subtitle={`${totalClaims.toLocaleString('en-NG')} claim or encounter count`} tone="success" icon={<TrendingUp size={20} />} />
        <KpiCard title="Rejected" value={naira.format(rejected)} subtitle="Rejected amount supplied" tone="danger" icon={<AlertCircle size={20} />} />
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4">
            <p className="text-sm font-bold text-slate-900">Uploaded Claims/FFS Records</p>
            <p className="text-xs text-slate-500">Claims and fee-for-service records linked by provider UUID.</p>
          </div>
          {latest.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">No Claims/FFS records are linked to this provider yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {latest.map(record => (
                <div key={record.id} className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="font-bold text-slate-800">{record.period} · {record.dataType === 'ffs' ? 'FFS' : 'Claims'}</p>
                    <p className="mt-1 text-xs text-slate-500">{record.sourceFile || 'Uploaded financial register'}{record.claimsCategory ? ` · ${record.claimsCategory}` : ''}</p>
                  </div>
                  <p className="text-sm font-bold text-slate-800">{naira.format(paidAmount(record))}</p>
                  <Badge variant={record.recordStatus === 'valid' ? 'success' : record.recordStatus === 'error' ? 'error' : 'warning'}>{record.recordStatus}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="bg-brand-surface/50 border-brand-divider">
          <div className="flex items-center gap-2 text-brand-blue mb-4"><AlertCircle size={18} /><h3 className="text-sm font-black uppercase tracking-widest">Financial Activity</h3></div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between"><span className="text-brand-muted">Claims records</span><span className="font-bold text-brand-foreground">{(byType.claims ?? 0).toLocaleString('en-NG')}</span></div>
            <div className="flex items-center justify-between"><span className="text-brand-muted">FFS records</span><span className="font-bold text-brand-foreground">{(byType.ffs ?? 0).toLocaleString('en-NG')}</span></div>
            <div className="flex items-center justify-between"><span className="text-brand-muted">Total records</span><span className="font-bold text-brand-foreground">{records.length.toLocaleString('en-NG')}</span></div>
          </div>
          <div className="mt-6 border-t border-brand-divider pt-5"><Badge variant={records.length > 0 ? 'success' : 'warning'}>{records.length > 0 ? 'Financial records linked' : 'Awaiting upload'}</Badge></div>
          <p className="mt-5 text-xs leading-relaxed text-brand-secondary">Bank information and raw payment credentials remain restricted to authorized finance officers. This tab displays only approved provider-linked financial fields.</p>
        </Card>
      </div>
    </div>
  );
}
