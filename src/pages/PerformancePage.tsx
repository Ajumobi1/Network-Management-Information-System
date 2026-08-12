import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, LineChart } from 'recharts';
import { Award, Building2, ChevronRight, Target, TrendingDown, TrendingUp, ShieldCheck, Activity } from 'lucide-react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import KpiCard from '../components/ui/KpiCard';
import PageHeader from '../components/ui/PageHeader';
import { usePerformanceStats, useProviderRankings } from '../hooks/performance/performanceHooks';
import { LoadingState, ErrorState } from '../components/ui/FeedbackStates';
import { ChartCard, SectionHeader } from '../components/ui/LayoutComponents';

const chartColors = ['#0b3d91', '#0f9d8a', '#d97706', '#7c3aed', '#be123c'];

export default function PerformancePage() {
  const { data: stats, isLoading: isStatsLoading, isError: isStatsError } = usePerformanceStats();
  const { data: rankings = [], isLoading: isRankingsLoading, isError: isRankingsError } = useProviderRankings();

  const complianceTrend = [
    { name: 'Mar', score: 84 },
    { name: 'Apr', score: 86 },
    { name: 'May', score: 85 },
    { name: 'Jun', score: 89 },
    { name: 'Jul', score: 91 },
    { name: 'Aug', score: 92 },
  ];

  if (isStatsLoading || isRankingsLoading) return <main className="nmis-page"><LoadingState title="Calculating network performance..." /></main>;
  if (isStatsError || isRankingsError) return <main className="nmis-page"><ErrorState title="Performance data unavailable" /></main>;

  return (
    <main className="nmis-page">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Quality & Compliance"
          title="Network Performance"
          subtitle="Monitor provider performance metrics, quality scores, and compliance trends across the network."
          actions={<Button variant="secondary" disabled>View Analytics (Soon)</Button>}
        />

        <section className="grid gap-4 md:grid-cols-4">
          <KpiCard title="Network Quality Score" value={`${stats?.averageScore}%`} subtitle="Avg inspection score" tone="primary" icon={<Award size={20} />} />
          <KpiCard title="Above Target" value={`${stats?.aboveTargetCount}`} subtitle="Meeting 85% threshold" tone="success" icon={<Target size={20} />} />
          <KpiCard title="Underperforming" value={`${stats?.underperformingCount}`} subtitle="Below 70% threshold" tone="warning" icon={<TrendingDown size={20} />} />
          <KpiCard title="Facilities Monitored" value={`${stats?.totalMonitored}`} subtitle="Total active providers" tone="info" icon={<Building2 size={20} />} />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Quality score trend" subtitle="Network-wide average over the last 6 months.">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={complianceTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#0b3d91" strokeWidth={3} dot={{ r: 4, fill: '#0b3d91' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Performance distribution" subtitle="Count of providers by score range.">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { range: '90-100', count: 4 },
                  { range: '80-89', count: 8 },
                  { range: '70-79', count: 3 },
                  { range: '<70', count: 2 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                  <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0f9d8a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <SectionHeader title="Top Provider Performers" subtitle="Facilities with the highest quality scores and compliance ratings." />
            <div className="mt-6 overflow-x-auto">
              <table className="nmis-table">
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th className="text-center">Quality Score</th>
                    <th className="text-center">Compliance</th>
                    <th>Rating</th>
                    <th className="text-right">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((item, index) => (
                    <tr key={item.providerId}>
                      <td>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-brand-muted">{index + 1}.</span>
                          <div>
                            <p className="font-bold text-brand-foreground">{item.providerName}</p>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">{item.providerCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-center">
                        <span className="text-sm font-black text-brand-blue">{item.score}%</span>
                      </td>
                      <td className="text-center">
                        <span className="text-sm font-bold text-brand-secondary">{item.compliance}%</span>
                      </td>
                      <td>
                        <Badge variant="info" className="uppercase">{item.rating}</Badge>
                      </td>
                      <td className="text-right">
                        {item.trend === 'up' ? (
                          <TrendingUp size={16} className="text-status-success inline" />
                        ) : item.trend === 'down' ? (
                          <TrendingDown size={16} className="text-status-error inline" />
                        ) : (
                          <Activity size={16} className="text-brand-muted inline" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="bg-brand-soft border-brand-blue/20">
              <div className="flex items-center gap-3 text-brand-blue mb-4">
                <ShieldCheck size={24} />
                <h3 className="text-lg font-black uppercase tracking-widest">Network Threshold</h3>
              </div>
              <p className="text-sm leading-relaxed text-brand-secondary">
                The network quality target is set at <strong>85%</strong>. Facilities falling below <strong>70%</strong> are automatically flagged for management intervention and corrective action plans.
              </p>
              <div className="mt-6 pt-6 border-t border-brand-blue/10">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-bold text-brand-secondary">Current Compliance</span>
                  <span className="font-black text-brand-blue">92%</span>
                </div>
                <div className="h-2 w-full bg-brand-surface rounded-pill overflow-hidden">
                  <div className="h-full bg-brand-blue rounded-pill" style={{ width: '92%' }} />
                </div>
              </div>
            </Card>

            <Card>
              <SectionHeader title="Operational Risks" />
              <div className="mt-4 space-y-4">
                <div className="p-3 rounded-control bg-status-errorSoft border border-status-error/10">
                  <p className="text-xs font-black text-status-error uppercase tracking-wider">Critical</p>
                  <p className="mt-1 text-sm font-bold text-brand-foreground">2 Facilities Suspended</p>
                  <p className="text-xs text-brand-secondary">Due to persistent licensing non-compliance.</p>
                </div>
                <div className="p-3 rounded-control bg-status-warningSoft border border-status-warning/10">
                  <p className="text-xs font-black text-status-warning uppercase tracking-wider">Warning</p>
                  <p className="mt-1 text-sm font-bold text-brand-foreground">5 Inspections Overdue</p>
                  <p className="text-xs text-brand-secondary">Scheduled rounds delayed by field logistics.</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
