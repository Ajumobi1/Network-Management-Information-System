import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Building2,
  Calendar,
  Download,
  FileText,
  Filter,
  Search,
  Users,
} from 'lucide-react';
import { ProviderCategory, ProviderOwnership } from '../../constants/providerNetwork';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import {
  useFinancialRecords,
  useFinancialRegisterSummary,
} from '../../hooks/financial-data/financialDataHooks';
import { FinancialDataType, FinancialRecord } from '../../types/financial-data';
import type { FinancialFilters, FinancialRegisterSummary } from '../../repositories/financial-data/financialDataRepository';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  type: FinancialDataType;
}

const claimCategories = ['Outpatient', 'Inpatient', 'Pharmaceuticals', 'Diagnostics', 'Dental', 'Specialist Services'];
const months = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
  { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
  { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' },
];

export default function FinancialRegisterPage({ type }: Props) {
  const isClaims = type === 'claims';
  const [search, setSearch] = useState('');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [facilityType, setFacilityType] = useState('');
  const [ownership, setOwnership] = useState('');
  const [state, setState] = useState('');
  const [lga, setLga] = useState('');
  const [claimsCategory, setClaimsCategory] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  const filters = useMemo<FinancialFilters>(() => ({
    dataType: type,
    search: search || undefined,
    year: year ? Number(year) : undefined,
    month: month ? Number(month) : undefined,
    facilityType: facilityType || undefined,
    ownership: ownership || undefined,
    state: state || undefined,
    lga: lga || undefined,
    claimsCategory: isClaims && claimsCategory ? claimsCategory : undefined,
    minAmount: minAmount ? Number(minAmount) : undefined,
    maxAmount: maxAmount ? Number(maxAmount) : undefined,
  }), [claimsCategory, facilityType, isClaims, lga, maxAmount, minAmount, month, ownership, search, state, type, year]);

  const { data: records = [], isLoading } = useFinancialRecords(filters);
  const { data: summary, isLoading: isSummaryLoading } = useFinancialRegisterSummary(filters);
  const title = getTitle(type);

  const clearFilters = () => {
    setSearch(''); setYear(''); setMonth(''); setFacilityType(''); setOwnership('');
    setState(''); setLga(''); setClaimsCategory(''); setMinAmount(''); setMaxAmount('');
  };

  const exportCsv = () => {
    if (records.length === 0) return;
    const headers = isClaims
      ? ['Provider Code', 'Facility Name', 'Facility Type', 'Ownership', 'State', 'LGA', 'Period', 'Claims Category', 'Claim Count', 'Submitted Amount', 'Approved/Paid Amount', 'Rejected/Disallowed Amount', 'Net Paid Amount', 'Source File', 'Import Batch']
      : ['Provider Code', 'Provider Name', 'Facility Type', 'Ownership', 'State', 'LGA', 'Period', 'Amount', 'Source File', 'Import Batch'];
    const rows = records.map(record => isClaims
      ? [record.providerCode, record.providerName, record.facilityType, record.ownership, record.state, record.lga, record.period, record.claimsCategory, record.claimCount ?? record.encounterCount, record.amountSubmitted ?? record.amountClaimed, record.amountApproved ?? record.amountPaid, record.amountRejected ?? record.amountDisallowed, record.netAmountPaid ?? record.amountPaid, record.sourceFile, record.importBatchId]
      : [record.providerCode, record.providerName, record.facilityType, record.ownership, record.state, record.lga, record.period, record.amountPaid ?? record.netAmount ?? record.amount, record.sourceFile, record.importBatchId]);
    const csv = [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}-financial-register.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-1 text-slate-500">{isClaims ? 'Processed Claims/payment data for Network Management analysis.' : `Analytics and monitoring for normalized ${type} datasets.`}</p>
        </div>
        <Button variant="secondary" className="flex items-center gap-2 py-2" onClick={exportCsv} disabled={records.length === 0}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <SummaryGrid summary={summary} isClaims={isClaims} isLoading={isSummaryLoading} />

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input type="search" placeholder="Search provider, code, facility, state, or LGA..." className="w-full rounded-2xl border-slate-200 py-3 pl-12 text-sm focus:ring-brand-blue" value={search} onChange={event => setSearch(event.target.value)} />
          </div>
          <Button variant="secondary" className="flex items-center gap-2 py-3" onClick={clearFilters}><Filter className="h-4 w-4" /> Clear filters</Button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          <Select label="Year" value={year} onChange={setYear} options={['2026', '2025']} placeholder="All years" />
          <Select label="Month" value={month} onChange={setMonth} options={months.map(item => String(item.value))} optionLabels={months.map(item => item.label)} placeholder="All months" />
          <Select label="Facility type" value={facilityType} onChange={setFacilityType} options={Object.values(ProviderCategory)} placeholder="All facility types" />
          <Select label="Ownership" value={ownership} onChange={setOwnership} options={Object.values(ProviderOwnership)} placeholder="All ownerships" />
          {isClaims && <Select label="Claims category" value={claimsCategory} onChange={setClaimsCategory} options={claimCategories} placeholder="All categories" />}
          <input aria-label="State filter" placeholder="State" className="rounded-xl border-slate-200 text-sm" value={state} onChange={event => setState(event.target.value)} />
          <input aria-label="LGA filter" placeholder="LGA" className="rounded-xl border-slate-200 text-sm" value={lga} onChange={event => setLga(event.target.value)} />
          <input aria-label="Minimum amount filter" inputMode="decimal" placeholder="Min amount" className="rounded-xl border-slate-200 text-sm" value={minAmount} onChange={event => setMinAmount(event.target.value.replace(/[^0-9.]/g, ''))} />
          <input aria-label="Maximum amount filter" inputMode="decimal" placeholder="Max amount" className="rounded-xl border-slate-200 text-sm" value={maxAmount} onChange={event => setMaxAmount(event.target.value.replace(/[^0-9.]/g, ''))} />
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-5">
          <div><h2 className="font-bold text-slate-900">{isClaims ? 'Processed Claims Register' : `${title} Records`}</h2><p className="mt-1 text-xs text-slate-500">{records.length.toLocaleString()} records match the current filters.</p></div>
          <Badge variant="info">Source traceable</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr>
              <th className="px-6 py-4">Provider / Facility</th><th className="px-6 py-4">Classification</th><th className="px-6 py-4">Location</th><th className="px-6 py-4">Period</th>
              {isClaims && <th className="px-6 py-4">Category</th>}{isClaims && <th className="px-6 py-4 text-right">Claims</th>}
              <th className="px-6 py-4 text-right">{isClaims ? 'Submitted' : 'Amount'}</th><th className="px-6 py-4 text-right">{isClaims ? 'Paid / Approved' : 'Net payable'}</th>
              {isClaims && <th className="px-6 py-4 text-right">Rejected</th>}<th className="px-6 py-4">Source</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">{isLoading ? <LoadingRows columnCount={isClaims ? 10 : 7} /> : records.length === 0 ? <EmptyRow columnCount={isClaims ? 10 : 7} /> : records.map(record => <RecordRow key={record.id} record={record} isClaims={isClaims} />)}</tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

type SummaryCard = { label: string; value: string; icon: React.ComponentType<{ className?: string }> };

function SummaryGrid({ summary, isClaims, isLoading }: { summary?: FinancialRegisterSummary; isClaims: boolean; isLoading: boolean }) {
  const cards: SummaryCard[] = isClaims
    ? [
      { label: 'Total records', value: summary?.totalRecords.toLocaleString() ?? '0', icon: FileText },
      { label: 'Total claim count', value: summary?.totalClaimCount.toLocaleString() ?? '0', icon: Users },
      { label: 'Submitted amount', value: formatNaira(summary?.totalSubmittedAmount ?? 0), icon: BarChart3 },
      { label: 'Approved / paid', value: formatNaira(summary?.totalApprovedAmount ?? 0), icon: BarChart3 },
      { label: 'Rejected / disallowed', value: formatNaira(summary?.totalRejectedAmount ?? 0), icon: BarChart3 },
      { label: 'Average claim value', value: formatNaira(summary?.averageClaimValue ?? 0), icon: BarChart3 },
      { label: 'Provider count', value: summary?.providerCount.toLocaleString() ?? '0', icon: Building2 },
    ]
    : [
      { label: 'Total records', value: summary?.totalRecords.toLocaleString() ?? '0', icon: FileText },
      { label: 'Total amount', value: formatNaira(summary?.totalPaidAmount ?? 0), icon: BarChart3 },
      { label: 'Average amount', value: formatNaira(summary?.averageClaimValue ?? 0), icon: BarChart3 },
      { label: 'Provider count', value: summary?.providerCount.toLocaleString() ?? '0', icon: Building2 },
    ];

  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">{cards.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-2"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</span><Icon className="h-4 w-4 text-brand-blue" /></div><p className={`mt-3 text-xl font-black text-slate-900 ${isLoading ? 'animate-pulse opacity-50' : ''}`}>{value}</p></div>)}</div>;
}

function RecordRow({ record, isClaims }: { record: FinancialRecord; isClaims: boolean }) {
  return <tr className="hover:bg-slate-50/60">
    <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="rounded-xl bg-slate-100 p-2 text-slate-500"><Building2 className="h-4 w-4" /></div><div><p className="font-bold text-slate-900">{record.providerName}</p><p className="text-xs text-slate-500">{record.providerCode || 'Provider code unavailable'}</p></div></div></td>
    <td className="px-6 py-4"><div className="font-medium text-slate-700">{record.facilityType || 'Unclassified'}</div><div className="text-xs text-slate-500">{record.ownership || 'Ownership unavailable'}</div></td>
    <td className="px-6 py-4"><div className="font-medium text-slate-700">{record.state || 'State unavailable'}</div><div className="text-xs text-slate-500">{record.lga || 'LGA unavailable'}</div></td>
    <td className="px-6 py-4"><div className="flex items-center gap-2 font-medium text-slate-700"><Calendar className="h-4 w-4 text-slate-400" />{record.period}</div></td>
    {isClaims && <td className="px-6 py-4"><Badge variant="info">{record.claimsCategory || 'Uncategorised'}</Badge></td>}
    {isClaims && <td className="px-6 py-4 text-right font-bold text-slate-700">{(record.claimCount ?? record.encounterCount ?? 0).toLocaleString()}</td>}
    <td className="px-6 py-4 text-right font-semibold text-slate-700">{formatNaira(isClaims ? (record.amountSubmitted ?? record.amountClaimed ?? 0) : (record.amountPaid ?? record.amount ?? 0))}</td>
    <td className="px-6 py-4 text-right font-black text-slate-900">{formatNaira(isClaims ? (record.netAmountPaid ?? record.amountPaid ?? record.amountApproved ?? 0) : (record.netAmountPaid ?? record.amountPaid ?? record.netAmount ?? record.amount ?? 0))}</td>
    {isClaims && <td className="px-6 py-4 text-right font-semibold text-rose-600">{formatNaira(record.amountRejected ?? record.amountDisallowed ?? 0)}</td>}
    <td className="px-6 py-4">
      <div className="flex flex-col gap-1">
        <div className="max-w-[180px] truncate text-xs font-medium text-slate-600" title={record.sourceFile}>{record.sourceFile}</div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-slate-400">{record.importBatchId}</span>
          {record.recordStatus === 'duplicate' && <Badge variant="warning" className="text-[9px] px-1.5 py-0">Duplicate</Badge>}
        </div>
      </div>
    </td>
  </tr>;
}

function Select({ label, value, onChange, options, optionLabels, placeholder }: { label: string; value: string; onChange: (value: string) => void; options: string[]; optionLabels?: string[]; placeholder: string }) {
  return <label className="space-y-1 text-xs font-semibold text-slate-500"><span>{label}</span><select className="w-full rounded-xl border-slate-200 text-sm font-normal text-slate-700" value={value} onChange={event => onChange(event.target.value)}><option value="">{placeholder}</option>{options.map((option, index) => <option key={option} value={option}>{optionLabels?.[index] ?? option}</option>)}</select></label>;
}

function LoadingRows({ columnCount }: { columnCount: number }) { return <>{Array.from({ length: 5 }).map((_, index) => <tr key={index} className="animate-pulse"><td colSpan={columnCount} className="px-6 py-6"><div className="h-10 rounded-xl bg-slate-100" /></td></tr>)}</>; }
function EmptyRow({ columnCount }: { columnCount: number }) { return <tr><td colSpan={columnCount} className="px-6 py-20 text-center"><FileText className="mx-auto h-12 w-12 text-slate-200" /><p className="mt-3 font-semibold text-slate-600">No normalized records found</p><p className="mt-1 text-sm text-slate-400">Try adjusting the filters or upload a processed dataset.</p></td></tr>; }
function getTitle(type: FinancialDataType) { return ({ claims: 'Claims Register', capitation: 'Capitation Register', ffs: 'FFS Register', enrolment: 'Enrolment Register', 'provider-network': 'Network Register', other: 'Financial Register' } as Record<FinancialDataType, string>)[type]; }
function formatNaira(amount: number) { return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(Number.isFinite(amount) ? amount : 0); }
function csvCell(value: unknown) { const text = value === undefined || value === null ? '' : String(value); return `"${text.replace(/"/g, '""')}"`; }
