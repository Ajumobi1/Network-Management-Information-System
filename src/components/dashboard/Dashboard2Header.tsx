import { useState } from 'react';
import { CalendarDays, ChevronDown, Filter } from 'lucide-react';
import ActiveFilterChips from '../ui/ActiveFilterChips';
import Select from '../ui/Select';
import { DashboardFilters } from '../../types/dashboard/dashboardIntelligenceTypes';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function computeReportingPeriod(filters: DashboardFilters, rpcPeriod?: string): string {
  if (filters.year && filters.month) {
    return `${monthNames[filters.month - 1] || filters.month} ${filters.year}`;
  }
  if (filters.year) {
    return `Full Year ${filters.year}`;
  }
  if (rpcPeriod && rpcPeriod !== 'All periods') {
    const [year, month] = rpcPeriod.split('-');
    if (month && !Number.isNaN(Number(month))) {
      return `${monthNames[Number(month) - 1] || month} ${year}`;
    }
    return rpcPeriod;
  }
  return 'All reporting periods';
}

type Dashboard2HeaderProps = {
  filters: DashboardFilters;
  options: { years: number[]; months: number[]; states: string[]; lgas: string[]; facilityTypes: string[]; ownerships: string[] };
  reportingPeriod: string;
  lastUpdatedAt?: string;
  onChange: <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => void;
  onClear: () => void;
};

export default function Dashboard2Header({ filters, options, reportingPeriod, lastUpdatedAt, onChange, onClear }: Dashboard2HeaderProps) {
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const activeFilterChips = [
    filters.year ? { id: 'year', label: 'Year', value: String(filters.year) } : null,
    filters.month ? { id: 'month', label: 'Month', value: monthNames[filters.month - 1] || String(filters.month) } : null,
    filters.lga ? { id: 'lga', label: 'LGA', value: filters.lga } : null,
    filters.state ? { id: 'state', label: 'State', value: filters.state } : null,
    filters.facilityType ? { id: 'facilityType', label: 'Facility', value: filters.facilityType } : null,
    filters.ownership ? { id: 'ownership', label: 'Ownership', value: filters.ownership } : null,
    filters.sector && filters.sector !== 'all' ? { id: 'sector', label: 'Sector', value: filters.sector } : null,
  ].filter((chip): chip is { id: string; label: string; value: string } => Boolean(chip));

  const removeFilter = (id: string) => {
    if (id === 'year') onChange('year', undefined);
    if (id === 'month') onChange('month', undefined);
    if (id === 'lga') onChange('lga', undefined);
    if (id === 'state') onChange('state', undefined);
    if (id === 'facilityType') onChange('facilityType', undefined);
    if (id === 'ownership') onChange('ownership', undefined);
    if (id === 'sector') onChange('sector', 'all');
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-soft">
      <div className="border-b border-slate-100 bg-slate-950 px-5 py-6 text-white sm:px-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400"><span className="rounded-full bg-white/10 px-3 py-1.5 text-slate-200">Executive Network Intelligence</span><span className="text-slate-500">NMIS command centre</span></div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Network Management Information System</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">A single operating view of provider coverage, population protection, processed expenditure, and the issues requiring management attention.</p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-blue">Reporting context</p><p className="mt-1 text-sm text-slate-500">Analytics below use the same Provider, Enrolment, and Financial filters.</p></div>
          <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-700">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-brand-blue" />
              <span className="mr-1 hidden sm:inline">Reporting period:</span>
              <span className="rounded-xl bg-slate-100 px-3 py-2 text-slate-900">{computeReportingPeriod(filters, reportingPeriod)}</span>
            </div>
            {lastUpdatedAt && (
              <div className="flex items-center gap-2 border-l border-slate-200 pl-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <span className="hidden sm:inline">Last updated:</span>
                <span className="text-slate-600">{new Date(lastUpdatedAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-end gap-3">
          <div className="w-full max-w-[140px]">
            <Select label="Year" value={filters.year ? String(filters.year) : ''} options={options.years.map(y => ({ label: String(y), value: y }))} placeholder="All years" onChange={event => onChange('year', event.target.value ? Number(event.target.value) : undefined)} />
          </div>
          <div className="w-full max-w-[140px]">
            <Select label="Month" value={filters.month ? String(filters.month) : ''} options={options.months.map(m => ({ label: monthNames[m - 1] || String(m), value: m }))} placeholder="All months" onChange={event => onChange('month', event.target.value ? Number(event.target.value) : undefined)} />
          </div>
          <div className="w-full max-w-[180px]">
            <Select label="LGA" value={filters.lga || ''} options={options.lgas.map(l => ({ label: l, value: l }))} placeholder="All LGAs" onChange={event => onChange('lga', event.target.value || undefined)} />
          </div>
          <button type="button" onClick={() => setMoreFiltersOpen(open => !open)} className="inline-flex min-h-[2.625rem] items-center gap-2 rounded-control border border-brand-border px-4 py-2 text-sm font-semibold text-brand-secondary transition hover:bg-brand-surface"><Filter className="h-4 w-4" />{moreFiltersOpen ? 'Hide Filters' : 'More Filters'}<ChevronDown className={`h-4 w-4 transition-transform ${moreFiltersOpen ? 'rotate-180' : ''}`} /></button>
          <button type="button" onClick={onClear} className="min-h-[2.625rem] rounded-control px-4 py-2 text-sm font-semibold text-brand-muted transition hover:bg-brand-surface hover:text-brand-foreground">Clear All</button>
        </div>

        {moreFiltersOpen ? <div className="mt-4 grid gap-4 rounded-panel border border-brand-divider bg-brand-surface/50 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select label="State" value={filters.state || ''} options={options.states.map(s => ({ label: s, value: s }))} placeholder="All states" onChange={event => onChange('state', event.target.value || undefined)} />
          <Select label="Facility type" value={filters.facilityType || ''} options={options.facilityTypes.map(f => ({ label: f, value: f }))} placeholder="All facility types" onChange={event => onChange('facilityType', event.target.value || undefined)} />
          <Select label="Ownership" value={filters.ownership || ''} options={options.ownerships.map(o => ({ label: o, value: o }))} placeholder="All ownerships" onChange={event => onChange('ownership', event.target.value || undefined)} />
          <Select label="Sector" value={filters.sector && filters.sector !== 'all' ? filters.sector : ''} options={[{ label: 'Formal', value: 'formal' }, { label: 'Informal', value: 'informal' }]} placeholder="All sectors" onChange={event => onChange('sector', (event.target.value || 'all') as DashboardFilters['sector'])} />
        </div> : null}
        <ActiveFilterChips chips={activeFilterChips} onRemove={removeFilter} onClear={onClear} />
      </div>
    </section>
  );
}
