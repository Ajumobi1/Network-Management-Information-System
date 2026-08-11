import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowUpRight, Building2, FileSpreadsheet, MapPin, Users, Upload } from 'lucide-react';
import Button from '../../components/ui/Button';
import { useEnrolmentAnalytics } from '../../hooks/enrolment';
import { EnrolmentFilters, EnrolmentSector } from '../../types/enrolment/enrolmentTypes';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#0f766e', '#f43f5e'];

export default function PopulationOverviewPage() {
  const [sector, setSector] = useState<EnrolmentSector | 'all'>('all');
  const [category, setCategory] = useState<'principal' | 'dependant' | 'all'>('all');
  const [period, setPeriod] = useState('all');
  const filters = useMemo<EnrolmentFilters>(() => ({ sector, category, period }), [category, period, sector]);
  const { data: analytics, isLoading, isError } = useEnrolmentAnalytics(filters);

  if (isLoading) return <LoadingState />;
  if (isError || !analytics) return <ErrorState />;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand-blue">Population &amp; Enrolment</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Population Overview</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">Management view of normalized monthly capitation lists across the Provider Directory, including formal/informal sector and principal/dependant composition.</p>
        </div>
        <div className="flex flex-wrap gap-3"><Link to="/population/enrolment/upload"><Button><Upload className="mr-2 h-4 w-4" /> Upload capitation list</Button></Link><Link to="/population/enrolment/register"><Button variant="secondary">Open enrolment register</Button></Link></div>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-sm font-bold text-slate-900">Analysis filters</p><p className="mt-1 text-xs text-slate-500">Sector and category remain independent dimensions.</p></div><div className="grid gap-3 sm:grid-cols-3"><FilterSelect label="Sector" value={sector} onChange={value => setSector(value as EnrolmentSector | 'all')} options={['all', 'formal', 'informal']} /><FilterSelect label="Category" value={category} onChange={value => setCategory(value as 'principal' | 'dependant' | 'all')} options={['all', 'principal', 'dependant']} /><FilterSelect label="Period" value={period} onChange={setPeriod} options={['all', ...analytics.monthlyTrend.map(item => item.name)]} /></div></div></section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total enrollees" value={analytics.totalEnrollees.toLocaleString()} icon={Users} accent="blue" />
        <MetricCard label="Formal sector" value={`${analytics.formalCount.toLocaleString()} (${analytics.formalPercentage}%)`} icon={FileSpreadsheet} accent="emerald" />
        <MetricCard label="Informal sector" value={`${analytics.informalCount.toLocaleString()} (${analytics.informalPercentage}%)`} icon={FileSpreadsheet} accent="amber" />
        <MetricCard label="Facilities covered" value={analytics.providerCount.toLocaleString()} icon={Building2} accent="violet" />
        <MetricCard label="Principals" value={`${analytics.principalCount.toLocaleString()} (${analytics.principalPercentage}%)`} icon={Users} accent="blue" />
        <MetricCard label="Dependants" value={`${analytics.dependantCount.toLocaleString()} (${analytics.dependantPercentage}%)`} icon={Users} accent="pink" />
        <MetricCard label="LGAs covered" value={analytics.lgaCount.toLocaleString()} icon={MapPin} accent="emerald" />
        <MetricCard label="Senatorial districts" value={analytics.senatorialDistrictCount.toLocaleString()} icon={MapPin} accent="amber" />
        <MetricCard label="Linked expenditure" value={formatNaira(analytics.financialExpenditure)} icon={FileSpreadsheet} accent="blue" />
        <MetricCard label="PEPM" value={formatNaira(analytics.pepm)} icon={ArrowUpRight} accent="violet" />
      </section>

      <section className="grid gap-6 lg:grid-cols-3"><ChartCard title="Sector distribution" subtitle="Formal versus informal"><ResponsiveContainer width="100%" height={280}><PieChart><Pie data={analytics.bySector} dataKey="value" nameKey="name" innerRadius={62} outerRadius={96} paddingAngle={4}>{analytics.bySector.map((entry, index) => <Cell key={entry.name} fill={index === 0 ? '#2563eb' : '#f59e0b'} />)}</Pie><Tooltip formatter={(value) => [Number(value ?? 0).toLocaleString(), 'Enrollees']} /><Legend /></PieChart></ResponsiveContainer></ChartCard><ChartCard title="Category distribution" subtitle="Source CATEGORY preserved"><ResponsiveContainer width="100%" height={280}><PieChart><Pie data={analytics.byCategory} dataKey="value" nameKey="name" innerRadius={62} outerRadius={96} paddingAngle={4}>{analytics.byCategory.map((entry, index) => <Cell key={entry.name} fill={index === 0 ? '#10b981' : '#8b5cf6'} />)}</Pie><Tooltip formatter={(value) => [Number(value ?? 0).toLocaleString(), 'Enrollees']} /><Legend /></PieChart></ResponsiveContainer></ChartCard><ChartCard title="Gender distribution" subtitle="Normalized beneficiary gender"><ResponsiveContainer width="100%" height={280}><BarChart data={analytics.byGender}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip formatter={(value) => [Number(value ?? 0).toLocaleString(), 'Enrollees']} /><Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></ChartCard></section>

      <section className="grid gap-6 lg:grid-cols-2"><ChartCard title="Monthly enrolment trend" subtitle="Normalized records by reporting period"><ResponsiveContainer width="100%" height={300}><AreaChart data={analytics.monthlyTrend}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip formatter={(value) => [Number(value ?? 0).toLocaleString(), 'Enrollees']} /><Area type="monotone" dataKey="value" stroke="#2563eb" fill="#bfdbfe" fillOpacity={0.55} strokeWidth={3} /></AreaChart></ResponsiveContainer></ChartCard><ChartCard title="Enrolment by LGA" subtitle="Operational coverage concentration"><ResponsiveContainer width="100%" height={300}><BarChart data={analytics.byLga.slice(0, 10)} layout="vertical" margin={{ left: 24, right: 20 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" /><XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip formatter={(value) => [Number(value ?? 0).toLocaleString(), 'Enrollees']} /><Bar dataKey="value" fill="#10b981" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer></ChartCard></section>

      <section className="grid gap-6 lg:grid-cols-2"><ChartCard title="Expenditure per enrollee per month (PEPM)" subtitle={`${analytics.financialRecordCount.toLocaleString()} financial records linked by period`}><ResponsiveContainer width="100%" height={300}><BarChart data={analytics.pepmTrend}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tickFormatter={formatCompactNaira} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip formatter={(value) => [formatNaira(Number(value ?? 0)), 'PEPM']} /><Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></ChartCard><div className="rounded-3xl border border-violet-100 bg-violet-50 p-6"><h2 className="text-lg font-bold text-violet-950">Financial linkage note</h2><p className="mt-2 text-sm leading-6 text-violet-900">PEPM is an analytical view only. NMIS links normalized population counts to expenditure by reporting period without rewriting historical claims, capitation, or FFS records.</p><p className="mt-5 font-semibold text-violet-950">Linked expenditure: {formatNaira(analytics.financialExpenditure)}</p><p className="mt-1 text-sm text-violet-900">Current PEPM: {formatNaira(analytics.pepm)}</p></div></section>

      <section className="grid gap-6 lg:grid-cols-2"><RankingCard title="Top facilities by enrolment" data={analytics.byFacility} /><RankingCard title="Senatorial district coverage" data={analytics.bySenatorialDistrict} /></section>

      <section className="rounded-3xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-900"><p className="font-bold">Data interpretation rule</p><p className="mt-1">CATEGORY is read directly from the source workbook. SECTOR is independently derived from the policy number: <strong>/C/ = Formal</strong> and <strong>/D/ = Informal</strong>. The two filters must not be conflated.</p></section>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, accent }: { label: string; value: string; icon: React.ComponentType<{ className?: string }>; accent: 'blue' | 'emerald' | 'amber' | 'violet' | 'pink' }) {
  const colors = { blue: 'text-brand-blue bg-blue-50', emerald: 'text-emerald-600 bg-emerald-50', amber: 'text-amber-600 bg-amber-50', violet: 'text-violet-600 bg-violet-50', pink: 'text-pink-600 bg-pink-50' };
  return <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</span><span className={`rounded-xl p-2 ${colors[accent]}`}><Icon className="h-4 w-4" /></span></div><p className="mt-4 text-xl font-black text-slate-900">{value}</p></div>;
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-bold text-slate-900">{title}</h2><p className="mt-1 text-xs text-slate-500">{subtitle}</p></div><ArrowUpRight className="h-4 w-4 text-slate-300" /></div><div className="mt-4">{children}</div></div>;
}

function RankingCard({ title, data }: { title: string; data: Array<{ name: string; value: number }> }) {
  const max = data[0]?.value || 1;
  return <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-bold text-slate-900">{title}</h2><div className="mt-5 space-y-4">{data.slice(0, 8).map((item, index) => <div key={item.name}><div className="flex items-center justify-between gap-4 text-sm"><span className="truncate font-semibold text-slate-700">{index + 1}. {item.name}</span><span className="shrink-0 font-black text-slate-900">{item.value.toLocaleString()}</span></div><div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-blue" style={{ width: `${Math.max((item.value / max) * 100, 4)}%` }} /></div></div>)}</div></div>;
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <label className="text-xs font-semibold text-slate-500"><span>{label}</span><select className="mt-1 block min-w-[130px] rounded-xl border-slate-200 text-sm font-normal text-slate-700" value={value} onChange={event => onChange(event.target.value)}>{options.map(option => <option key={option} value={option}>{option === 'all' ? 'All' : option.charAt(0).toUpperCase() + option.slice(1)}</option>)}</select></label>;
}

function LoadingState() { return <div className="flex h-96 items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-brand-blue" /></div>; }
function ErrorState() { return <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">Population data could not be loaded. Check the enrolment repository configuration and try again.</div>; }
function formatNaira(amount: number) { return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(Number.isFinite(amount) ? amount : 0); }
function formatCompactNaira(amount: number) { return amount >= 1000000 ? `₦${(amount / 1000000).toFixed(1)}M` : amount >= 1000 ? `₦${(amount / 1000).toFixed(0)}K` : `₦${amount}`; }
