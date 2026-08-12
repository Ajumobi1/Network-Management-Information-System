import { useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CheckCircle2, ChevronRight, Download, FileWarning, Filter, RefreshCw, Search, ShieldAlert, WalletCards, X, ChevronLeft } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import KpiCard from '../components/ui/KpiCard';
import Select from '../components/ui/Select';
import Input from '../components/ui/Input';
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
import { PROVIDER_CATEGORIES, PROVIDER_OWNERSHIPS } from '../constants/providerNetwork';
import { LoadingState, ErrorState } from '../components/ui/FeedbackStates';
import { ChartCard, SectionHeader } from '../components/ui/LayoutComponents';

const chartColors = ['#0b3d91', '#0f9d8a', '#d97706', '#7c3aed', '#be123c', '#334155', '#0891b2'];

function formatNaira(value: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);
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

export default function CapitationPage() {
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

  const periods = useMemo(() => [...new Set(records.map(record => record.period))].sort().reverse(), [records]);
  const totalPages = Math.max(1, Math.ceil(records.length / pageSize));
  const visibleRecords = records.slice((page - 1) * pageSize, page * pageSize);
  const selectedRecord = detailQuery.data ?? records.find(record => record.id === selectedRecordId) ?? null;

  const updateFilter = <K extends keyof CapitationFilters>(key: K, value: CapitationFilters[K]) => {
    setPage(1);
    setFilters(current => ({ ...current, [key]: value }));
    setSelectedIds([]);
  };

  const handleExport = () => {
    const selectedRecords = selectedIds.length ? records.filter(record => selectedIds.includes(record.id)) : records;
    const csv = exportCapitationsCsv(selectedRecords);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nmis-capitation-register-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (query.isError) {
    return <main className="nmis-page"><ErrorState title="Capitation data unavailable" action={{ label: 'Retry', onClick: () => query.refetch() }} /></main>;
  }

  return (
    <main className="nmis-page">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Financial Management"
          title="Capitation Management"
          subtitle="Operate monthly provider payments from beneficiary validation through approval, settlement, and reconciliation."
          actions={
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleExport} disabled={records.length === 0} className="gap-2">
                <Download size={16} /> Export {selectedIds.length ? `(${selectedIds.length})` : 'Register'}
              </Button>
              <Button variant="secondary" onClick={() => query.refetch()} className="gap-2">
                <RefreshCw size={16} className={query.isFetching ? 'animate-spin' : ''} /> Refresh
              </Button>
            </div>
          }
        />

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard title="Eligible beneficiaries" value={summary.totalBeneficiaries.toLocaleString()} subtitle={`${summary.totalProviders} providers in view`} icon={<WalletCards size={20} />} tone="primary" />
          <KpiCard title="Gross capitation" value={formatNaira(summary.grossAmount)} subtitle="Total liability" icon={<WalletCards size={20} />} tone="info" />
          <KpiCard title="Net payable" value={formatNaira(summary.netPayable)} subtitle={`${formatNaira(summary.deductions)} deductions`} icon={<CheckCircle2 size={20} />} tone="success" />
          <KpiCard title="Outstanding" value={formatNaira(summary.outstandingAmount)} subtitle={`${summary.pendingApprovals} pending approval`} icon={<FileWarning size={20} />} tone="warning" />
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <ChartCard title="Monthly capitation trend" subtitle="Gross, net payable, and paid amounts.">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <defs><linearGradient id="grossFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0b3d91" stopOpacity={0.1} /><stop offset="100%" stopColor="#0b3d91" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                  <XAxis dataKey="period" tickFormatter={formatPeriod} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => `₦${Math.round(v / 1000000)}m`} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip formatter={v => formatNaira(Number(v))} labelFormatter={l => formatPeriod(String(l))} />
                  <Area type="monotone" dataKey="gross" name="Gross" stroke="#0b3d91" fill="url(#grossFill)" strokeWidth={2} />
                  <Area type="monotone" dataKey="net" name="Net payable" stroke="#0f9d8a" fill="transparent" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="By facility type" subtitle="Net payable concentration.">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byType.slice(0, 6)} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef2f7" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="label" type="category" width={100} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => formatNaira(Number(v))} />
                  <Bar dataKey="value" name="Net payable" radius={[0, 4, 4, 0]}>
                    {byType.slice(0, 6).map((_, i) => <Cell key={i} fill={chartColors[i % chartColors.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="By ownership" subtitle="Provider ownership mix.">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byOwnership} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4}>
                    {byOwnership.map((_, i) => <Cell key={i} fill={chartColors[i % chartColors.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => formatNaira(Number(v))} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </section>

        {/* Register Section */}
        <div className="nmis-card p-4 sm:p-5 space-y-5">
          <SectionHeader
            title="Capitation Register"
            subtitle="Search, filter, and action provider-level monthly payment records."
            actions={
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setFilters(DEFAULT_CAPITATION_FILTERS)}>Reset</Button>
                {selectedIds.length > 0 && <Button size="sm">Action Selected ({selectedIds.length})</Button>}
              </div>
            }
          />

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative lg:col-span-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-subtle" />
              <Input
                value={filters.search}
                onChange={e => updateFilter('search', e.target.value)}
                placeholder="Search code, facility, LGA..."
                className="pl-10"
              />
            </div>
            <Select
              label="Period"
              value={filters.period}
              options={[{ label: 'All periods', value: 'all' }, ...periods.map(p => ({ label: formatPeriod(p), value: p }))]}
              onChange={e => updateFilter('period', e.target.value)}
            />
            <Select
              label="Facility type"
              value={filters.facilityType}
              options={[{ label: 'All types', value: 'all' }, ...PROVIDER_CATEGORIES.map(c => ({ label: c, value: c }))]}
              onChange={e => updateFilter('facilityType', e.target.value as any)}
            />
            <Select
              label="Ownership"
              value={filters.ownership}
              options={[{ label: 'All ownerships', value: 'all' }, ...PROVIDER_OWNERSHIPS.map(o => ({ label: o, value: o }))]}
              onChange={e => updateFilter('ownership', e.target.value as any)}
            />
          </div>

          <div className="nmis-table-wrap">
            <div className="overflow-x-auto">
              <table className="nmis-table">
                <thead>
                  <tr>
                    <th className="w-12 px-4"><input type="checkbox" className="h-4 w-4 rounded border-brand-border text-brand-blue" onChange={() => {
                      const pageIds = visibleRecords.map(r => r.id);
                      const allSelected = pageIds.every(id => selectedIds.includes(id));
                      setSelectedIds(allSelected ? selectedIds.filter(id => !pageIds.includes(id)) : [...new Set([...selectedIds, ...pageIds])]);
                    }} /></th>
                    <th>Provider / Facility</th>
                    <th>Classification</th>
                    <th>Location</th>
                    <th>Period</th>
                    <th className="text-right">Amount</th>
                    <th className="text-right">Net Payable</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {query.isLoading ? (
                    <tr><td colSpan={9} className="py-12 text-center text-brand-muted">Loading records...</td></tr>
                  ) : records.length === 0 ? (
                    <tr><td colSpan={9} className="py-12 text-center text-brand-muted">No capitation records found.</td></tr>
                  ) : (
                    visibleRecords.map(record => (
                      <tr key={record.id}>
                        <td className="px-4"><input type="checkbox" checked={selectedIds.includes(record.id)} onChange={() => setSelectedIds(curr => curr.includes(record.id) ? curr.filter(id => id !== record.id) : [...curr, record.id])} className="h-4 w-4 rounded border-brand-border text-brand-blue" /></td>
                        <td className="font-semibold text-brand-foreground">{record.facilityName}<span className="block text-[10px] text-brand-muted font-bold uppercase">{record.providerCode}</span></td>
                        <td><div className="text-xs font-bold text-brand-secondary">{record.facilityType}</div><div className="text-[10px] text-brand-muted">{record.ownership}</div></td>
                        <td><div className="text-xs">{record.state}</div><div className="text-[10px] text-brand-muted">{record.lga}</div></td>
                        <td><Badge variant="default">{formatPeriod(record.period)}</Badge></td>
                        <td className="text-right font-medium">{formatNaira(record.grossAmount)}</td>
                        <td className="text-right font-black text-brand-foreground">{formatNaira(record.netPayable)}</td>
                        <td><Badge variant={statusVariant(record.approvalStatus)}>{CAPITATION_STATUS_LABELS[record.approvalStatus]}</Badge></td>
                        <td className="text-right"><Button variant="ghost" size="sm" onClick={() => setSelectedRecordId(record.id)}><ChevronRight size={14} /></Button></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-brand-divider p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-muted">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={16} /></Button>
                <Button variant="secondary" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={16} /></Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
