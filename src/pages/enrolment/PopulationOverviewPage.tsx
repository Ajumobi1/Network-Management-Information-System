import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowUpRight, Building2, FileSpreadsheet, MapPin, Users, Upload, LayoutGrid, UserPlus, WalletCards } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import KpiCard from '../../components/ui/KpiCard';
import PageHeader from '../../components/ui/PageHeader';
import Select from '../../components/ui/Select';
import { useEnrolmentAnalytics } from '../../hooks/enrolment';
import { EnrolmentFilters, EnrolmentSector } from '../../types/enrolment/enrolmentTypes';
import { LoadingState, ErrorState } from '../../components/ui/FeedbackStates';
import { ChartCard, SectionHeader } from '../../components/ui/LayoutComponents';

const chartColors = ['#0b3d91', '#f59e0b', '#10b981', '#8b5cf6', '#be123c', '#0891b2'];

const formatNaira = (amount: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(Number.isFinite(amount) ? amount : 0);
const formatCompactNaira = (amount: number) => amount >= 1000000 ? `₦${(amount / 1000000).toFixed(1)}M` : amount >= 1000 ? `₦${(amount / 1000).toFixed(0)}K` : `₦${amount}`;

export default function PopulationOverviewPage() {
  const [sector, setSector] = useState<EnrolmentSector | 'all'>('all');
  const [category, setCategory] = useState<'principal' | 'dependant' | 'all'>('all');
  const [period, setPeriod] = useState('all');

  const filters = useMemo<EnrolmentFilters>(() => ({ sector, category, period }), [category, period, sector]);
  const { data: analytics, isLoading, isError, refetch } = useEnrolmentAnalytics(filters);

  if (isLoading) return <main className="nmis-page"><LoadingState title="Calculating population analytics..." /></main>;
  if (isError || !analytics) return <main className="nmis-page"><ErrorState title="Population data unavailable" action={{ label: 'Retry', onClick: () => refetch() }} /></main>;

  return (
    <main className="nmis-page">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Population & Enrolment"
          title="Population Overview"
          subtitle="Management view of normalized monthly capitation lists across the Provider Directory, including sector and category composition."
          actions={
            <div className="flex flex-wrap gap-2">
              <Link to="/population/enrolment/new">
                <Button className="gap-2"><UserPlus size={16} /> New Enrollee</Button>
              </Link>
              <Link to="/population/enrolment/upload">
                <Button variant="secondary" className="gap-2"><Upload size={16} /> Upload Capitation List</Button>
              </Link>
              <Link to="/population/enrolment/register">
                <Button variant="secondary" className="gap-2"><LayoutGrid size={16} /> Open Register</Button>
              </Link>
            </div>
          }
        />

        {/* Global Filters */}
        <div className="nmis-card p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="grid flex-1 gap-3 sm:grid-cols-3">
              <Select
                label="Sector"
                value={sector}
                onChange={e => setSector(e.target.value as any)}
                options={[{ label: 'All Sectors', value: 'all' }, { label: 'Formal (/C/)', value: 'formal' }, { label: 'Informal (/D/)', value: 'informal' }]}
              />
              <Select
                label="Category"
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                options={[{ label: 'All Categories', value: 'all' }, { label: 'Principal', value: 'principal' }, { label: 'Dependant', value: 'dependant' }]}
              />
              <Select
                label="Reporting Period"
                value={period}
                onChange={e => setPeriod(e.target.value)}
                options={[{ label: 'All Periods', value: 'all' }, ...analytics.monthlyTrend.map(item => ({ label: item.name, value: item.name }))]}
              />
            </div>
            <Button variant="secondary" className="h-[2.625rem]" onClick={() => { setSector('all'); setCategory('all'); setPeriod('all'); }}>Reset</Button>
          </div>
        </div>

        {/* KPIs */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <KpiCard title="Total enrollees" value={analytics.totalEnrollees.toLocaleString()} subtitle="Active beneficiaries" tone="primary" icon={<Users size={20} />} />
          <KpiCard title="Formal sector" value={analytics.formalCount.toLocaleString()} subtitle={`${analytics.formalPercentage}% of network`} tone="success" icon={<FileSpreadsheet size={20} />} />
          <KpiCard title="Informal sector" value={analytics.informalCount.toLocaleString()} subtitle={`${analytics.informalPercentage}% of network`} tone="warning" icon={<FileSpreadsheet size={20} />} />
          <KpiCard title="Principals" value={analytics.principalCount.toLocaleString()} subtitle={`${analytics.principalPercentage}% ratio`} tone="info" icon={<Users size={20} />} />
          <KpiCard title="Dependants" value={analytics.dependantCount.toLocaleString()} subtitle={`${analytics.dependantPercentage}% ratio`} tone="neutral" icon={<Users size={20} />} />
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <KpiCard title="Facilities covered" value={analytics.providerCount.toLocaleString()} subtitle="Matched providers" tone="info" icon={<Building2 size={20} />} />
          <KpiCard title="LGAs covered" value={analytics.lgaCount.toLocaleString()} subtitle="Geographic spread" tone="success" icon={<MapPin size={20} />} />
          <KpiCard title="Districts" value={analytics.senatorialDistrictCount.toLocaleString()} subtitle="Political coverage" tone="warning" icon={<MapPin size={20} />} />
          <KpiCard title="Linked expenditure" value={formatNaira(analytics.financialExpenditure)} subtitle="Matched by period" tone="primary" icon={<FileSpreadsheet size={20} />} />
          <KpiCard title="Monthly capitation" value={formatNaira(analytics.capitationExpenditure)} subtitle={`₦${analytics.capitationRate.toLocaleString('en-NG')} per enrollee`} tone="success" icon={<WalletCards size={20} />} />
          <KpiCard title="PEPM" value={formatNaira(analytics.pepm)} subtitle="Avg cost per enrollee" tone="neutral" icon={<ArrowUpRight size={20} />} />
        </section>

        {/* Charts Row 1 */}
        <section className="grid gap-6 lg:grid-cols-3">
          <ChartCard title="Sector distribution" subtitle="Formal (/C/) vs Informal (/D/)">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={analytics.bySector} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={4}>
                    {analytics.bySector.map((_, i) => <Cell key={i} fill={i === 0 ? '#0b3d91' : '#f59e0b'} />)}
                  </Pie>
                  <Tooltip formatter={v => [Number(v).toLocaleString(), 'Enrollees']} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Category distribution" subtitle="Principal vs Dependant ratio">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={analytics.byCategory} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={4}>
                    {analytics.byCategory.map((_, i) => <Cell key={i} fill={i === 0 ? '#10b981' : '#8b5cf6'} />)}
                  </Pie>
                  <Tooltip formatter={v => [Number(v).toLocaleString(), 'Enrollees']} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Gender distribution" subtitle="Beneficiary gender balance">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.byGender}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => [Number(v).toLocaleString(), 'Enrollees']} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </section>

        {/* Charts Row 2 */}
        <section className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Monthly enrolment trend" subtitle="Normalized records by reporting period">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.monthlyTrend}>
                  <defs><linearGradient id="popFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0b3d91" stopOpacity={0.1} /><stop offset="100%" stopColor="#0b3d91" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => [Number(v).toLocaleString(), 'Enrollees']} />
                  <Area type="monotone" dataKey="value" stroke="#0b3d91" fill="url(#popFill)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Enrolment by LGA" subtitle="Top 10 LGAs by population concentration">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.byLga.slice(0, 10)} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef2f7" />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => [Number(v).toLocaleString(), 'Enrollees']} />
                  <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </section>

        {/* Charts Row 3 */}
        <section className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="PEPM trend" subtitle="Expenditure per enrollee by period">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.pepmTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={formatCompactNaira} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => [formatNaira(Number(v)), 'PEPM']} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <Card className="bg-brand-soft border-brand-blue/20 flex flex-col justify-center p-8">
            <div className="flex items-center gap-3 text-brand-blue mb-4">
              <FileSpreadsheet size={24} />
              <h3 className="text-lg font-black uppercase tracking-widest">Financial Linkage</h3>
            </div>
            <p className="text-sm leading-relaxed text-brand-secondary">
              PEPM (Expenditure per Enrollee per Month) is an analytical view. NMIS links normalized population counts to expenditure by reporting period without altering historical financial records.
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              <div>
                <p className="nmis-label">Linked Expenditure</p>
                <p className="nmis-number text-xl font-black text-brand-navy">{formatNaira(analytics.financialExpenditure)}</p>
              </div>
              <div>
                <p className="nmis-label">Monthly Capitation</p>
                <p className="nmis-number text-xl font-black text-brand-navy">{formatNaira(analytics.capitationExpenditure)}</p>
                <p className="mt-1 text-xs text-brand-muted">₦{analytics.capitationRate.toLocaleString('en-NG')} per enrollee</p>
              </div>
              <div>
                <p className="nmis-label">Current PEPM</p>
                <p className="nmis-number text-xl font-black text-brand-navy">{formatNaira(analytics.pepm)}</p>
              </div>
            </div>
          </Card>
        </section>

        {/* Rankings */}
        <section className="grid gap-6 lg:grid-cols-2">
          <RankingCard title="Top facilities by enrolment" data={analytics.byFacility} />
          <RankingCard title="Senatorial district coverage" data={analytics.bySenatorialDistrict} />
        </section>

        {/* Logic Notice */}
        <Card className="bg-brand-surface border-brand-divider border-l-4 border-l-brand-blue">
          <div className="flex items-start gap-4">
            <div className="mt-1 text-brand-blue"><ShieldCheck size={20} /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-foreground">Data Interpretation Rule</p>
              <p className="mt-1 text-sm leading-relaxed text-brand-secondary">
                <strong>CATEGORY</strong> is read directly from the source workbook. <strong>SECTOR</strong> is independently derived from the policy number: <code>/C/ = Formal</code> and <code>/D/ = Informal</code>. These filters are authoritative and must not be conflated.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}

function RankingCard({ title, data }: { title: string; data: Array<{ name: string; value: number }> }) {
  const max = data[0]?.value || 1;
  return (
    <Card>
      <SectionHeader title={title} />
      <div className="mt-6 space-y-5">
        {data.slice(0, 8).map((item, index) => (
          <div key={item.name}>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="truncate font-bold text-brand-secondary">
                <span className="text-brand-muted mr-2">{index + 1}.</span>
                {item.name}
              </span>
              <span className="shrink-0 font-black text-brand-foreground">{item.value.toLocaleString()}</span>
            </div>
            <div className="mt-2.5 h-1.5 rounded-pill bg-brand-surface overflow-hidden">
              <div
                className="h-full bg-brand-blue rounded-pill transition-all duration-500"
                style={{ width: `${Math.max((item.value / max) * 100, 2)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ShieldCheck({ size }: { size: number }) { return <FileSpreadsheet size={size} />; }
