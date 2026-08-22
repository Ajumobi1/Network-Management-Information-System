import { useState, useMemo } from 'react';
import { 
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, 
  Line, LineChart, Area, AreaChart, Cell
} from 'recharts';
import { 
  Award, Building2, ShieldAlert, Target, TrendingUp, AlertTriangle, 
  Search, Filter, Download, ExternalLink, Activity, Users,
  CheckCircle2, Star, Zap, ShieldCheck
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { useProviderPerformanceRecords, useProviderPerformanceSummary } from '../hooks/performance/providerPerformanceHooks';
import { PerformanceFilters, PerformanceRating } from '../types/performance/providerPerformanceTypes';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { SectionHeader } from '../components/ui/LayoutComponents';

const ratingColors: Record<PerformanceRating, string> = {
  'Excellent': 'bg-status-successSoft text-status-success border-status-success/10',
  'Good': 'bg-brand-blue/10 text-brand-blue border-brand-blue/10',
  'Satisfactory': 'bg-brand-soft text-brand-muted border-brand-divider',
  'Needs Improvement': 'bg-brand-orange/10 text-brand-orange border-brand-orange/20',
  'Critical': 'bg-status-errorSoft text-status-error border-status-error/10',
};

const ratingChartColors: Record<string, string> = {
  'Excellent': '#10b981',
  'Good': '#071c4b',
  'Satisfactory': '#64748b',
  'Needs Improvement': '#f97316',
  'Critical': '#ef4444',
};

export default function PerformancePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'register' | 'benchmarks'>('overview');
  const [filters, setFilters] = useState<PerformanceFilters>({
    search: '',
    period: '2026-Q3',
    rating: 'all',
    category: 'all',
    ownership: 'all',
    state: 'all',
    attentionOnly: false,
  });

  const { data: summary, isLoading: isSummaryLoading } = useProviderPerformanceSummary();
  const { data: records = [], isLoading: isRecordsLoading } = useProviderPerformanceRecords(filters);

  const distributionData = useMemo(() => {
    if (!summary) return [];
    return [
      { rating: 'Excellent', count: summary.ratingDistribution['Excellent'] },
      { rating: 'Good', count: summary.ratingDistribution['Good'] },
      { rating: 'Satisfactory', count: summary.ratingDistribution['Satisfactory'] },
      { rating: 'Needs Improvement', count: summary.ratingDistribution['Needs Improvement'] },
      { rating: 'Critical', count: summary.ratingDistribution['Critical'] },
    ];
  }, [summary]);

  return (
    <main className="nmis-page">
      <PageHeader
        eyebrow="Quality Assurance"
        title="Provider Performance Intelligence"
        subtitle="Monitor network-wide quality benchmarks, clinical compliance scores, and management intervention triggers."
        actions={[
          { label: 'Export Performance Register', icon: <Download size={16} />, onClick: () => alert('Generating performance register CSV...') }
        ]}
      />

      {/* Navigation Tabs */}
      <div className="flex border-b border-brand-border">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-4 text-sm font-bold transition-all ${activeTab === 'overview' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-brand-muted hover:text-brand-foreground'}`}
        >
          Intelligence Overview
        </button>
        <button
          onClick={() => setActiveTab('register')}
          className={`px-6 py-4 text-sm font-bold transition-all ${activeTab === 'register' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-brand-muted hover:text-brand-foreground'}`}
        >
          Performance Register
        </button>
        <button
          onClick={() => setActiveTab('benchmarks')}
          className={`px-6 py-4 text-sm font-bold transition-all ${activeTab === 'benchmarks' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-brand-muted hover:text-brand-foreground'}`}
        >
          Network Benchmarks
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Summary KPIs */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="relative overflow-hidden">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-brand-blue/10 p-4 text-brand-blue">
                  <Building2 size={24} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-brand-muted">Evaluated</p>
                  <p className="text-3xl font-black text-brand-foreground">{isSummaryLoading ? '...' : summary?.totalEvaluated}</p>
                </div>
              </div>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-status-successSoft p-4 text-status-success">
                  <Star size={24} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-brand-muted">Avg Score</p>
                  <p className="text-3xl font-black text-brand-foreground">{isSummaryLoading ? '...' : `${summary?.averageScore}%`}</p>
                </div>
              </div>
            </Card>

            <Card className="relative overflow-hidden border-brand-orange/20 bg-brand-orange/5">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-brand-orange/20 p-4 text-brand-orange">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-brand-muted">Attention</p>
                  <p className="text-3xl font-black text-brand-orange">{isSummaryLoading ? '...' : summary?.attentionCount}</p>
                </div>
              </div>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-brand-soft p-4 text-brand-blue">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-brand-muted">Compliance</p>
                  <p className="text-3xl font-black text-brand-foreground">{isSummaryLoading ? '...' : `${summary?.inspectionComplianceRate}%`}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Analytics Grid */}
          <div className="grid gap-8 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <SectionHeader title="Rating Distribution" subtitle="Network-wide performance tiering across standard rating categories." />
              <div className="mt-8 h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distributionData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="rating" 
                      tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} 
                      axisLine={false} 
                      tickLine={false} 
                      dy={10}
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={50}>
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={ratingChartColors[entry.rating]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <div className="space-y-6">
              <Card className="bg-brand-navy text-white border-none overflow-hidden relative">
                <div className="relative z-10">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/60 mb-6">Composite Weighting</h3>
                  <div className="space-y-5">
                    {[
                      { label: 'Inspection Audit', weight: '35%', color: 'bg-brand-blue' },
                      { label: 'Credentialing', weight: '25%', color: 'bg-brand-orange' },
                      { label: 'Complaint Resolution', weight: '20%', color: 'bg-status-success' },
                      { label: 'Financial Compliance', weight: '20%', color: 'bg-status-warning' },
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                          <span>{item.label}</span>
                          <span>{item.weight}</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color}`} style={{ width: item.weight }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute -right-10 -bottom-10 opacity-10 rotate-12">
                  <Zap size={200} />
                </div>
              </Card>

              <Card className="border-brand-orange/20 bg-brand-orange/5">
                <div className="flex items-center gap-2 text-brand-orange mb-3">
                  <AlertTriangle size={16} />
                  <h3 className="text-[10px] font-black uppercase tracking-widest">Critical Alert</h3>
                </div>
                <p className="text-xs font-bold text-brand-secondary leading-relaxed">
                  Facilities scoring below **70%** or flagged with critical infrastructure failures enter mandatory management review within 48 hours.
                </p>
              </Card>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'register' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Enhanced Filters */}
          <Card className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div className="flex flex-1 flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-subtle" size={18} />
                <input
                  type="text"
                  placeholder="Search provider name, code, or LGA..."
                  value={filters.search}
                  onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="nmis-control pl-10"
                />
              </div>
              <select
                value={filters.rating}
                onChange={e => setFilters(prev => ({ ...prev, rating: e.target.value as any }))}
                className="nmis-control w-auto"
              >
                <option value="all">All Ratings</option>
                <option value="Excellent">Excellent (90-100%)</option>
                <option value="Good">Good (80-89%)</option>
                <option value="Satisfactory">Satisfactory (70-79%)</option>
                <option value="Needs Improvement">Needs Improvement (60-69%)</option>
                <option value="Critical">Critical (<60%)</option>
              </select>
              <label className="flex items-center gap-3 px-4 py-2 rounded-xl bg-brand-soft border border-brand-divider cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.attentionOnly}
                  onChange={e => setFilters(prev => ({ ...prev, attentionOnly: e.target.checked }))}
                  className="h-4 w-4 rounded border-brand-border text-brand-blue focus:ring-brand-blue"
                />
                <span className="text-xs font-black uppercase tracking-widest text-brand-muted group-hover:text-brand-foreground transition-colors">
                  Attention Required
                </span>
              </label>
            </div>
          </Card>

          {/* Data Table */}
          <Card className="p-0 overflow-hidden">
            <div className="nmis-table-wrap">
              <table className="nmis-table">
                <thead>
                  <tr>
                    <th>Facility Identity</th>
                    <th>Rating Tier</th>
                    <th className="text-center">Composite</th>
                    <th className="text-center">QA Audit</th>
                    <th className="text-center">Credentials</th>
                    <th>Risk Assessment</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isRecordsLoading ? (
                    <tr><td colSpan={7} className="py-20 text-center text-brand-muted font-bold">Synchronizing performance data...</td></tr>
                  ) : records.length === 0 ? (
                    <tr><td colSpan={7} className="py-20 text-center text-brand-muted font-bold">No facilities found matching current criteria.</td></tr>
                  ) : (
                    records.map(r => (
                      <tr key={r.providerId}>
                        <td>
                          <p className="font-black text-brand-foreground">{r.providerName}</p>
                          <p className="text-[10px] font-bold text-brand-muted uppercase tracking-tighter mt-0.5">{r.providerCode} • {r.lga}</p>
                        </td>
                        <td>
                          <Badge variant={r.rating === 'Excellent' ? 'success' : r.rating === 'Critical' ? 'error' : 'default'} className={`font-black text-[10px] border-none ${ratingColors[r.rating]}`}>
                            {r.rating.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="text-center font-black text-brand-foreground">{r.compositeScore}%</td>
                        <td className="text-center font-bold text-brand-secondary">{r.inspectionScore}%</td>
                        <td className="text-center font-bold text-brand-secondary">{r.credentialingScore}%</td>
                        <td>
                          {r.attentionFlag ? (
                            <div className="flex items-center gap-2 text-status-error">
                              <ShieldAlert size={14} />
                              <span className="text-[10px] font-black uppercase tracking-tighter">{r.attentionReason || 'CRITICAL REVIEW'}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-brand-subtle uppercase">Low Risk</span>
                          )}
                        </td>
                        <td className="text-right">
                          <Button variant="secondary" size="sm" className="h-8 group">
                            Profile <ExternalLink size={12} className="ml-1 opacity-50 group-hover:opacity-100" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'benchmarks' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <SectionHeader title="Network Benchmarks" subtitle="Comparison of performance metrics across LGAs and facility categories." />
          <div className="grid gap-8 lg:grid-cols-2">
            <Card>
              <h3 className="text-sm font-black uppercase tracking-widest text-brand-muted mb-6">Top Performing LGAs</h3>
              <div className="space-y-6">
                {[
                  { lga: 'Akure South', score: 92, count: 48 },
                  { lga: 'Ondo West', score: 88, count: 24 },
                  { lga: 'Owo', score: 85, count: 18 },
                  { lga: 'Okitipupa', score: 82, count: 15 },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded-lg bg-brand-soft flex items-center justify-center text-brand-blue font-black text-xs">
                      #{idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-sm font-bold text-brand-foreground">{item.lga}</span>
                        <span className="text-xs font-black text-brand-blue">{item.score}%</span>
                      </div>
                      <div className="h-2 w-full bg-brand-soft rounded-full overflow-hidden">
                        <div className="h-full bg-brand-blue rounded-full" style={{ width: `${item.score}%` }} />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-brand-muted uppercase">Facilities</p>
                      <p className="text-xs font-bold text-brand-foreground">{item.count}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-brand-soft/30 border-brand-divider">
              <h3 className="text-sm font-black uppercase tracking-widest text-brand-muted mb-6">Category Averages</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { category: 'Hospitals', score: 84, trend: '+2%' },
                  { category: 'Pharmacies', score: 79, trend: '-1%' },
                  { category: 'Diagnostic', score: 86, trend: '+4%' },
                  { category: 'Optical', score: 81, trend: '0%' },
                ].map((item, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-2xl border border-brand-divider">
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-muted">{item.category}</p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-black text-brand-foreground">{item.score}%</span>
                      <span className={`text-[10px] font-bold ${item.trend.startsWith('+') ? 'text-status-success' : 'text-status-error'}`}>
                        {item.trend}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 p-4 rounded-2xl bg-white border border-brand-divider flex items-center gap-4">
                <div className="rounded-xl bg-brand-blue/10 p-2 text-brand-blue">
                  <Activity size={20} />
                </div>
                <p className="text-xs font-bold text-brand-secondary leading-relaxed">
                  Overall network quality has increased by **2.4%** since the last reporting cycle (Q2 2026).
                </p>
              </div>
            </Card>
          </div>
        </div>
      )}
    </main>
  );
}
