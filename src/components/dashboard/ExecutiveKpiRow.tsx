import { Building2, CircleDollarSign, Gauge, ShieldCheck, UserRound, UsersRound } from 'lucide-react';
import KpiCard from '../ui/KpiCard';
import { Dashboard2Intelligence } from '../../types/dashboard/dashboardIntelligenceTypes';

function formatNaira(value: number): string {
  if (value >= 1_000_000_000) return `₦${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(2)}M`;
  return `₦${Math.round(value).toLocaleString('en-NG')}`;
}

type ExecutiveKpiRowProps = { intelligence: Dashboard2Intelligence };

export default function ExecutiveKpiRow({ intelligence }: ExecutiveKpiRowProps) {
  const populationGrowth = intelligence.population.growthPercentage ?? 0;
  const financialGrowth = intelligence.financial.growthPercentage ?? 0;
  const cards = [
    { title: 'Total providers', value: intelligence.provider.total.toLocaleString(), subtitle: 'Authoritative Provider Directory', icon: <Building2 className="h-5 w-5" />, tone: 'primary' as const },
    { title: 'Active providers', value: intelligence.provider.active.toLocaleString(), subtitle: `${intelligence.provider.inactive.toLocaleString()} not active`, icon: <ShieldCheck className="h-5 w-5" />, tone: 'success' as const },
    { title: 'Total enrollees', value: intelligence.population.total.toLocaleString(), subtitle: `${intelligence.population.principal.toLocaleString()} principals · ${intelligence.population.dependant.toLocaleString()} dependants`, icon: <UsersRound className="h-5 w-5" />, tone: 'info' as const, trend: `${Math.abs(populationGrowth)}%`, trendDirection: populationGrowth >= 0 ? 'up' as const : 'down' as const },
    { title: 'Formal enrollees', value: intelligence.population.formal.toLocaleString(), subtitle: `${intelligence.population.total ? Math.round((intelligence.population.formal / intelligence.population.total) * 100) : 0}% of population`, icon: <UserRound className="h-5 w-5" />, tone: 'success' as const },
    { title: 'Informal enrollees', value: intelligence.population.informal.toLocaleString(), subtitle: `${intelligence.population.total ? Math.round((intelligence.population.informal / intelligence.population.total) * 100) : 0}% of population`, icon: <UserRound className="h-5 w-5" />, tone: 'warning' as const },
    { title: 'Network expenditure', value: formatNaira(intelligence.financial.totalExpenditure), subtitle: `${intelligence.matchedFinancialRecords.toLocaleString()} linked financial records`, icon: <CircleDollarSign className="h-5 w-5" />, tone: 'neutral' as const, trend: `${Math.abs(financialGrowth)}%`, trendDirection: financialGrowth >= 0 ? 'up' as const : 'down' as const },
    { title: 'PEPM', value: formatNaira(intelligence.efficiency.networkPepm), subtitle: 'Expenditure per enrollee', icon: <Gauge className="h-5 w-5" />, tone: 'danger' as const },
  ];
  return <section aria-label="Executive key performance indicators" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">{cards.map(card => <KpiCard key={card.title} {...card} />)}</section>;
}
