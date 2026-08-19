import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CreditCard, ExternalLink, ShieldAlert, Filter } from 'lucide-react';
import Badge from '../../../../components/ui/Badge';
import Button from '../../../../components/ui/Button';
import Select from '../../../../components/ui/Select';
import { useFinancialRecords } from '../../../../hooks/financial-data/financialDataHooks';
import { ProviderTabProps } from '../ProfileTabShell';
import { isSecureContractError } from '../../../../lib/security/secureContracts';

const naira = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 });

function amountForRecord(record: { amountPaid?: number; netAmountPaid?: number; amountApproved?: number; amount?: number; grossAmount?: number; netAmount?: number }) {
  return Number(record.amountPaid ?? record.netAmountPaid ?? record.amountApproved ?? record.netAmount ?? record.grossAmount ?? record.amount ?? 0);
}

function submittedAmountForRecord(record: { amountSubmitted?: number; amountClaimed?: number; amountApproved?: number; amount?: number; grossAmount?: number }) {
  return Number(record.amountSubmitted ?? record.amountClaimed ?? record.amountApproved ?? record.grossAmount ?? record.amount ?? 0);
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function CapitationTab({ provider }: ProviderTabProps) {
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const query = useFinancialRecords({
    providerId: provider.id,
    dataType: 'capitation',
    page: 1,
    pageSize: 2000,
  });

  const allRecords = query.data ?? [];
  
  const availableYears = useMemo(() => 
    Array.from(new Set(allRecords.map(r => r.reportingYear.toString()))).sort((a, b) => b.localeCompare(a)),
    [allRecords]
  );

  const availableMonths = useMemo(() => {
    if (selectedYear === 'all') return [];
    return Array.from(new Set(
      allRecords
        .filter(r => r.reportingYear.toString() === selectedYear)
        .map(r => r.reportingMonth.toString())
    )).sort((a, b) => Number(b) - Number(a));
  }, [allRecords, selectedYear]);

  const filteredRecords = useMemo(() => {
    return allRecords.filter(r => {
      const yearMatch = selectedYear === 'all' || r.reportingYear.toString() === selectedYear;
      const monthMatch = selectedMonth === 'all' || r.reportingMonth.toString() === selectedMonth;
      return yearMatch && monthMatch;
    });
  }, [allRecords, selectedYear, selectedMonth]);

  const eligibleLives = filteredRecords.reduce((sum, record) => sum + (record.eligibleLives ?? 0), 0);
  const totalPaid = filteredRecords.reduce((sum, record) => sum + amountForRecord(record), 0);
  const totalSubmitted = filteredRecords.reduce((sum, record) => sum + submittedAmountForRecord(record), 0);
  const outstanding = Math.max(totalSubmitted - totalPaid, 0);
  const eligible = provider.status === 'active' && provider.credentialStatus === 'complete';
  const latest = [...filteredRecords].sort((left, right) => right.period.localeCompare(left.period)).slice(0, 24);

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
        <Button variant="secondary" size="sm" className="mt-4" onClick={() => query.refetch()}>Retry Connection</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <Filter size={16} />
          <span>Filter Period:</span>
        </div>
        <div className="flex gap-3">
          <Select
            value={selectedYear}
            onChange={(e) => { setSelectedYear(e.target.value); setSelectedMonth('all'); }}
            className="w-32"
            options={[
              { label: 'All Years', value: 'all' },
              ...availableYears.map(year => ({ label: year, value: year }))
            ]}
          />
          <Select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-40"
            disabled={selectedYear === 'all'}
            options={[
              { label: 'All Months', value: 'all' },
              ...availableMonths.map(m => ({ label: MONTHS[Number(m) - 1], value: m }))
            ]}
          />
          {(selectedYear !== 'all' || selectedMonth !== 'all') && (
            <Button variant="secondary" size="sm" onClick={() => { setSelectedYear('all'); setSelectedMonth('all'); }}>Reset</Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-white p-2 text-brand-blue shadow-sm"><CreditCard className="h-5 w-5" /></div>
          <div>
            <p className="text-sm font-bold text-slate-900">Capitation Eligibility</p>
            <p className="text-xs text-slate-500">Historical records (2025) and current payments are linked by the provider UUID.</p>
          </div>
        </div>
        <Badge variant={eligible ? 'success' : 'warning'}>{eligible ? 'Eligible for payable calculations' : 'Review provider controls'}</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Eligible Lives</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{eligibleLives.toLocaleString('en-NG')}</p>
          <p className="mt-1 text-xs text-slate-500">Total across selected periods</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Net Paid / Recorded</p>
          <p className="mt-2 text-2xl font-black text-emerald-700">{naira.format(totalPaid)}</p>
          <p className="mt-1 text-xs text-slate-500">Across {filteredRecords.length.toLocaleString('en-NG')} record(s)</p>
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
            <p className="text-sm font-bold text-slate-900">Capitation Payment History</p>
            <p className="text-xs text-slate-500">Showing {filteredRecords.length.toLocaleString('en-NG')} record(s) for the selected filters.</p>
          </div>
          <Link to="/financial/capitation" className="flex items-center gap-1.5 text-xs font-bold text-brand-blue transition-colors hover:text-brand-navy">Open register <ExternalLink size={12} /></Link>
        </div>

        {latest.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">No capitation payment records found for this provider in the selected period.</div>
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
