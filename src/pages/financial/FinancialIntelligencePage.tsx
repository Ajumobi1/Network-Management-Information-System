import { BarChart3, MapPin, Users, WalletCards, TrendingUp, AlertCircle, FileText, PieChart as PieChartIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useFinancialIntelligence } from '../../hooks/financial-intelligence/financialIntelligenceHooks';
import { FinancialIntelligenceFilters } from '../../types/financial-intelligence';
import ActiveFilterChips from '../../components/ui/ActiveFilterChips';
import Card from '../../components/ui/Card';
import FilterBar from '../../components/ui/FilterBar';
import Input from '../../components/ui/Input';
import KpiCard from '../../components/ui/KpiCard';
import PageHeader from '../../components/ui/PageHeader';
import { isSecureContractError } from '../../lib/security/secureContracts';

function formatNaira(value: number): string {
  if (value >= 1_000_000_000) return `₦${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(2)}M`;
  return `₦${Math.round(value).toLocaleString('en-NG')}`;
}

function formatLabel(value: string) { return value.replace('-', ' ').replace(/\b\w/g, letter => letter.toUpperCase()); }

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { label: string; value: string }[] }) {
  return <label className="min-w-[150px] flex-1"><span className="nmis-label">{label}</span><select aria-label={label} value={value} onChange={event => onChange(event.target.value)} className="nmis-control">{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

export default function FinancialIntelligencePage() {
  const [filters, setFilters] = useState<FinancialIntelligenceFilters>({ dataType: 'all', sector: 'all' });
  const { data, isLoading, isError, error } = useFinancialIntelligence(filters);
  const updateFilter = <K extends keyof FinancialIntelligenceFilters>(key: K, value: FinancialIntelligenceFilters[K]) => setFilters(previous => ({ ...previous, [key]: value || undefined }));
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
  
  const removeFilter = (id: string) => setFilters(previous => ({ ...previous, [id]: id === 'dataType' || id === 'sector' ? 'all' : undefined }));

  return <div className="space-y-6">
    <PageHeader 
      eyebrow="Analytics & reports" 
      title="Financial Intelligence" 
      subtitle="Comprehensive management reporting layer unifying Claims, Capitation, and FFS expenditure with enrolment-driven PEPM analytics." 
      actions={<>
        <Link to="/financial/dashboard" className="inline-flex min-h-[2.625rem] items-center gap-2 rounded-control border border-brand-border bg-brand-card px-3.5 py-2 text-sm font-semibold text-brand-secondary hover:bg-brand-surface"><WalletCards className="h-4 w-4" />Overview</Link>
        <Link to="/financial/register/claims" className="inline-flex min-h-[2.625rem] items-center gap-2 rounded-control border border-brand-border bg-brand-card px-3.5 py-2 text-sm font-semibold text-brand-secondary hover:bg-brand-surface"><FileText className="h-4 w-4" />Register</Link>
      </>} 
    />
    
    <FilterBar 
      primaryFilters={<>
        <FilterSelect label="Reporting period" value={filters.period || 'all'} onChange={value => updateFilter('period', value === 'all' ? undefined : value)} options={[{ value: 'all', label: 'All periods' }, { value: '2026-08', label: 'August 2026' }, { value: '2026-07', label: 'July 2026' }, { value: '2026-06', label: 'June 2026' }]} />
        <FilterSelect label="Funding type" value={filters.dataType || 'all'} onChange={value => updateFilter('dataType', value as FinancialIntelligenceFilters['dataType'])} options={[{ value: 'all', label: 'All funding types' }, { value: 'claims', label: 'Claims' }, { value: 'capitation', label: 'Capitation' }, { value: 'ffs', label: 'Fee-for-Service' }]} />
        <FilterSelect label="Sector" value={filters.sector || 'all'} onChange={value => updateFilter('sector', value as FinancialIntelligenceFilters['sector'])} options={[{ value: 'all', label: 'All sectors' }, { value: 'formal', label: 'Formal' }, { value: 'informal', label: 'Informal' }]} />
      </>} 
      advancedFilters={<>
        <label><span className="nmis-label">LGA</span><Input aria-label="LGA" placeholder="Search LGA" value={filters.lga || ''} onChange={event => updateFilter('lga', event.target.value || undefined)} /></label>
        <label><span className="nmis-label">State</span><Input aria-label="State" placeholder="Search state" value={filters.state || ''} onChange={event => updateFilter('state', event.target.value || undefined)} /></label>
        <label><span className="nmis-label">Facility type</span><Input aria-label="Facility type" placeholder="Search facility type" value={filters.facilityType || ''} onChange={event => updateFilter('facilityType', event.target.value || undefined)} /></label>
        <label><span className="nmis-label">Ownership</span><Input aria-label="Ownership" placeholder="Search ownership" value={filters.ownership || ''} onChange={event => updateFilter('ownership', event.target.value || undefined)} /></label>
      </>} 
      activeFilters={<ActiveFilterChips chips={activeFilterChips} onRemove={removeFilter} onClear={clearFilters} />} 
      onReset={clearFilters} 
    />

    {isLoading ? <div className="grid gap-4 md:grid-cols-4"><div className="h-32 animate-pulse rounded-card bg-slate-200" /><div className="h-32 animate-pulse rounded-card bg-slate-200" /><div className="h-32 animate-pulse rounded-card bg-slate-200" /><div className="h-32 animate-pulse rounded-card bg-slate-200" /></div> : null}
    
    {isError ? <div className="rounded-card border border-status-error/20 bg-status-errorSoft p-5 text-sm text-status-error">{isSecureContractError(error) ? 'Secure financial intelligence is unavailable. No raw enrollee or financial records were loaded in the browser.' : 'Financial Intelligence could not be loaded. Check the active repository mode and try again.'}</div> : null}
    
    {data ? <>
      <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <KpiCard title="Total expenditure" value={formatNaira(data.totalExpenditure)} subtitle="Aggregate spend" icon={<WalletCards className="h-5 w-5" />} tone="primary" trend={`${data.comparison?.percentageChange}%`} trendDirection="up" />
        <KpiCard title="Network PEPM" value={formatNaira(data.pepm)} subtitle="Spend per enrollee" icon={<TrendingUp className="h-5 w-5" />} tone="danger" trend={`${data.comparison?.pepmChange}%`} trendDirection="up" />
        <KpiCard title="Total enrolment" value={data.totalEnrolment.toLocaleString()} subtitle={`${data.formalEnrolment.toLocaleString()} formal · ${data.informalEnrolment.toLocaleString()} informal`} icon={<Users className="h-5 w-5" />} tone="info" />
        <KpiCard title="Active providers" value={data.providerCount.toLocaleString()} subtitle={`${data.financialRecordCount.toLocaleString()} financial records`} icon={<MapPin className="h-5 w-5" />} tone="neutral" />
      </section>

      {data.exceptions.length > 0 && (
        <section className="rounded-card border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-2 text-amber-800 mb-4">
            <AlertCircle size={20} />
            <h2 className="text-sm font-black uppercase tracking-widest">Financial Exceptions & Variances</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {data.exceptions.map(exc => (
              <div key={exc.id} className="rounded-panel border border-amber-200 bg-white p-4 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${exc.severity === 'critical' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{exc.severity}</span>
                  <span className="text-[10px] text-brand-muted">{new Date(exc.detectedAt).toLocaleDateString()}</span>
                </div>
                <p className="text-xs font-bold text-brand-foreground truncate">{exc.providerName}</p>
                <p className="mt-1 text-xs text-brand-secondary leading-relaxed">{exc.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-2">
        <RankingCard title="Top provider expenditure" description="Facilities accounting for the highest network spend." icon={<BarChart3 className="h-5 w-5" />} items={data.providerRanking} max={maxProviderValue} tone="blue" formatValue={formatNaira} />
        <RankingCard title="LGA concentration" description="Geographic distribution of financial activity." icon={<MapPin className="h-5 w-5" />} items={data.lgaRanking} max={maxLgaValue} tone="green" formatValue={formatNaira} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <PanelHeading title="Monthly expenditure trend" description="Aggregated spend over the selected reporting period." icon={<TrendingUp className="h-5 w-5" />} />
          <div className="mt-6 flex items-end gap-3 overflow-x-auto pb-2 h-64">
            {data.monthlyTrend.map(item => {
              const max = Math.max(...data.monthlyTrend.map(point => point.value), 1);
              return <div key={item.name} className="flex min-w-20 flex-1 flex-col items-center gap-2">
                <div className="flex h-full w-full items-end rounded-control bg-brand-surface p-2">
                  <div className="w-full rounded-control bg-brand-blue transition-all" style={{ height: `${Math.max((item.value / max) * 100, 4)}%` }} />
                </div>
                <span className="text-[10px] font-bold text-brand-secondary">{item.name}</span>
                <span className="text-[10px] text-brand-muted">{formatNaira(item.value)}</span>
              </div>;
            })}
          </div>
        </Card>
        
        <Card>
          <PanelHeading title="Expenditure distribution" description="Breakdown by facility type and ownership." icon={<PieChartIcon className="h-5 w-5" />} />
          <div className="mt-5 space-y-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-muted mb-3">Facility Category</p>
              <div className="space-y-2">
                {data.byFacilityType.slice(0, 3).map(item => (
                  <div key={item.name} className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-secondary">{item.name}</span>
                    <span className="text-xs font-black text-brand-foreground">{formatNaira(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-muted mb-3">Ownership Mix</p>
              <div className="space-y-2">
                {data.byOwnership.slice(0, 3).map(item => (
                  <div key={item.name} className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-secondary">{item.name}</span>
                    <span className="text-xs font-black text-brand-foreground">{formatNaira(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </section>
    </> : null}
  </div>;
}

function PanelHeading({ title, description, icon }: { title: string; description?: string; icon?: React.ReactNode }) { return <div className="flex items-start justify-between gap-4"><div><h2 className="nmis-section-title">{title}</h2>{description ? <p className="nmis-section-subtitle">{description}</p> : null}</div>{icon ? <span className="text-brand-muted">{icon}</span> : null}</div>; }
function RankingCard({ title, description, icon, items, max, tone, formatValue }: { title: string; description: string; icon: React.ReactNode; items: { name: string; value: number }[]; max: number; tone: 'blue' | 'green'; formatValue: (value: number) => string }) { return <Card><PanelHeading title={title} description={description} icon={icon} /><div className="mt-5 space-y-4">{items.slice(0, 5).map((item, index) => <div key={item.name}><div className="mb-1 flex items-center justify-between gap-3 text-sm"><span className="flex min-w-0 items-center gap-2 text-brand-secondary"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-surface text-xs font-semibold text-brand-muted">{index + 1}</span><span className="truncate">{item.name}</span></span><span className="shrink-0 font-semibold text-brand-foreground">{formatValue(item.value)}</span></div><div className="h-2 rounded-pill bg-brand-surface"><div className={`h-2 rounded-pill ${tone === 'blue' ? 'bg-brand-blue' : 'bg-brand-emerald'}`} style={{ width: `${Math.max((item.value / max) * 100, 3)}%` }} /></div></div>)}</div></Card>; }
