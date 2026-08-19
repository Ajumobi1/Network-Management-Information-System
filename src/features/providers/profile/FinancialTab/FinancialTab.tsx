import { useState, useMemo } from 'react';
import { AlertCircle, FileText, TrendingUp, WalletCards, Filter } from 'lucide-react';
import KpiCard from '../../../../components/ui/KpiCard';
import Card from '../../../../components/ui/Card';
import Badge from '../../../../components/ui/Badge';
import Button from '../../../../components/ui/Button';
import Select from '../../../../components/ui/Select';
import { useFinancialRecords } from '../../../../hooks/financial-data/financialDataHooks';
import { ProviderTabProps } from '../ProfileTabShell';
import { isSecureContractError } from '../../../../lib/security/secureContracts';

const naira = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 });

function paidAmount(record: { amountPaid?: number; netAmountPaid?: number; amountApproved?: number; amountClaimed?: number; amountSubmitted?: number; amount?: number }) {
  return Number(record.amountPaid ?? record.netAmountPaid ?? record.amountApproved ?? record.amountClaimed ?? record.amountSubmitted ?? record.amount ?? 0);
}

function submittedAmount(record: { amountSubmitted?: number; amountClaimed?: number; amountApproved?: number; amountPaid?: number; amount?: number }) {
  return Number(record.amountSubmitted ?? record.amountClaimed ?? record.amountApproved ?? record.amountPaid ?? record.amount ?? 0);
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function FinancialTab({ provider }: ProviderTabProps) {
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const query = useFinancialRecords({
    providerId: provider.id,
    dataTypes: ['claims', 'ffs'],
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

  const expenditure = filteredRecords.reduce((sum, record) => sum + paidAmount(record), 0);
  const submitted = filteredRecords.reduce((sum, record) => sum + submittedAmount(record), 0);
  const totalClaims = filteredRecords.reduce((sum, record) => sum + (record.claimCount ?? record.encounterCount ?? 0), 0);
  const paid = filteredRecords.reduce((sum, record) => sum + (record.amountPaid ?? record.netAmountPaid ?? record.amountApproved ?? 0), 0);
  const rejected = filteredRecords.reduce((sum, record) => sum + (record.amountRejected ?? 0), 0);
  const latest = [...filteredRecords].sort((left, right) => right.period.localeCompare(left.period)).slice(0, 24);
  const byType = filteredRecords.reduce<Record<string, number>>((acc, record) => {
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Claims/FFS Expenditure" value={naira.format(expenditure)} subtitle={`${filteredRecords.length.toLocaleString('en-NG')} records in view`} tone="primary" icon={<WalletCards size={20} />} />
        <KpiCard title="Submitted / Claimed" value={naira.format(submitted)} subtitle="Source amount supplied" tone="info" icon={<FileText size={20} />} />
        <KpiCard title="Paid / Approved" value={naira.format(paid)} subtitle={`${totalClaims.toLocaleString('en-NG')} total volume`} tone="success" icon={<TrendingUp size={20} />} />
        <KpiCard title="Rejected" value={naira.format(rejected)} subtitle="Rejected amount supplied" tone="danger" icon={<AlertCircle size={20} />} />
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4">
            <p className="text-sm font-bold text-slate-900">Uploaded Claims/FFS History</p>
            <p className="text-xs text-slate-500">Historical records (2025) and current claims linked by provider UUID.</p>
          </div>
          {latest.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">No Claims/FFS records found for this provider in the selected period.</div>
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
            <div className="flex items-center justify-between"><span className="text-brand-muted">Total records</span><span className="font-bold text-brand-foreground">{filteredRecords.length.toLocaleString('en-NG')}</span></div>
          </div>
          <div className="mt-6 border-t border-brand-divider pt-5"><Badge variant={filteredRecords.length > 0 ? 'success' : 'warning'}>{filteredRecords.length > 0 ? 'Financial records linked' : 'Awaiting upload'}</Badge></div>
          <p className="mt-5 text-xs leading-relaxed text-brand-secondary">Bank information and raw payment credentials remain restricted to authorized finance officers. This tab displays only approved provider-linked financial fields.</p>
        </Card>
      </div>
    </div>
  );
}
