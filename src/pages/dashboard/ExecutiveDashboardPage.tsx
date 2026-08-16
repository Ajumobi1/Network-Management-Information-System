import { useState } from 'react';
import Dashboard2Header from '../../components/dashboard/Dashboard2Header';
import ExecutiveKpiRow from '../../components/dashboard/ExecutiveKpiRow';
import NetworkCoverageSection from '../../components/dashboard/NetworkCoverageSection';
import PopulationIntelligenceSection from '../../components/dashboard/PopulationIntelligenceSection';
import FinancialIntelligenceSummary from '../../components/dashboard/FinancialIntelligenceSummary';
import ManagementAttentionPanel from '../../components/dashboard/ManagementAttentionPanel';
import ActivityAndActions from '../../components/dashboard/ActivityAndActions';
import { useDashboardIntelligence } from '../../hooks/dashboard/dashboardHooks';
import { DashboardFilterOptions, DashboardFilters } from '../../types/dashboard/dashboardIntelligenceTypes';
import { isSecureContractError } from '../../lib/security/secureContracts';

const emptyOptions: DashboardFilterOptions = { years: [], months: [], states: [], lgas: [], facilityTypes: [], ownerships: [] };

function liveCalendarFilters(): DashboardFilters {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1, sector: 'all' };
}

export default function ExecutiveDashboardPage() {
  const [filters, setFilters] = useState<DashboardFilters>(() => liveCalendarFilters());
  const { data: intelligence, isLoading, isFetching, isError, error, refetch } = useDashboardIntelligence(filters);
  const options = intelligence?.filterOptions || emptyOptions;
  const updateFilter = <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => setFilters(previous => ({ ...previous, [key]: value }));
  const clearFilters = () => setFilters(liveCalendarFilters());

  return <div className="space-y-6 pb-4"><Dashboard2Header filters={filters} options={options} reportingPeriod={intelligence?.reportingPeriod || 'All periods'} lastUpdatedAt={intelligence?.lastUpdatedAt} onChange={updateFilter} onClear={clearFilters} />{isFetching && !isLoading ? <div className="flex items-center justify-end gap-2 text-xs font-semibold text-slate-500"><span className="h-2 w-2 animate-pulse rounded-full bg-brand-blue" />Refreshing filtered intelligence…</div> : null}{isLoading ? <DashboardLoadingState /> : null}{isError ? <ErrorState error={error} onRetry={() => refetch()} /> : null}{intelligence ? <><ExecutiveKpiRow intelligence={intelligence} /><NetworkCoverageSection intelligence={intelligence} /><PopulationIntelligenceSection intelligence={intelligence} /><FinancialIntelligenceSummary intelligence={intelligence} /><ManagementAttentionPanel intelligence={intelligence} /><ActivityAndActions intelligence={intelligence} /></> : null}</div>;
}

function DashboardLoadingState() { return <div className="space-y-5" aria-label="Loading dashboard intelligence"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">{Array.from({ length: 7 }).map((_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl bg-slate-200" />)}</div><div className="h-80 animate-pulse rounded-3xl bg-slate-200" /><div className="h-96 animate-pulse rounded-3xl bg-slate-200" /></div>; }
function ErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) { const secure = isSecureContractError(error); return <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-800"><p className="font-semibold">{secure ? 'Secure dashboard intelligence unavailable.' : 'Executive intelligence could not be loaded.'}</p><p className="mt-1 text-sm">{secure ? 'No dashboard metrics or audit activity were fabricated. This page requires the approved aggregate reporting contract.' : 'The dashboard could not read one or more domain repositories. No metrics have been fabricated.'}</p><button type="button" onClick={onRetry} className="mt-4 rounded-xl bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800">Retry</button></div>; }
