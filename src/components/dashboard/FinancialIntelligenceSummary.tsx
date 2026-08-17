import { BarChart3, Building2, CircleDollarSign, MapPin, PieChart as PieChartIcon, RefreshCw } from 'lucide-react';
import { useFinancialIntelligence } from '../../hooks/financial-intelligence/financialIntelligenceHooks';
import { FinancialIntelligenceFilters } from '../../types/financial-intelligence';
import { Dashboard2Intelligence, DashboardFilters } from '../../types/dashboard/dashboardIntelligenceTypes';
import { getProviderCategoryLabel } from '../../constants/providerNetwork';

function formatNaira(value: number): string {
  if (value >= 1_000_000_000) return `₦${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(2)}M`;
  return `₦${Math.round(value).toLocaleString('en-NG')}`;
}

type FinancialIntelligenceSummaryProps = {
  intelligence: Dashboard2Intelligence;
  filters: DashboardFilters;
};

function mapFilters(filters: DashboardFilters): FinancialIntelligenceFilters {
  return {
    year: filters.year,
    month: filters.month,
    state: filters.state,
    lga: filters.lga,
    facilityType: filters.facilityType,
    ownership: filters.ownership,
    sector: filters.sector || 'all',
    dataType: 'all',
  };
}

export default function FinancialIntelligenceSummary({ intelligence, filters }: FinancialIntelligenceSummaryProps) {
  const { data, isLoading, isError, refetch } = useFinancialIntelligence(mapFilters(filters));
  const financial = intelligence.financial || { monthlyTrend: [], byFundingType: [] };
  const monthlyTrend = data?.monthlyTrend || financial.monthlyTrend || [];
  const fundingMix = data?.expenditureMix || financial.byFundingType || [];
  const byState = data?.byState || [];
  const byFacilityType = data?.byFacilityType || [];

  const maxTrend = Math.max(...(monthlyTrend || []).map(item => item.value || 0), 1);
  const maxFunding = Math.max(...(fundingMix || []).map(item => item.value || 0), 1);
  const maxState = byState?.[0]?.value || 1;
  const maxFacilityType = byFacilityType?.[0]?.value || 1;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue">Financial reporting</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">Network expenditure intelligence</h2>
        <p className="mt-1 max-w-3xl text-sm text-slate-500">Expenditure trend, funding mix, and geographic concentration for the same reporting context selected on the Executive Dashboard.</p>
      </div>

      {isLoading ? <FinancialPanelsLoading /> : null}
      {isError ? <FinancialUnavailable onRetry={() => { void refetch(); }} /> : null}
      {!isLoading && !isError ? <>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Panel title="Expenditure trend" description="Monthly processed expenditure for the selected reporting context." icon={<BarChart3 className="h-5 w-5" />}>
            <div className="mt-5 flex min-h-44 items-end gap-2 overflow-x-auto pb-1">
              {monthlyTrend.length === 0 ? <EmptyMessage text="No expenditure trend is available for this reporting context." /> : monthlyTrend.map(item => (
                <div key={item.name} className="flex min-w-14 flex-1 flex-col items-center gap-2">
                  <div className="flex h-32 w-full items-end rounded-lg bg-slate-50 p-1" title={`${item.name}: ${formatNaira(item.value)}`}>
                    <div className="w-full rounded-md bg-brand-blue transition-all" style={{ height: `${item.value > 0 ? Math.max((item.value / maxTrend) * 100, 5) : 3}%` }} />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">{item.name}</span>
                  <span className="text-[10px] text-slate-400">{formatNaira(item.value)}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Funding mix" description="Share of processed expenditure by source." icon={<PieChartIcon className="h-5 w-5" />}>
            <div className="mt-5 space-y-4">
              {fundingMix.length === 0 ? <EmptyMessage text="No funding data is available for this reporting context." /> : fundingMix.map(item => (
                <div key={item.name}>
                  <div className="mb-1 flex items-center justify-between text-sm"><span className="capitalize text-slate-600">{item.name}</span><span className="nmis-number font-semibold text-slate-900">{formatNaira(item.value)}</span></div>
                  <div className="h-2.5 rounded-full bg-slate-100"><div className="h-2.5 rounded-full bg-brand-blue" style={{ width: `${item.value > 0 ? Math.max((item.value / maxFunding) * 100, 3) : 0}%` }} /></div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Panel title="Top expenditure by state" description="Concentration of network expenditure." icon={<MapPin className="h-5 w-5" />}>
            <Ranking items={byState.slice(0, 5)} max={maxState} emptyText="No state expenditure data is available." />
          </Panel>
          <Panel title="Expenditure by facility type" description="Expenditure distribution across facility categories." icon={<Building2 className="h-5 w-5" />}>
            <Ranking items={byFacilityType.slice(0, 5).map(item => ({ ...item, name: getProviderCategoryLabel(item.name) }))} max={maxFacilityType} emptyText="No facility-type expenditure data is available." />
          </Panel>
        </div>
      </> : null}
    </section>
  );
}

function Panel({ title, description, icon, children }: { title: string; description: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <div className="rounded-2xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2 text-sm font-semibold text-slate-800">{icon}{title}</div><p className="mt-1 text-xs text-slate-500">{description}</p></div></div>{children}</div>;
}

function Ranking({ items, max, emptyText }: { items: { name: string; value: number }[]; max: number; emptyText: string }) {
  return <div className="mt-5 space-y-4">{items.length === 0 ? <EmptyMessage text={emptyText} /> : items.map(item => <div key={item.name}><div className="mb-1 flex items-center justify-between gap-3 text-sm"><span className="truncate text-slate-600">{item.name}</span><span className="nmis-number shrink-0 font-semibold text-slate-800">{formatNaira(item.value)}</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-brand-emerald" style={{ width: `${item.value > 0 ? Math.max((item.value / max) * 100, 3) : 0}%` }} /></div></div>)}</div>;
}

function EmptyMessage({ text }: { text: string }) { return <p className="py-8 text-center text-sm text-slate-400">{text}</p>; }

function FinancialPanelsLoading() { return <div className="mt-6 grid gap-6 lg:grid-cols-2"><div className="h-64 animate-pulse rounded-2xl bg-slate-100" /><div className="h-64 animate-pulse rounded-2xl bg-slate-100" /><div className="h-52 animate-pulse rounded-2xl bg-slate-100" /><div className="h-52 animate-pulse rounded-2xl bg-slate-100" /></div>; }

function FinancialUnavailable({ onRetry }: { onRetry: () => void }) { return <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center"><p className="text-sm font-semibold text-slate-700">Financial reporting is temporarily unavailable.</p><p className="mt-1 text-xs text-slate-500">No financial values were fabricated for this dashboard.</p><button type="button" onClick={onRetry} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-blue px-3 py-2 text-xs font-semibold text-white hover:bg-brand-navy"><RefreshCw className="h-3.5 w-3.5" /> Retry</button></div>; }
