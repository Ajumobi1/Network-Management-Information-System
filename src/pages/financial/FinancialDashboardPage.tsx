import React, { useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  Building2, 
  CreditCard, 
  DollarSign, 
  FileText, 
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { useFinancialAnalytics } from '../../hooks/financial-data/financialDataHooks';
import Button from '../../components/ui/Button';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function FinancialDashboardPage() {
  const [period, setPeriod] = useState('2026-08');
  const { data: analytics, isLoading } = useFinancialAnalytics({ period });

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-brand-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financial Overview</h1>
          <p className="mt-1 text-slate-500">Network-wide expenditure analysis and funding mix.</p>
        </div>
        <div className="flex gap-3">
          <select 
            className="rounded-xl border-slate-200 text-sm focus:ring-brand-blue"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="2026-08">August 2026</option>
            <option value="2026-07">July 2026</option>
            <option value="2026-06">June 2026</option>
          </select>
          <Button variant="secondary" className="flex items-center gap-2 py-2">
            <Download className="h-4 w-4" />
            Report
          </Button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Expenditure" 
          value={formatNaira(analytics?.totalExpenditure || 0)} 
          change="+12.5%" 
          trend="up" 
          icon={DollarSign} 
        />
        <StatCard 
          title="Claims Volume" 
          value={formatNaira(analytics?.totalClaims || 0)} 
          change="+8.2%" 
          trend="up" 
          icon={FileText} 
        />
        <StatCard 
          title="Capitation Net" 
          value={formatNaira(analytics?.totalCapitation || 0)} 
          change="-2.4%" 
          trend="down" 
          icon={CreditCard} 
        />
        <StatCard 
          title="FFS Payments" 
          value={formatNaira(analytics?.totalFFS || 0)} 
          change="+4.1%" 
          trend="up" 
          icon={BarChart3} 
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 lg:col-span-2">
          <div className="mb-8 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Expenditure Trend</h3>
            <div className="flex items-center gap-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-brand-blue" />
                Monthly Total
              </div>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.trends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `₦${value/1000000}M`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [formatNaira(Number(value)), 'Expenditure']}
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTrend)" />
                <defs>
                  <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8">
          <h3 className="mb-8 text-lg font-bold text-slate-900">Funding Mix</h3>
          <div className="flex h-[350px] flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analytics?.byCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {analytics?.byCategory.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatNaira(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-6 w-full space-y-3">
              {analytics?.byCategory.map((item: any, index: number) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                    <span className="text-sm font-bold capitalize text-slate-700">{item.name}</span>
                  </div>
                  <span className="text-sm font-black text-slate-900">
                    {Math.round((item.value / (analytics?.totalExpenditure || 1)) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-8">
          <h3 className="mb-6 text-lg font-bold text-slate-900">Top Expenditure by State</h3>
          <div className="space-y-6">
            {analytics?.byState?.slice(0, 4).map((item: any) => (
              <LocationBar 
                key={item.name} 
                label={item.name} 
                value={item.value} 
                max={analytics.byState[0]?.value || 1} 
                color="bg-brand-blue" 
              />
            )) || (
              <p className="text-center text-slate-400 py-10">No state data available</p>
            )}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-8">
          <h3 className="mb-6 text-lg font-bold text-slate-900">Expenditure by Facility Type</h3>
          <div className="space-y-6">
            {analytics?.byFacilityType?.slice(0, 4).map((item: any) => (
              <LocationBar 
                key={item.name} 
                label={item.name} 
                value={item.value} 
                max={analytics.byFacilityType[0]?.value || 1} 
                color="bg-emerald-500" 
              />
            )) || (
              <p className="text-center text-slate-400 py-10">No facility type data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, trend, icon: Icon }: any) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 transition hover:shadow-xl hover:shadow-slate-200/50">
      <div className="flex items-center justify-between">
        <div className="rounded-2xl bg-slate-50 p-3">
          <Icon className="h-6 w-6 text-slate-600" />
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold ${trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
          {change}
          {trend === 'up' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
        </div>
      </div>
      <div className="mt-6">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</p>
        <h4 className="mt-2 text-2xl font-black text-slate-900">{value}</h4>
      </div>
    </div>
  );
}

function LocationBar({ label, value, max, color }: any) {
  const percentage = (value / max) * 100;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-bold text-slate-700">{label}</span>
        <span className="font-black text-slate-900">₦{(value/1000000).toFixed(1)}M</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${color}`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
