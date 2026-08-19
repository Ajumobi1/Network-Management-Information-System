import { Link } from 'react-router-dom';
import { Calendar, CreditCard, ExternalLink, ShieldAlert } from 'lucide-react';
import Badge from '../../../../components/ui/Badge';
import { useFinancialRecords } from '../../../../hooks/financial-data/financialDataHooks';
import { ProviderTabProps } from '../ProfileTabShell';
import { isSecureContractError } from '../../../../lib/security/secureContracts';

const naira = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 });

function amountForRecord(record: { amountPaid?: number; netAmountPaid?: number; amountApproved?: number; amount?: number; grossAmount?: number; netAmount?: number }) {
  return record.amountPaid ?? record.netAmountPaid ?? record.amountApproved ?? record.netAmount ?? record.grossAmount ?? record.amount ?? 0;
}

function submittedAmountForRecord(record: { amountSubmitted?: number; amountClaimed?: number; amountApproved?: number; amount?: number; grossAmount?: number }) {
  return record.amountSubmitted ?? record.amountClaimed ?? record.amountApproved ?? record.grossAmount ?? record.amount ?? 0;
}

export default function CapitationTab({ provider }: ProviderTabProps) {
  const query = useFinancialRecords({
    providerId: provider.id,
    dataType: 'capitation',
    page: 1,
    pageSize: 1000,
  });
  const records = query.data ?? [];
  const eligibleLives = records.reduce((sum, record) => sum + (record.eligibleLives ?? 0), 0);
  const totalPaid = records.reduce((sum, record) => sum + amountForRecord(record), 0);
  const totalSubmitted = records.reduce((sum, record) => sum + submittedAmountForRecord(record), 0);
  const outstanding = Math.max(totalSubmitted - totalPaid, 0);
  const eligible = provider.status === 'active' && provider.credentialStatus === 'complete';
  const latest = [...records].sort((left, right) => right.period.localeCompare(left.period)).slice(0, 8);

  if (query.isLoading) {
    return <div className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-blue" /></div>;
  }

  if (query.isError) {
    const secureUnavailable = isSecureContractError(query.error);
    return (
      <div className="rounded-card border border-amber-200 bg-amber-50 p-6 text-center text-amber-800">
        <ShieldAlert className="mx-auto mb-2 h-8 w-8" />
        <h4 className="font-semibold">{secureUnavailable ? 'Secure capitation contract unavailable' : 'Unable to load capitation payments'}</h4>
        <p className="mt-1 text-sm">{query.error instanceof Error ? query.error.message : 'An unexpected error occurred while loading this provider payment history.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-white p-2 text-brand-blue shadow-sm"><CreditCard className="h-5 w-5" /></div>
          <div>
            <p className="text-sm font-bold text-slate-900">Capitation Eligibility</p>
            <p className="text-xs text-slate-500">Uploaded capitation payment records are linked by the authoritative provider ID.</p>
          </div>
        </div>
        <Badge variant={eligible ? 'success' : 'warning'}>{eligible ? 'Eligible for payable calculations' : 'Review provider controls'}</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Eligible Lives</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{eligibleLives.toLocaleString('en-NG')}</p>
          <p className="mt-1 text-xs text-slate-500">From uploaded capitation rows</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Net Paid / Recorded</p>
          <p className="mt-2 text-2xl font-black text-emerald-700">{naira.format(totalPaid)}</p>
          <p className="mt-1 text-xs text-slate-500">Across {records.length.toLocaleString('en-NG')} record(s)</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Net Payable</p>
          <p className="mt-2 text-2xl font-black text-brand-blue">{naira.format(totalSubmitted)}</p>
          <p className="mt-1 text-xs text-slate-500">Submitted or approved total</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Outstanding</p>
          <p className="mt-2 text-2xl font-black text-rose-700">{naira.format(outstanding)}</p>
          <p className="mt-1 text-xs text-slate-500">Unpaid difference where supplied</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900">Uploaded Capitation Payments</p>
            <p className="text-xs text-slate-500">{records.length.toLocaleString('en-NG')} monthly record(s) linked to this provider.</p>
          </div>
          <Link to="/financial/capitation" className="flex items-center gap-1.5 text-xs font-bold text-brand-blue transition-colors hover:text-brand-navy">Open register <ExternalLink size={12} /></Link>
        </div>

        {latest.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">No uploaded capitation payment records are linked to this provider yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {latest.map(record => (
              <div key={record.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center hover:bg-slate-50 transition-colors">
                <div>
                  <p className="flex items-center gap-1.5 font-bold text-slate-800"><Calendar size={14} className="text-slate-400" />{new Date(`${record.period}-01T00:00:00`).toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })}</p>
                  <p className="mt-1 text-xs text-slate-500">{record.sourceFile || 'Uploaded capitation register'} · {record.eligibleLives?.toLocaleString('en-NG') ?? '—'} eligible lives</p>
                </div>
                <div className="text-sm font-bold text-slate-800">{naira.format(amountForRecord(record))}</div>
                <Badge variant={record.paymentStatus === 'paid' || record.recordStatus === 'valid' ? 'success' : record.recordStatus === 'error' ? 'error' : 'warning'}>
                  {record.paymentStatus ?? record.recordStatus}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
