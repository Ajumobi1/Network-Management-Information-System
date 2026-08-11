import { useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CheckCircle2, ChevronRight, Download, FileWarning, Filter, RefreshCw, Search, ShieldAlert, WalletCards, X } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { useBulkCapitationTransition, useCapitationRecord, useCapitationRecords, useCapitationTransition } from '../hooks/capitation/capitationHooks';
import { exportCapitationsCsv, getAvailableActions, getBreakdown, getCapitationSummary, getMonthlyTrend } from '../services/capitation/capitationService';
import {
  CAPITATION_STATUS_LABELS,
  DEFAULT_CAPITATION_FILTERS,
  PAYMENT_STATUS_LABELS,
  RECONCILIATION_STATUS_LABELS,
  CapitationAction,
  CapitationFilters,
  CapitationRecord,
  CapitationRecordStatus,
  PaymentStatus,
  ReconciliationStatus,
} from '../types/capitation';
import { ProviderCategory, ProviderOwnership } from '../types/providers/providerTypes';
import { PROVIDER_CATEGORIES, PROVIDER_OWNERSHIPS } from '../constants/providerNetwork';

const naira = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 });
const number = new Intl.NumberFormat('en-NG');
const chartColors = ['#1d4ed8', '#0f766e', '#d97706', '#7c3aed', '#be123c', '#334155', '#0891b2'];

function formatNaira(value: number) {
  return naira.format(value);
}

function formatPeriod(period: string) {
  if (period === 'all') return 'All periods';
  const date = new Date(`${period}-01T00:00:00`);
  return date.toLocaleDateString('en-NG', { month: 'short', year: 'numeric' });
}

function statusVariant(status: CapitationRecordStatus | PaymentStatus | ReconciliationStatus) {
  if (['reconciled', 'paid', 'approved'].includes(status)) return 'success' as const;
  if (['reconciliation-exception', 'failed', 'exception', 'rejected'].includes(status)) return 'error' as const;
  if (['pending', 'submitted', 'reviewed', 'partial', 'processing', 'calculated'].includes(status)) return 'warning' as const;
  if (['suspended'].includes(status)) return 'error' as const;
  return 'default' as const;
}

function StatusBadge({ status, label }: { status: CapitationRecordStatus | PaymentStatus | ReconciliationStatus; label: string }) {
  return <Badge variant={statusVariant(status)}>{label}</Badge>;
}

function MetricCard({ label, value, helper, icon: Icon, tone = 'blue' }: { label: string; value: string; helper: string; icon: typeof WalletCards; tone?: 'blue' | 'green' | 'amber' | 'rose' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
  };
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
          <p className="mt-2 text-xs text-slate-500">{helper}</p>
        </div>
        <div className={`rounded-2xl p-3 ${tones[tone]}`}><Icon size={19} /></div>
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { label: string; value: string }[] }) {
  return (
    <label className="block text-xs font-semibold text-slate-500">
      {label}
      <select value={value} onChange={event => onChange(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10">
        {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function CapitationPage() {
  const [filters, setFilters] = useState<CapitationFilters>(DEFAULT_CAPITATION_FILTERS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const transition = useCapitationTransition();
  const bulkTransition = useBulkCapitationTransition();
  const query = useCapitationRecords(filters);
  const detailQuery = useCapitationRecord(selectedRecordId);
  const records = query.data ?? [];
  const summary = useMemo(() => getCapitationSummary(records), [records]);
  const trend = useMemo(() => getMonthlyTrend(records), [records]);
  const byType = useMemo(() => getBreakdown(records, 'facilityType'), [records]);
  const byOwnership = useMemo(() => getBreakdown(records, 'ownership'), [records]);
  const states = useMemo(() => [...new Set(records.map(record => record.state))].sort(), [records]);
  const lgas = useMemo(() => [...new Set(records.map(record => record.lga))].sort(), [records]);
  const periods = useMemo(() => [...new Set(records.map(record => record.period))].sort().reverse(), [records]);
  const totalPages = Math.max(1, Math.ceil(records.length / pageSize));
  const visibleRecords = records.slice((page - 1) * pageSize, page * pageSize);
  const selectedRecord = detailQuery.data ?? records.find(record => record.id === selectedRecordId) ?? null;

  const updateFilter = <K extends keyof CapitationFilters>(key: K, value: CapitationFilters[K]) => {
    setPage(1);
    setFilters(current => ({ ...current, [key]: value }));
    setSelectedIds([]);
  };

  const toggleRecord = (id: string) => {
    setSelectedIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  };

  const togglePage = () => {
    const pageIds = visibleRecords.map(record => record.id);
    const allSelected = pageIds.every(id => selectedIds.includes(id));
    setSelectedIds(current => allSelected ? current.filter(id => !pageIds.includes(id)) : [...new Set([...current, ...pageIds])]);
  };

  const handleExport = () => {
    const selectedRecords = selectedIds.length ? records.filter(record => selectedIds.includes(record.id)) : records;
    const blob = new Blob([exportCapitationsCsv(selectedRecords)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nmis-capitation-register-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const runAction = async (id: string, action: CapitationAction, comment?: string) => {
    try {
      await transition.mutateAsync({ id, action, comment });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'The capitation action could not be completed.');
    }
  };

  const runBulkAction = async (action: CapitationAction) => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Apply ${action.replace('-', ' ')} to ${selectedIds.length} selected record(s)?`)) return;
    try {
      await bulkTransition.mutateAsync({ ids: selectedIds, action });
      setSelectedIds([]);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'The bulk action could not be completed for the selected records.');
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <PageHeader
          title="Capitation management"
          description="Operate monthly provider payments from beneficiary validation through approval, settlement, and reconciliation."
          actions={[
            { label: selectedIds.length ? `Export ${selectedIds.length} selected` : 'Export register', onClick: handleExport, variant: 'secondary' },
            { label: 'Refresh data', onClick: () => query.refetch(), variant: 'secondary' },
          ]}
        />

        {query.isError ? (
          <div className="flex items-center gap-3 rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700"><ShieldAlert size={18} /> Unable to load capitation records. Please refresh and try again.</div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Eligible beneficiaries" value={number.format(summary.totalBeneficiaries)} helper={`${summary.totalProviders} providers in current view`} icon={WalletCards} />
          <MetricCard label="Gross capitation" value={formatNaira(summary.grossAmount)} helper="Beneficiaries × applicable rate" icon={WalletCards} tone="blue" />
          <MetricCard label="Net payable" value={formatNaira(summary.netPayable)} helper={`${formatNaira(summary.deductions)} total deductions`} icon={CheckCircle2} tone="green" />
          <MetricCard label="Outstanding" value={formatNaira(summary.outstandingAmount)} helper={`${summary.pendingApprovals} records pending approval`} icon={FileWarning} tone="amber" />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr_1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-slate-900">Monthly capitation trend</p><p className="mt-1 text-xs text-slate-500">Gross, net payable, and paid amounts by period.</p></div><Badge variant="info">{formatPeriod(filters.period)}</Badge></div>
            <div className="mt-5 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs><linearGradient id="grossFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1d4ed8" stopOpacity={0.3} /><stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.03} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} /><XAxis dataKey="period" tickFormatter={formatPeriod} tick={{ fontSize: 11, fill: '#64748b' }} /><YAxis tickFormatter={value => `₦${Math.round(value / 1000000)}m`} tick={{ fontSize: 11, fill: '#64748b' }} width={42} /><Tooltip formatter={value => formatNaira(Number(value ?? 0))} labelFormatter={label => formatPeriod(String(label))} /><Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} /><Area type="monotone" dataKey="gross" name="Gross" stroke="#1d4ed8" fill="url(#grossFill)" strokeWidth={2} /><Area type="monotone" dataKey="net" name="Net payable" stroke="#0f766e" fill="transparent" strokeWidth={2} /><Area type="monotone" dataKey="paid" name="Paid" stroke="#d97706" fill="transparent" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-sm font-semibold text-slate-900">By facility type</p><p className="mt-1 text-xs text-slate-500">Net payable concentration across classifications.</p>
            <div className="mt-5 h-[260px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={byType.slice(0, 6)} layout="vertical" margin={{ left: 8, right: 18 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" /><XAxis type="number" tickFormatter={value => `₦${Math.round(value / 1000000)}m`} tick={{ fontSize: 10, fill: '#64748b' }} /><YAxis dataKey="label" type="category" width={105} tick={{ fontSize: 10, fill: '#64748b' }} /><Tooltip formatter={value => formatNaira(Number(value ?? 0))} /><Bar dataKey="value" name="Net payable" radius={[0, 6, 6, 0]}>{byType.slice(0, 6).map((entry, index) => <Cell key={entry.label} fill={chartColors[index % chartColors.length]} />)}</Bar></BarChart></ResponsiveContainer></div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-sm font-semibold text-slate-900">By ownership</p><p className="mt-1 text-xs text-slate-500">Provider ownership mix in the current register.</p>
            <div className="mt-5 h-[260px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={byOwnership} dataKey="value" nameKey="label" cx="50%" cy="45%" innerRadius={58} outerRadius={88} paddingAngle={3}>{byOwnership.map((entry, index) => <Cell key={entry.label} fill={chartColors[index % chartColors.length]} />)}</Pie><Tooltip formatter={value => formatNaira(Number(value ?? 0))} /><Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} /></PieChart></ResponsiveContainer></div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div><div className="flex items-center gap-2"><Filter size={17} className="text-brand-blue" /><h2 className="text-lg font-semibold text-slate-900">Capitation register</h2></div><p className="mt-1 text-sm text-slate-500">Search, filter, and action provider-level monthly payment records.</p></div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setFilters(DEFAULT_CAPITATION_FILTERS)}><RefreshCw size={15} className="mr-2" /> Reset filters</Button>
              {selectedIds.length ? <Button variant="outline" onClick={() => runBulkAction('submit')}>Submit selected</Button> : null}
              {selectedIds.length ? <Button variant="outline" onClick={() => runBulkAction('approve')}>Approve selected</Button> : null}
              {selectedIds.length ? <Button variant="outline" onClick={() => runBulkAction('reconcile')}>Reconcile selected</Button> : null}
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="relative block md:col-span-2 xl:col-span-2"><span className="sr-only">Search providers</span><Search size={16} className="absolute left-3 top-3.5 text-slate-400" /><input value={filters.search} onChange={event => updateFilter('search', event.target.value)} placeholder="Search provider code, facility, state, or LGA" className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10" /></label>
            <SelectField label="Period" value={filters.period} onChange={value => updateFilter('period', value)} options={[{ label: 'All periods', value: 'all' }, ...periods.map(period => ({ label: formatPeriod(period), value: period }))]} />
            <SelectField label="Facility type" value={filters.facilityType} onChange={value => updateFilter('facilityType', value as CapitationFilters['facilityType'])} options={[{ label: 'All facility types', value: 'all' }, ...PROVIDER_CATEGORIES.map(category => ({ label: category, value: category }))]} />
            <SelectField label="Ownership" value={filters.ownership} onChange={value => updateFilter('ownership', value as CapitationFilters['ownership'])} options={[{ label: 'All ownership types', value: 'all' }, ...PROVIDER_OWNERSHIPS.map(ownership => ({ label: ownership, value: ownership }))]} />
            <SelectField label="State" value={filters.state} onChange={value => updateFilter('state', value)} options={[{ label: 'All states', value: 'all' }, ...states.map(state => ({ label: state, value: state }))]} />
            <SelectField label="LGA" value={filters.lga} onChange={value => updateFilter('lga', value)} options={[{ label: 'All LGAs', value: 'all' }, ...lgas.map(lga => ({ label: lga, value: lga }))]} />
            <SelectField label="Payment status" value={filters.paymentStatus} onChange={value => updateFilter('paymentStatus', value as PaymentStatus | 'all')} options={[{ label: 'All payment statuses', value: 'all' }, ...Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => ({ value, label }))]} />
            <SelectField label="Reconciliation" value={filters.reconciliationStatus} onChange={value => updateFilter('reconciliationStatus', value as ReconciliationStatus | 'all')} options={[{ label: 'All reconciliation statuses', value: 'all' }, ...Object.entries(RECONCILIATION_STATUS_LABELS).map(([value, label]) => ({ value, label }))]} />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white shadow-soft">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="text-sm text-slate-500">Showing <span className="font-semibold text-slate-900">{records.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, records.length)}</span> of <span className="font-semibold text-slate-900">{records.length}</span> records</div><div className="flex items-center gap-2 text-xs text-slate-500">{summary.reconciliationExceptions} reconciliation exception(s)<span className="h-1 w-1 rounded-full bg-slate-300" />{summary.paidAmount ? `${formatNaira(summary.paidAmount)} paid` : 'No payments in view'}</div></div>
          <div className="overflow-x-auto">
            <table className="min-w-[1450px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500"><tr><th className="w-10 px-5 py-3"><input type="checkbox" checked={visibleRecords.length > 0 && visibleRecords.every(record => selectedIds.includes(record.id))} onChange={togglePage} aria-label="Select visible records" /></th><th className="px-3 py-3">Provider</th><th className="px-3 py-3">Classification</th><th className="px-3 py-3">Location</th><th className="px-3 py-3">Period</th><th className="px-3 py-3 text-right">Beneficiaries</th><th className="px-3 py-3 text-right">Rate</th><th className="px-3 py-3 text-right">Net payable</th><th className="px-3 py-3">Payment</th><th className="px-3 py-3">Reconciliation</th><th className="px-5 py-3">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{query.isLoading ? Array.from({ length: 5 }).map((_, index) => <tr key={index}><td colSpan={11} className="px-5 py-5"><div className="h-10 animate-pulse rounded-2xl bg-slate-100" /></td></tr>) : visibleRecords.length ? visibleRecords.map(record => <tr key={record.id} className="group cursor-pointer transition hover:bg-blue-50/40" onClick={() => setSelectedRecordId(record.id)}><td className="px-5 py-4" onClick={event => event.stopPropagation()}><input type="checkbox" checked={selectedIds.includes(record.id)} onChange={() => toggleRecord(record.id)} aria-label={`Select ${record.facilityName}`} /></td><td className="px-3 py-4"><p className="font-semibold text-slate-900">{record.facilityName}</p><p className="mt-1 text-xs font-medium text-slate-500">{record.providerCode}</p></td><td className="px-3 py-4"><p className="text-slate-700">{record.facilityType}</p><p className="mt-1 text-xs text-slate-500">{record.ownership}</p></td><td className="px-3 py-4"><p className="text-slate-700">{record.state}</p><p className="mt-1 text-xs text-slate-500">{record.lga}</p></td><td className="px-3 py-4"><Badge variant="info">{formatPeriod(record.period)}</Badge></td><td className="px-3 py-4 text-right font-medium text-slate-700">{number.format(record.eligibleBeneficiaryCount)}<span className="block text-xs font-normal text-slate-400">of {number.format(record.beneficiaryCount)}</span></td><td className="px-3 py-4 text-right text-slate-700">{formatNaira(record.capitationRate)}</td><td className="px-3 py-4 text-right font-semibold text-slate-900">{formatNaira(record.netPayable)}<span className="block text-xs font-normal text-slate-400">gross {formatNaira(record.grossAmount)}</span></td><td className="px-3 py-4"><StatusBadge status={record.paymentStatus} label={PAYMENT_STATUS_LABELS[record.paymentStatus]} /><p className="mt-1 text-xs text-slate-400">{record.paymentReference ?? 'No reference'}</p></td><td className="px-3 py-4"><StatusBadge status={record.reconciliationStatus} label={RECONCILIATION_STATUS_LABELS[record.reconciliationStatus]} /></td><td className="px-5 py-4"><button type="button" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue hover:text-brand-navy" onClick={event => { event.stopPropagation(); setSelectedRecordId(record.id); }}>Review <ChevronRight size={15} /></button></td></tr>) : <tr><td colSpan={11} className="px-5 py-16 text-center"><div className="mx-auto flex max-w-sm flex-col items-center"><Search size={22} className="text-slate-400" /><p className="mt-3 font-semibold text-slate-900">No capitation records match these filters.</p><p className="mt-1 text-sm text-slate-500">Adjust the search or clear one of the operational filters.</p></div></td></tr>}</tbody></table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4"><p className="text-xs text-slate-500">Financial actions are validated in the service layer and recorded in the audit trail.</p><div className="flex items-center gap-2"><Button variant="secondary" disabled={page <= 1} onClick={() => setPage(current => Math.max(1, current - 1))}>Previous</Button><span className="px-2 text-xs font-semibold text-slate-600">Page {page} of {totalPages}</span><Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage(current => Math.min(totalPages, current + 1))}>Next</Button></div></div>
        </section>
      </div>

      {selectedRecord ? <CapitationReviewDrawer record={selectedRecord} onClose={() => setSelectedRecordId(null)} onAction={runAction} isBusy={transition.isPending} /> : null}
    </main>
  );
}

function CapitationReviewDrawer({ record, onClose, onAction, isBusy }: { record: CapitationRecord; onClose: () => void; onAction: (id: string, action: CapitationAction, comment?: string) => void; isBusy: boolean }) {
  const actions = getAvailableActions(record.approvalStatus);
  const adjustmentTotal = record.adjustments.reduce((sum, adjustment) => sum + adjustment.amount, 0);
  const deductionTotal = record.deductions.reduce((sum, deduction) => sum + deduction.amount, 0);
  const workflow: CapitationRecordStatus[] = ['draft', 'calculated', 'submitted', 'reviewed', 'approved', 'payment-processing', 'paid', 'reconciled'];
  const actionLabels: Record<CapitationAction, string> = { calculate: 'Recalculate', submit: 'Submit for review', review: 'Mark reviewed', approve: 'Approve', 'start-payment': 'Start payment', 'mark-paid': 'Mark paid', reconcile: 'Reconcile', reject: 'Reject', suspend: 'Suspend', 'raise-exception': 'Raise exception' };
  const actionNeedsReason = (action: CapitationAction) => ['reject', 'suspend', 'raise-exception'].includes(action);

  const confirmAction = (action: CapitationAction) => {
    const reason = actionNeedsReason(action) ? window.prompt('Enter the reason for this action:') ?? '' : '';
    if (actionNeedsReason(action) && !reason.trim()) return;
    if (['approve', 'start-payment', 'mark-paid', 'reconcile'].includes(action) && !window.confirm(`Confirm ${actionLabels[action].toLowerCase()} for ${record.facilityName}?`)) return;
    onAction(record.id, action, reason || undefined);
  };

  return <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30" role="dialog" aria-modal="true" aria-label="Capitation record review"><button type="button" className="absolute inset-0 cursor-default" aria-label="Close review" onClick={onClose} /><aside className="relative h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl"><div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-6 py-5"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Capitation review</p><h2 className="mt-2 text-xl font-semibold text-slate-900">{record.facilityName}</h2><p className="mt-1 text-sm text-slate-500">{record.providerCode} · {formatPeriod(record.period)} · {record.state}</p></div><button type="button" onClick={onClose} className="rounded-2xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><X size={19} /></button></div><div className="space-y-6 px-6 py-6"><div className="flex flex-wrap items-center gap-2"><StatusBadge status={record.approvalStatus} label={CAPITATION_STATUS_LABELS[record.approvalStatus]} /><StatusBadge status={record.paymentStatus} label={PAYMENT_STATUS_LABELS[record.paymentStatus]} /><StatusBadge status={record.reconciliationStatus} label={RECONCILIATION_STATUS_LABELS[record.reconciliationStatus]} /></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Eligible lives</p><p className="mt-2 font-semibold text-slate-900">{number.format(record.eligibleBeneficiaryCount)}</p></div><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Rate</p><p className="mt-2 font-semibold text-slate-900">{formatNaira(record.capitationRate)}</p></div><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Gross</p><p className="mt-2 font-semibold text-slate-900">{formatNaira(record.grossAmount)}</p></div><div className="rounded-2xl bg-blue-50 p-4"><p className="text-xs text-blue-700">Net payable</p><p className="mt-2 font-semibold text-blue-900">{formatNaira(record.netPayable)}</p></div></div><div className="rounded-3xl border border-slate-200 p-5"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-slate-900">Calculation breakdown</p><p className="mt-1 text-xs text-slate-500">Gross = eligible beneficiaries × applicable rate.</p></div><CheckCircle2 size={18} className="text-emerald-600" /></div><div className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-4"><span className="text-slate-500">{number.format(record.eligibleBeneficiaryCount)} eligible × {formatNaira(record.capitationRate)}</span><span className="font-medium text-slate-900">{formatNaira(record.grossAmount)}</span></div><div className="flex justify-between gap-4 text-emerald-700"><span>Adjustments</span><span>+ {formatNaira(adjustmentTotal)}</span></div><div className="flex justify-between gap-4 text-rose-700"><span>Deductions</span><span>− {formatNaira(deductionTotal)}</span></div><div className="border-t border-dashed border-slate-200 pt-3"><div className="flex justify-between gap-4 font-semibold text-slate-900"><span>Net payable</span><span>{formatNaira(record.netPayable)}</span></div></div></div></div><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-3xl border border-slate-200 p-5"><p className="text-sm font-semibold text-slate-900">Provider controls</p><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-3"><dt className="text-slate-500">Facility type</dt><dd className="text-right font-medium text-slate-800">{record.facilityType}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Ownership</dt><dd className="text-right font-medium text-slate-800">{record.ownership}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Lifecycle</dt><dd className="text-right font-medium text-slate-800">{record.providerLifecycleStatus}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Credentialing</dt><dd className="text-right font-medium text-slate-800">{record.credentialingStatus}</dd></div></dl></div><div className="rounded-3xl border border-slate-200 p-5"><p className="text-sm font-semibold text-slate-900">Settlement</p><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-3"><dt className="text-slate-500">Batch</dt><dd className="font-medium text-slate-800">{record.batchNumber ?? 'Not batched'}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Payment date</dt><dd className="font-medium text-slate-800">{record.paymentDate ?? 'Not paid'}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Reference</dt><dd className="max-w-[160px] truncate font-medium text-slate-800">{record.paymentReference ?? 'Not available'}</dd></div></dl></div></div>{record.notes ? <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><FileWarning size={18} className="mt-0.5 shrink-0" /><p>{record.notes}</p></div> : null}<div className="rounded-3xl border border-slate-200 p-5"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-slate-900">Workflow actions</p><p className="text-xs text-slate-500">{actions.length} permitted</p></div><div className="mt-4 flex flex-wrap gap-2">{actions.map(action => <Button key={action} variant={['reject', 'suspend', 'raise-exception'].includes(action) ? 'danger' : action === 'approve' || action === 'reconcile' ? 'primary' : 'outline'} disabled={isBusy} onClick={() => confirmAction(action)}>{actionLabels[action]}</Button>)}</div></div><div className="rounded-3xl border border-slate-200 p-5"><p className="text-sm font-semibold text-slate-900">Workflow timeline</p><div className="mt-4 flex items-center gap-1 overflow-x-auto pb-2">{workflow.map((status, index) => { const completed = workflow.indexOf(record.approvalStatus) >= index && !['rejected', 'suspended', 'payment-failed', 'reconciliation-exception'].includes(record.approvalStatus); return <div key={status} className="flex min-w-[82px] items-center gap-1">{index > 0 ? <div className={`h-px w-4 ${completed ? 'bg-brand-blue' : 'bg-slate-200'}`} /> : null}<div className="text-center"><div className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${completed ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-400'}`}>{completed ? <CheckCircle2 size={14} /> : index + 1}</div><p className="mt-2 text-[10px] leading-tight text-slate-500">{CAPITATION_STATUS_LABELS[status]}</p></div></div>; })}</div></div><div className="rounded-3xl border border-slate-200 p-5"><p className="text-sm font-semibold text-slate-900">Audit trail</p><div className="mt-4 space-y-4">{record.auditTrail.map(entry => <div key={entry.id} className="relative pl-5 before:absolute before:left-0 before:top-1.5 before:h-2 before:w-2 before:rounded-full before:bg-brand-blue"><div className="flex flex-wrap items-baseline justify-between gap-2"><p className="text-sm font-medium text-slate-800">{entry.action}</p><time className="text-xs text-slate-400">{new Date(entry.timestamp).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}</time></div><p className="mt-1 text-xs text-slate-500">{entry.actor}{entry.comment ? ` · ${entry.comment}` : ''}</p></div>)}</div></div></div></aside></div>;
}

export default CapitationPage;
