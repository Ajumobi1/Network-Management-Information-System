import React from 'react';
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
import { ArrowLeft, BarChart3, Building2, FileText, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { useFinancialAnalytics } from '../../hooks/financial-data/financialDataHooks';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#0f766e'];

export default function ClaimsAnalyticsPage() {
  const { data: claims, isLoading: claimsLoading } = useFinancialAnalytics({ dataType: 'claims' });
  const { data: comparison, isLoading: comparisonLoading } = useFinancialAnalytics();
  const isLoading = claimsLoading || comparisonLoading;

  if (isLoading) {
    return <div className="flex h-96 items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-brand-blue" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3"><Link to="/financial/claims" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link><h1 className="text-2xl font-bold text-slate-900">Claims Analytics</h1></div>
          <p className="mt-2 text-slate-500">Management analysis of processed Claims/payment data received from the Claims Department.</p>
        </div>
        <Link to="/financial/claims"><Button variant="secondary">Open Claims Register</Button></Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Claims expenditure" value={formatNaira(claims?.totalClaims ?? 0)} icon={FileText} />
        <MetricCard label="Claim count / encounters" value={(claims?.totalClaimCount ?? 0).toLocaleString()} icon={BarChart3} />
        <MetricCard label="Average paid claim" value={formatNaira(claims?.averageClaimAmount ?? 0)} icon={TrendingUp} />
        <MetricCard label="Rejected / disallowed" value={formatNaira(claims?.rejectedAmount ?? 0)} icon={Building2} />
      </div>

      <section className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Claims expenditure trend" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={claims?.trends}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatCompactNaira} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => [formatNaira(Number(value ?? 0)), 'Amount']} />
              <Area type="monotone" dataKey="value" stroke="#2563eb" fill="#bfdbfe" fillOpacity={0.55} strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Paid vs rejected / disallowed">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={claims?.paidVsRejected} dataKey="value" nameKey="name" innerRadius={65} outerRadius={100} paddingAngle={5}>
                {claims?.paidVsRejected.map((entry, index) => <Cell key={entry.name} fill={index === 0 ? '#10b981' : '#f43f5e'} />)}
              </Pie>
              <Tooltip formatter={(value) => [formatNaira(Number(value ?? 0)), 'Amount']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Claims expenditure by facility type">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={claims?.byFacilityType} layout="vertical" margin={{ left: 24, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" tickFormatter={formatCompactNaira} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={125} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => [formatNaira(Number(value ?? 0)), 'Amount']} />
              <Bar dataKey="value" fill="#10b981" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Claims expenditure by ownership">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={claims?.byOwnership}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={65} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatCompactNaira} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => [formatNaira(Number(value ?? 0)), 'Amount']} />
              <Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <RankingCard title="Top facilities by expenditure" data={claims?.topFacilitiesByAmount ?? []} formatValue={formatNaira} />
        <RankingCard title="Top facilities by claim volume" data={claims?.topFacilitiesByVolume ?? []} formatValue={value => value.toLocaleString()} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Claims category distribution">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={claims?.byClaimsCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {claims?.byClaimsCategory.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(value) => [formatNaira(Number(value ?? 0)), 'Amount']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Claims vs Capitation vs FFS">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparison?.byCategory}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatCompactNaira} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => [formatNaira(Number(value ?? 0)), 'Amount']} />
              <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="rounded-3xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-900">
        <p className="font-bold">Business boundary</p>
        <p className="mt-1">This module analyzes processed Claims/payment data supplied by the Claims Department. It does not adjudicate, authorize, clinically vet, or approve Claims payments.</p>
      </section>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
  return <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span><Icon className="h-5 w-5 text-brand-blue" /></div><p className="nmis-number mt-4 text-2xl font-black text-slate-900">{value}</p></div>;
}

function ChartCard({ title, className = '', children }: { title: string; className?: string; children: React.ReactNode }) {
  return <div className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}><h2 className="mb-5 text-lg font-bold text-slate-900">{title}</h2>{children}</div>;
}

function RankingCard({ title, data, formatValue }: { title: string; data: Array<{ name: string; value: number }>; formatValue: (value: number) => string }) {
  const max = data[0]?.value || 1;
  return <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-bold text-slate-900">{title}</h2><div className="mt-5 space-y-4">{data.slice(0, 6).map((item, index) => <div key={item.name}><div className="flex items-center justify-between gap-4 text-sm"><span className="truncate font-semibold text-slate-700">{index + 1}. {item.name}</span><span className="nmis-number shrink-0 font-black text-slate-900">{formatValue(item.value)}</span></div><div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-blue" style={{ width: `${Math.max((item.value / max) * 100, 4)}%` }} /></div></div>)}</div></div>;
}

function formatNaira(amount: number) { return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(Number.isFinite(amount) ? amount : 0); }
function formatCompactNaira(amount: number) { return amount >= 1000000 ? `₦${(amount / 1000000).toFixed(1)}M` : amount >= 1000 ? `₦${(amount / 1000).toFixed(0)}K` : `₦${amount}`; }
