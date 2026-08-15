import { useState } from 'react';
import { TrendingUp, Users, Building2, CreditCard, DollarSign, FileText, BarChart3, ArrowUpRight, ArrowDownRight, Download, PieChart as PieChartIcon, MapPin } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { useFinancialAnalytics } from '../../hooks/financial-data/financialDataHooks';
import { useFinancialIntelligence } from '../../hooks/financial-intelligence/financialIntelligenceHooks';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import KpiCard from '../../components/ui/KpiCard';
import PageHeader from '../../components/ui/PageHeader';

const COLORS = ['#0b3d91', '#0f9d8a', '#d97706', '#7c3aed', '#be123c'];

export default function FinancialDashboardPage() {
  const [period, setPeriod] = useState('2026-08');
  const { data: analytics, isLoading: isAnalyticsLoading } = useFinancialAnalytics({ period });
  const { data: intelligence, isLoading: isIntelligenceLoading } = useFinancialIntelligence({ period });
  
  const formatNaira = (amount: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);
  
  const isLoading = isAnalyticsLoading || isIntelligenceLoading;
  const isError = !analytics || !intelligence;
  
  if (isLoading) return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><div className="h-32 animate-pulse rounded-card bg-slate-200" /><div className="h-32 animate-pulse rounded-card bg-slate-200" /><div className="h-32 animate-pulse rounded-card bg-slate-200" /><div className="h-32 animate-pulse rounded-card bg-slate-200" /></div>;

  if (isError) return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-panel border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
      <div className="mb-4 rounded-full bg-red-100 p-3 text-red-600">
        <DollarSign className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-bold text-slate-900">Financial data unavailable</h3>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        The system could not retrieve the financial intelligence summary. This may be due to insufficient permissions or a temporary connection issue.
      </p>
      <Button variant="secondary" className="mt-6" onClick={() => window.location.reload()}>Retry dashboard</Button>
    </div>
  );

  return <div className="space-y-6">
    <PageHeader 
      eyebrow="Financial management" 
      title="Financial Intelligence Dashboard" 
      subtitle="Network-wide expenditure analysis, funding mix, and enrolment-driven efficiency metrics." 
      actions={<>
        <label className="sr-only" htmlFor="financial-period">Reporting period</label>
        <select id="financial-period" className="nmis-control min-w-40" value={period} onChange={event => setPeriod(event.target.value)}>
          <option value="2026-08">August 2026</option>
          <option value="2026-07">July 2026</option>
          <option value="2026-06">June 2026</option>
        </select>
        <Button variant="secondary" size="sm" disabled><Download className="h-4 w-4" /> Export Report</Button>
      </>} 
    />

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard title="Total Expenditure" value={formatNaira(intelligence?.totalExpenditure || 0)} subtitle="Processed spend" icon={<DollarSign className="h-5 w-5" />} tone="primary" trend={`${intelligence?.comparison?.percentageChange}%`} trendDirection="up" />
      <KpiCard title="Network PEPM" value={formatNaira(intelligence?.pepm || 0)} subtitle="Spend per enrollee" icon={<TrendingUp className="h-5 w-5" />} tone="danger" trend={`${intelligence?.comparison?.pepmChange}%`} trendDirection="up" />
      <KpiCard title="Total Enrolment" value={(intelligence?.totalEnrolment || 0).toLocaleString()} subtitle="Eligible denominator" icon={<Users className="h-5 w-5" />} tone="info" />
      <KpiCard title="Claims Volume" value={formatNaira(intelligence?.claimsExpenditure || 0)} subtitle="Processed claims" icon={<FileText className="h-5 w-5" />} tone="success" />
    </section>

    <section className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <PanelHeading title="Expenditure trend" description="Monthly processed expenditure for the selected reporting period." icon={<BarChart3 className="h-5 w-5" />} />
        <div className="mt-6 h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analytics?.trends}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `₦${value / 1000000}M`} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 24px rgba(15,23,42,.08)' }} formatter={(value: unknown) => [formatNaira(Number(value)), 'Expenditure']} />
              <Area type="monotone" dataKey="value" stroke="#0b3d91" strokeWidth={3} fillOpacity={1} fill="url(#colorTrend)" />
              <defs>
                <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0b3d91" stopOpacity={0.16} />
                  <stop offset="95%" stopColor="#0b3d91" stopOpacity={0} />
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <PanelHeading title="Funding mix" description="Share of processed expenditure by source." icon={<PieChartIcon className="h-5 w-5" />} />
        <div className="flex h-[350px] flex-col items-center justify-center">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={analytics?.byCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={8} dataKey="value">
                {analytics?.byCategory.map((entry: { name: string }, index: number) => <Cell key={`cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(value: unknown) => formatNaira(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-6 w-full space-y-3">
            {analytics?.byCategory.map((item: { name: string; value: number }, index: number) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-sm font-semibold capitalize text-brand-secondary">{item.name}</span>
                </div>
                <span className="text-sm font-semibold text-brand-foreground">{Math.round((item.value / (analytics?.totalExpenditure || 1)) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </section>

    <section className="grid gap-6 lg:grid-cols-2">
      <Card>
        <PanelHeading title="Top expenditure by state" description="Concentration of network expenditure." icon={<MapPin className="h-5 w-5" />} />
        <div className="mt-6 space-y-6">
          {intelligence?.byState?.slice(0, 4).map((item: { name: string; value: number }) => (
            <LocationBar key={item.name} label={item.name} value={item.value} max={intelligence.byState[0]?.value || 1} color="bg-brand-blue" formatNaira={formatNaira} />
          )) || <p className="py-10 text-center text-brand-muted">No state data available</p>}
        </div>
      </Card>
      
      <Card>
        <PanelHeading title="Expenditure by facility type" description="Expenditure distribution across facility categories." icon={<Building2 className="h-5 w-5" />} />
        <div className="mt-6 space-y-6">
          {intelligence?.byFacilityType?.slice(0, 4).map((item: { name: string; value: number }) => (
            <LocationBar key={item.name} label={item.name} value={item.value} max={intelligence.byFacilityType[0]?.value || 1} color="bg-brand-emerald" formatNaira={formatNaira} />
          )) || <p className="py-10 text-center text-brand-muted">No facility type data available</p>}
        </div>
      </Card>
    </section>
  </div>;
}

function PanelHeading({ title, description, icon }: { title: string; description?: string; icon?: React.ReactNode }) { return <div className="flex items-start justify-between"><div><h2 className="nmis-section-title">{title}</h2>{description ? <p className="nmis-section-subtitle">{description}</p> : null}</div>{icon && <span className="text-brand-muted">{icon}</span>}</div>; }
function LocationBar({ label, value, max, color, formatNaira }: { label: string; value: number; max: number; color: string; formatNaira: (value: number) => string }) { return <div className="space-y-2"><div className="flex justify-between text-sm"><span className="font-semibold text-brand-secondary">{label}</span><span className="font-semibold text-brand-foreground">{formatNaira(value)}</span></div><div className="h-2.5 w-full overflow-hidden rounded-pill bg-brand-surface"><div className={`h-full rounded-pill transition-all duration-1000 ${color}`} style={{ width: `${(value / max) * 100}%` }} /></div></div>; }
