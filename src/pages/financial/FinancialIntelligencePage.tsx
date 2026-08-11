import { useState } from 'react';
import { BarChart3, Filter, Link as LinkIcon, MapPin, Users, WalletCards } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFinancialIntelligence } from '../../hooks/financial-intelligence/financialIntelligenceHooks';
import { FinancialIntelligenceFilters } from '../../types/financial-intelligence';
import ActiveFilterChips from '../../components/ui/ActiveFilterChips';

function formatNaira(value: number): string {
  if (value >= 1_000_000_000) return `₦${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(2)}M`;
  return `₦${Math.round(value).toLocaleString('en-NG')}`;
}

function formatLabel(value: string) {
  return value.replace('-', ' ').replace(/\b\w/g, letter => letter.toUpperCase());
}

export default function FinancialIntelligencePage() {
  const [filters, setFilters] = useState<FinancialIntelligenceFilters>({ dataType: 'all', sector: 'all' });
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const { data, isLoading, isError } = useFinancialIntelligence(filters);

  const updateFilter = <K extends keyof FinancialIntelligenceFilters>(key: K, value: FinancialIntelligenceFilters[K]) => {
    setFilters(previous => ({ ...previous, [key]: value || undefined }));
  };

  const clearFilters = () => setFilters({ dataType: 'all', sector: 'all' });
  const maxProviderValue = data?.providerRanking[0]?.value || 1;
  const maxLgaValue = data?.lgaRanking[0]?.value || 1;
  const activeFilterChips = [
    filters.period ? { id: 'period', label: 'Period', value: filters.period } : null,
    filters.dataType && filters.dataType !== 'all' ? { id: 'dataType', label: 'Funding', value: formatLabel(filters.dataType) } : null,
    filters.sector && filters.sector !== 'all' ? { id: 'sector', label: 'Sector', value: formatLabel(filters.sector) } : null,
    filters.state ? { id: 'state', label: 'State', value: filters.state } : null,
    filters.lga ? { id: 'lga', label: 'LGA', value: filters.lga } : null,
    filters.facilityType ? { id: 'facilityType', label: 'Facility', value: filters.facilityType } : null,
    filters.ownership ? { id: 'ownership', label: 'Ownership', value: filters.ownership } : null,
  ].filter((chip): chip is { id: string; label: string; value: string } => Boolean(chip));

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-blue">Analytics & reports</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Financial Intelligence</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">Unify Claims, Capitation, FFS, Enrolment, and Provider Directory data to understand where the network spends and how population coverage relates to expenditure.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/financial/dashboard" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><WalletCards className="h-4 w-4" />Financial Overview</Link>
            <Link to="/population/enrolment" className="inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-3 py-2 text-sm font-semibold text-white hover:bg-brand-navy"><Users className="h-4 w-4" />Population Overview</Link>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700"><Filter className="h-4 w-4" />Filters</div>
          <select aria-label="Reporting period" value={filters.period || 'all'} onChange={event => updateFilter('period', event.target.value === 'all' ? undefined : event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
            <option value="all">All periods</option><option value="2026-08">August 2026</option><option value="2026-07">July 2026</option><option value="2026-06">June 2026</option><option value="2026-05">May 2026</option>
          </select>
          <select aria-label="Funding type" value={filters.dataType || 'all'} onChange={event => updateFilter('dataType', event.target.value as FinancialIntelligenceFilters['dataType'])} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
            <option value="all">All funding types</option><option value="claims">Claims</option><option value="capitation">Capitation</option><option value="ffs">Fee-for-Service</option>
          </select>
          <select aria-label="Sector" value={filters.sector || 'all'} onChange={event => updateFilter('sector', event.target.value as FinancialIntelligenceFilters['sector'])} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
            <option value="all">All sectors</option><option value="formal">Formal</option><option value="informal">Informal</option>
          </select>
          <button type="button" onClick={() => setMoreFiltersOpen(value => !value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">{moreFiltersOpen ? 'Hide filters' : 'More filters'}</button>
          <button type="button" onClick={clearFilters} className="ml-auto rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-white hover:text-slate-900">Clear</button>
        </div>
        <ActiveFilterChips chips={activeFilterChips} onRemove={id => setFilters(previous => ({ ...previous, [id]: id === 'dataType' ? 'all' : id === 'sector' ? 'all' : undefined }))} onClear={clearFilters} />
        {moreFiltersOpen ? <div className="mt-3 grid gap-3 rounded-2xl border border-slate-200 p-3 sm:grid-cols-2 lg:grid-cols-4">
          <input aria-label="LGA" placeholder="LGA" value={filters.lga || ''} onChange={event => updateFilter('lga', event.target.value || undefined)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <input aria-label="State" placeholder="State" value={filters.state || ''} onChange={event => updateFilter('state', event.target.value || undefined)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <input aria-label="Facility type" placeholder="Facility type" value={filters.facilityType || ''} onChange={event => updateFilter('facilityType', event.target.value || undefined)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <input aria-label="Ownership" placeholder="Ownership" value={filters.ownership || ''} onChange={event => updateFilter('ownership', event.target.value || undefined)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        </div> : null}
      </section>

      {isLoading ? <div className="grid gap-4 md:grid-cols-4"><div className="h-28 animate-pulse rounded-3xl bg-slate-200" /><div className="h-28 animate-pulse rounded-3xl bg-slate-200" /><div className="h-28 animate-pulse rounded-3xl bg-slate-200" /><div className="h-28 animate-pulse rounded-3xl bg-slate-200" /></div> : null}
      {isError ? <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">Financial Intelligence could not be loaded. Check the active repository mode and try again.</div> : null}
      {data ? <>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['Total expenditure', formatNaira(data.totalExpenditure), 'Claims + Capitation + FFS', 'text-brand-blue'],
            ['Claims expenditure', formatNaira(data.claimsExpenditure), 'Processed payment data', 'text-sky-700'],
            ['Capitation expenditure', formatNaira(data.capitationExpenditure), 'Normalized capitation', 'text-emerald-700'],
            ['FFS expenditure', formatNaira(data.ffsExpenditure), 'Fee-for-Service records', 'text-amber-700'],
            ['Total enrolment', data.totalEnrolment.toLocaleString(), `${data.formalEnrolment} formal · ${data.informalEnrolment} informal`, 'text-indigo-700'],
            ['PEPM', formatNaira(data.pepm), 'Expenditure per enrollee', 'text-rose-700'],
            ['Providers represented', data.providerCount.toLocaleString(), `${data.financialRecordCount} financial records`, 'text-slate-700'],
            ['Filter context', filters.sector === 'all' ? 'All sectors' : formatLabel(filters.sector || ''), filters.dataType === 'all' ? 'All funding types' : formatLabel(filters.dataType || ''), 'text-slate-700'],
          ].map(([label, value, subtitle, color]) => <div key={label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{label}</p><p className={`mt-3 text-2xl font-semibold ${color}`}>{value}</p><p className="mt-1 text-xs text-slate-500">{subtitle}</p></div>)}
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
            <div className="flex items-center justify-between"><div><h3 className="text-lg font-semibold text-slate-900">Provider expenditure ranking</h3><p className="mt-1 text-sm text-slate-500">Which facilities account for the most expenditure?</p></div><BarChart3 className="h-5 w-5 text-slate-400" /></div>
            <div className="mt-5 space-y-4">{data.providerRanking.map((item, index) => <div key={item.name}><div className="mb-1 flex items-center justify-between gap-3 text-sm"><span className="flex min-w-0 items-center gap-2 text-slate-700"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">{index + 1}</span><span className="truncate">{item.name}</span></span><span className="shrink-0 font-semibold text-slate-900">{formatNaira(item.value)}</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-brand-blue" style={{ width: `${Math.max((item.value / maxProviderValue) * 100, 3)}%` }} /></div></div>)}</div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
            <div className="flex items-center justify-between"><div><h3 className="text-lg font-semibold text-slate-900">LGA expenditure ranking</h3><p className="mt-1 text-sm text-slate-500">Where is network spending concentrated?</p></div><MapPin className="h-5 w-5 text-slate-400" /></div>
            <div className="mt-5 space-y-4">{data.lgaRanking.map(item => <div key={item.name}><div className="mb-1 flex items-center justify-between gap-3 text-sm"><span className="truncate text-slate-700">{item.name}</span><span className="shrink-0 font-semibold text-slate-900">{formatNaira(item.value)}</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.max((item.value / maxLgaValue) * 100, 3)}%` }} /></div></div>)}</div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6"><div className="flex items-center justify-between"><div><h3 className="text-lg font-semibold text-slate-900">Monthly expenditure trend</h3><p className="mt-1 text-sm text-slate-500">Reporting-period expenditure after current filters.</p></div><WalletCards className="h-5 w-5 text-slate-400" /></div><div className="mt-6 flex items-end gap-3 overflow-x-auto pb-2">{data.monthlyTrend.map(item => { const max = Math.max(...data.monthlyTrend.map(point => point.value), 1); return <div key={item.name} className="flex min-w-20 flex-1 flex-col items-center gap-2"><div className="flex h-44 w-full items-end rounded-xl bg-slate-50 p-2"><div className="w-full rounded-lg bg-brand-blue transition-all" style={{ height: `${Math.max((item.value / max) * 100, 4)}%` }} title={`${item.name}: ${formatNaira(item.value)}`} /></div><span className="text-xs font-semibold text-slate-600">{item.name}</span><span className="text-[11px] text-slate-400">{formatNaira(item.value)}</span></div>; })}</div></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6"><h3 className="text-lg font-semibold text-slate-900">Funding mix</h3><p className="mt-1 text-sm text-slate-500">Use the mix to compare processed funding streams.</p><div className="mt-5 space-y-4">{data.expenditureMix.map(item => <div key={item.name} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"><span className="font-semibold capitalize text-slate-700">{formatLabel(item.name)}</span><span className="font-semibold text-slate-900">{formatNaira(item.value)}</span></div>)}</div><div className="mt-5 flex items-start gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-500"><LinkIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" />Financial records are joined to normalized enrolment by Provider ID and reporting period. PEPM is analytical and does not rewrite Claims Department adjudication or payment records.</div></div>
        </section>
      </> : null}
    </div>
  );
}
