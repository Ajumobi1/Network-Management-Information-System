import { CircleDollarSign, ShieldCheck, UserRound, UsersRound } from 'lucide-react';
import KpiCard from '../ui/KpiCard';
import { Dashboard2Intelligence } from '../../types/dashboard/dashboardIntelligenceTypes';

function formatNaira(value: number, compact = false): string {
  if (compact) {
    if (value >= 1_000_000_000) return `₦${(value / 1_000_000_000).toFixed(2)}B`;
    if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `₦${(value / 1_000).toFixed(1)}K`;
  }
  return `₦${Math.round(value).toLocaleString('en-NG')}`;
}

type ExecutiveKpiRowProps = { intelligence: Dashboard2Intelligence };

export default function ExecutiveKpiRow({ intelligence }: ExecutiveKpiRowProps) {
  const financialGrowth = intelligence.financial.growthPercentage ?? 0;
  const cards = [
    { title: 'Active providers', value: intelligence.provider.active.toLocaleString(), subtitle: `${intelligence.provider.inactive.toLocaleString()} not active`, icon: <ShieldCheck className="h-5 w-5" />, tone: 'success' as const },
    { title: 'Total enrollees', value: intelligence.population.total.toLocaleString(), subtitle: `${intelligence.population.principal.toLocaleString()} principals · ${intelligence.population.dependant.toLocaleString()} dependants`, icon: <UsersRound className="h-5 w-5" />, tone: 'info' as const },
    { title: 'Formal enrollees', value: intelligence.population.formal.toLocaleString(), subtitle: `${intelligence.population.total ? Math.round((intelligence.population.formal / intelligence.population.total) * 100) : 0}% of population`, icon: <UserRound className="h-5 w-5" />, tone: 'success' as const },
    { title: 'Informal enrollees', value: intelligence.population.informal.toLocaleString(), subtitle: `${intelligence.population.total ? Math.round((intelligence.population.informal / intelligence.population.total) * 100) : 0}% of population`, icon: <UserRound className="h-5 w-5" />, tone: 'warning' as const },
    {
      title: 'Network expenditure',
      value: formatNaira(intelligence.financial.totalExpenditure),
      subtitle: `${intelligence.matchedFinancialRecords.toLocaleString()} linked financial records`,
      icon: <CircleDollarSign className="h-5 w-5" />,
      tone: 'neutral' as const,
      trend: `${Math.abs(financialGrowth)}%`,
      trendDirection: financialGrowth >= 0 ? 'up' as const : 'down' as const
    },
  ];
  return <section aria-label="Executive key performance indicators" className="grid gap-3 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">{cards.map(card => <KpiCard key={card.title} {...card} />)}</section>;
}
