import { Link } from 'react-router-dom';
import { ShieldAlert, CreditCard, ExternalLink, Calendar } from 'lucide-react';
import Badge from '../../../../components/ui/Badge';
import { useCapitationRecords } from '../../../../hooks/capitation/capitationHooks';
import { getCapitationSummary } from '../../../../services/capitation/capitationService';
import { DEFAULT_CAPITATION_FILTERS, PAYMENT_STATUS_LABELS, RECONCILIATION_STATUS_LABELS } from '../../../../types/capitation';
import { ProviderTabProps } from '../ProfileTabShell';
import { isSecureContractError } from '../../../../lib/security/secureContracts';

const naira = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 });

export default function CapitationTab({ provider }: ProviderTabProps) {
  const { data: records = [], isLoading, isError, error } = useCapitationRecords({ 
    ...DEFAULT_CAPITATION_FILTERS, 
    search: provider.providerCode 
  });
  
  const summary = getCapitationSummary(records);
  const latest = [...records].sort((a, b) => b.period.localeCompare(a.period)).slice(0, 5);
  const eligible = provider.status === 'active' && provider.credentialStatus === 'complete';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-blue" />
      </div>
    );
  }

  if (isError) {
    const secureUnavailable = isSecureContractError(error);
    return (
      <div className="rounded-card border border-amber-200 bg-amber-50 p-6 text-center text-amber-800">
        <ShieldAlert className="mx-auto h-8 w-8 mb-2" />
        <h4 className="font-semibold">{secureUnavailable ? 'Secure capitation contract unavailable' : 'Unable to load capitation data'}</h4>
        <p className="mt-1 text-sm">{error instanceof Error ? error.message : 'An unexpected error occurred.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Eligibility Status */}
      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-white p-2 text-brand-blue shadow-sm">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Capitation Eligibility</p>
            <p className="text-xs text-slate-500">Payable inclusion respects provider lifecycle and credentialing status.</p>
          </div>
        </div>
        <Badge variant={eligible ? 'success' : 'warning'}>
          {eligible ? 'Eligible for payable calculations' : 'Review provider controls'}
        </Badge>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Eligible Lives</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{summary.totalBeneficiaries.toLocaleString('en-NG')}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Net Payable</p>
          <p className="mt-2 text-2xl font-black text-emerald-700">{naira.format(summary.netPayable)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Outstanding</p>
          <p className="mt-2 text-2xl font-black text-rose-700">{naira.format(summary.outstandingAmount)}</p>
        </div>
      </div>

      {/* Recent History */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/50">
          <div>
            <p className="text-sm font-bold text-slate-900">Recent Payment Records</p>
            <p className="text-xs text-slate-500">{records.length} monthly record(s) linked to this provider.</p>
          </div>
          <Link to="/capitation" className="flex items-center gap-1.5 text-xs font-bold text-brand-blue hover:text-brand-navy transition-colors">
            Open register <ExternalLink size={12} />
          </Link>
        </div>
        
        {latest.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">No capitation records are linked to this provider yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {latest.map(record => (
              <div key={record.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center hover:bg-slate-50 transition-colors">
                <div>
                  <p className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Calendar size={14} className="text-slate-400" />
                    {new Date(`${record.period}-01T00:00:00`).toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {record.eligibleBeneficiaryCount.toLocaleString('en-NG')} eligible beneficiaries · {naira.format(record.netPayable)} net
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant={record.paymentStatus === 'paid' ? 'success' : record.paymentStatus === 'failed' ? 'error' : 'warning'}>
                    {PAYMENT_STATUS_LABELS[record.paymentStatus] || record.paymentStatus}
                  </Badge>
                  <Badge variant={record.reconciliationStatus === 'reconciled' ? 'success' : record.reconciliationStatus === 'exception' ? 'error' : 'warning'}>
                    {RECONCILIATION_STATUS_LABELS[record.reconciliationStatus] || record.reconciliationStatus}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
