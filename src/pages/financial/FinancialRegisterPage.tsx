import React, { useMemo, useState } from 'react';
import { BarChart3, Building2, Calendar, Download, FileText, Filter, Search, Users, ChevronLeft, ChevronRight, ArrowDownUp } from 'lucide-react';
import { ProviderCategory, ProviderOwnership } from '../../constants/providerNetwork';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import KpiCard from '../../components/ui/KpiCard';
import PageHeader from '../../components/ui/PageHeader';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { useFinancialRecords, useFinancialRegisterSummary } from '../../hooks/financial-data/financialDataHooks';
import { FinancialDataType, FinancialRecord } from '../../types/financial-data';
import type { FinancialFilters, FinancialRegisterSummary } from '../../repositories/financial-data/financialDataRepository';
import ActiveFilterChips from '../../components/ui/ActiveFilterChips';
import { LoadingState, ErrorState } from '../../components/ui/FeedbackStates';
import { SectionHeader } from '../../components/ui/LayoutComponents';
import { isSecureContractError } from '../../lib/security/secureContracts';

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

const formatNaira = (amount: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);
const csvCell = (value: unknown) => { const text = value === undefined || value === null ? '' : String(value); return `"${text.replace(/"/g, '""')}"`; };

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
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);

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

  const { data: records = [], isLoading, isError, error, refetch } = useFinancialRecords(filters);
  const { data: summary, isLoading: isSummaryLoading } = useFinancialRegisterSummary(filters);

  const title = type === 'claims' ? 'Claims Register' : type === 'capitation' ? 'Capitation Analysis' : type === 'ffs' ? 'FFS Register' : 'Enrolment Financials';

  const clearFilters = () => {
    setSearch(''); setYear(''); setMonth(''); setFacilityType(''); setOwnership('');
    setState(''); setLga(''); setClaimsCategory(''); setMinAmount(''); setMaxAmount('');
  };

  const activeFilterChips = [
    search ? { id: 'search', label: 'Search', value: search } : null,
    year ? { id: 'year', label: 'Year', value: year } : null,
    month ? { id: 'month', label: 'Month', value: months.find(item => String(item.value) === month)?.label || month } : null,
    facilityType ? { id: 'facilityType', label: 'Facility', value: facilityType } : null,
    ownership ? { id: 'ownership', label: 'Ownership', value: ownership } : null,
    state ? { id: 'state', label: 'State', value: state } : null,
    lga ? { id: 'lga', label: 'LGA', value: lga } : null,
    isClaims && claimsCategory ? { id: 'claimsCategory', label: 'Category', value: claimsCategory } : null,
    minAmount ? { id: 'minAmount', label: 'Minimum', value: formatNaira(Number(minAmount)) } : null,
    maxAmount ? { id: 'maxAmount', label: 'Maximum', value: formatNaira(Number(maxAmount)) } : null,
  ].filter((chip): chip is { id: string; label: string; value: string } => Boolean(chip));

  const removeFilter = (id: string) => {
    if (id === 'search') setSearch('');
    if (id === 'year') setYear('');
    if (id === 'month') setMonth('');
    if (id === 'facilityType') setFacilityType('');
    if (id === 'ownership') setOwnership('');
    if (id === 'state') setState('');
    if (id === 'lga') setLga('');
    if (id === 'claimsCategory') setClaimsCategory('');
    if (id === 'minAmount') setMinAmount('');
    if (id === 'maxAmount') setMaxAmount('');
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
    link.download = `nmis-${type}-register.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isError) return <main className="nmis-page"><ErrorState title={isSecureContractError(error) ? 'Secure financial register unavailable' : 'Financial data unavailable'} description={isSecureContractError(error) ? 'No raw financial records were loaded. This register requires an approved financial-reader contract.' : undefined} action={{ label: 'Retry', onClick: () => refetch() }} /></main>;

  return (
    <main className="nmis-page">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Financial Intelligence"
          title={title}
          subtitle={isClaims ? 'Processed Claims and payment datasets for Network Management analysis.' : `Operational monitoring for normalized ${type} expenditure.`}
          actions={<Button variant="secondary" onClick={exportCsv} disabled={records.length === 0} className="gap-2"><Download size={16} /> Export CSV</Button>}
        />

        <SummaryGrid summary={summary} isClaims={isClaims} isLoading={isSummaryLoading} />

        {/* Filter Section */}
        <section className="nmis-card p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-subtle" />
              <Input placeholder="Search provider, code, facility, state, or LGA..." className="pl-10" value={search} onChange={event => setSearch(event.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select label="Year" value={year} onChange={e => setYear(e.target.value)} options={['2026', '2025'].map(y => ({ label: y, value: y }))} placeholder="All years" className="w-32" />
              <Select label="Month" value={month} onChange={e => setMonth(e.target.value)} options={months.map(m => ({ label: m.label, value: m.value }))} placeholder="All months" className="w-40" />
              <Button variant="secondary" onClick={() => setMoreFiltersOpen(!moreFiltersOpen)} className="h-[2.625rem] gap-2">
                <Filter size={16} /> {moreFiltersOpen ? 'Hide' : 'More'}
              </Button>
              <Button variant="secondary" onClick={clearFilters} className="h-[2.625rem]">Reset</Button>
            </div>
          </div>

          {moreFiltersOpen && (
            <div className="mt-4 grid gap-4 rounded-panel border border-brand-divider bg-brand-surface/50 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <Select label="Facility Type" value={facilityType} onChange={e => setFacilityType(e.target.value)} options={Object.values(ProviderCategory).map(c => ({ label: c, value: c }))} placeholder="All types" />
              <Select label="Ownership" value={ownership} onChange={e => setOwnership(e.target.value)} options={Object.values(ProviderOwnership).map(o => ({ label: o, value: o }))} placeholder="All ownerships" />
              {isClaims && <Select label="Category" value={claimsCategory} onChange={e => setClaimsCategory(e.target.value)} options={claimCategories.map(c => ({ label: c, value: c }))} placeholder="All categories" />}
              <Input label="State" placeholder="Filter state" value={state} onChange={e => setState(e.target.value)} />
              <Input label="LGA" placeholder="Filter LGA" value={lga} onChange={e => setLga(e.target.value)} />
              <Input label="Min Amount" placeholder="₦0.00" value={minAmount} onChange={e => setMinAmount(e.target.value.replace(/[^0-9.]/g, ''))} />
              <Input label="Max Amount" placeholder="₦0.00" value={maxAmount} onChange={e => setMaxAmount(e.target.value.replace(/[^0-9.]/g, ''))} />
            </div>
          )}
          <ActiveFilterChips chips={activeFilterChips} onRemove={removeFilter} onClear={clearFilters} />
        </section>

        {/* Table Section */}
        <div className="nmis-table-wrap">
          <div className="flex flex-col gap-3 border-b border-brand-divider bg-brand-surface/70 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-brand-foreground">{isClaims ? 'Claims Register' : `${type.toUpperCase()} Register`}</h2>
              <p className="nmis-helper">{records.length.toLocaleString()} matching records in current context.</p>
            </div>
            <Badge variant="info" className="w-fit">Source Traceable</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="nmis-table min-w-[1200px]">
              <thead>
                <tr>
                  <th>Provider / Facility</th>
                  <th>Classification</th>
                  <th>Location</th>
                  <th>Period</th>
                  {isClaims && <th>Category</th>}
                  {isClaims && <th className="text-right">Claims</th>}
                  <th className="text-right">{isClaims ? 'Submitted' : 'Amount'}</th>
                  <th className="text-right">{isClaims ? 'Net Paid' : 'Net Payable'}</th>
                  {isClaims && <th className="text-right">Rejected</th>}
                  <th className="text-center">Source</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={isClaims ? 10 : 7} className="py-20 text-center"><LoadingState title="Fetching records..." /></td></tr>
                ) : records.length === 0 ? (
                  <tr><td colSpan={isClaims ? 10 : 7} className="py-20 text-center text-brand-muted">No financial records match the current filter set.</td></tr>
                ) : (
                  records.map(record => (
                    <tr key={record.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl bg-brand-soft p-2 text-brand-blue"><Building2 size={16} /></div>
                          <div>
                            <p className="font-bold text-brand-foreground">{record.providerName}</p>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">{record.providerCode}</p>
                          </div>
                        </div>
                      </td>
                      <td><div className="text-xs font-bold text-brand-secondary">{record.facilityType}</div><div className="text-[10px] text-brand-muted">{record.ownership}</div></td>
                      <td><div className="text-xs">{record.state}</div><div className="text-[10px] text-brand-muted">{record.lga}</div></td>
                      <td><Badge variant="default" className="gap-1.5"><Calendar size={12} /> {record.period}</Badge></td>
                      {isClaims && <td><Badge variant="info">{record.claimsCategory || 'Uncategorised'}</Badge></td>}
                      {isClaims && <td className="text-right font-bold">{(record.claimCount ?? record.encounterCount ?? 0).toLocaleString()}</td>}
                      <td className="text-right font-medium">{formatNaira(isClaims ? (record.amountSubmitted ?? 0) : (record.amountPaid ?? 0))}</td>
                      <td className="text-right font-black text-brand-foreground">{formatNaira(record.netAmountPaid ?? record.amountPaid ?? 0)}</td>
                      {isClaims && <td className="text-right font-bold text-status-error">{formatNaira(record.amountRejected ?? 0)}</td>}
                      <td className="text-center">
                        <div className="max-w-[150px] mx-auto truncate text-[10px] font-bold text-brand-muted" title={record.sourceFile}>{record.sourceFile}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between p-4 border-t border-brand-divider">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Register View 1.0</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled><ChevronLeft size={16} /></Button>
              <Button variant="secondary" size="sm" disabled><ChevronRight size={16} /></Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function SummaryGrid({ summary, isClaims, isLoading }: { summary?: FinancialRegisterSummary; isClaims: boolean; isLoading: boolean }) {
  const cards = isClaims
    ? [
      { label: 'Total Records', value: summary?.totalRecords.toLocaleString() ?? '0', tone: 'primary' as const, icon: <FileText size={18} /> },
      { label: 'Claim Count', value: summary?.totalClaimCount.toLocaleString() ?? '0', tone: 'info' as const, icon: <Users size={18} /> },
      { label: 'Submitted', value: formatNaira(summary?.totalSubmittedAmount ?? 0), tone: 'neutral' as const, icon: <BarChart3 size={18} /> },
      { label: 'Paid / Approved', value: formatNaira(summary?.totalApprovedAmount ?? 0), tone: 'success' as const, icon: <BarChart3 size={18} /> },
      { label: 'Rejected', value: formatNaira(summary?.totalRejectedAmount ?? 0), tone: 'danger' as const, icon: <BarChart3 size={18} /> },
      { label: 'Avg Claim', value: formatNaira(summary?.averageClaimValue ?? 0), tone: 'info' as const, icon: <BarChart3 size={18} /> },
      { label: 'Providers', value: summary?.providerCount.toLocaleString() ?? '0', tone: 'primary' as const, icon: <Building2 size={18} /> },
    ]
    : [
      { label: 'Total Records', value: summary?.totalRecords.toLocaleString() ?? '0', tone: 'primary' as const, icon: <FileText size={18} /> },
      { label: 'Total Amount', value: formatNaira(summary?.totalPaidAmount ?? 0), tone: 'success' as const, icon: <BarChart3 size={18} /> },
      { label: 'Avg Amount', value: formatNaira(summary?.averageClaimValue ?? 0), tone: 'info' as const, icon: <BarChart3 size={18} /> },
      { label: 'Providers', value: summary?.providerCount.toLocaleString() ?? '0', tone: 'primary' as const, icon: <Building2 size={18} /> },
    ];

  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">{cards.map((card) => <KpiCard key={card.label} title={card.label} value={card.value} tone={card.tone} icon={card.icon} />)}</div>;
}
