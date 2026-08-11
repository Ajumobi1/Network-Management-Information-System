import React from 'react';
import { 
  TrendingUp, 
  Users, 
  Building2, 
  CreditCard, 
  DollarSign, 
  FileText, 
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
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
  Pie
} from 'recharts';

const data = [
  { name: 'Jan', claims: 4000, capitation: 2400, ffs: 2400 },
  { name: 'Feb', claims: 3000, capitation: 1398, ffs: 2210 },
  { name: 'Mar', claims: 2000, capitation: 9800, ffs: 2290 },
  { name: 'Apr', claims: 2780, capitation: 3908, ffs: 2000 },
  { name: 'May', claims: 1890, capitation: 4800, ffs: 2181 },
  { name: 'Jun', claims: 2390, capitation: 3800, ffs: 2500 },
  { name: 'Jul', claims: 3490, capitation: 4300, ffs: 2100 },
];

const typeData = [
  { name: 'Claims', value: 45 },
  { name: 'Capitation', value: 35 },
  { name: 'FFS', value: 20 },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

export default function FinancialDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Financial Overview</h1>
        <p className="mt-1 text-slate-500">Monitor health network expenditure, claims, and capitation trends.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Expenditure" 
          value="₦245.8M" 
          change="+12.5%" 
          trend="up" 
          icon={DollarSign} 
        />
        <StatCard 
          title="Claims Paid" 
          value="₦112.4M" 
          change="+8.2%" 
          trend="up" 
          icon={FileText} 
        />
        <StatCard 
          title="Capitation" 
          value="₦86.2M" 
          change="-2.4%" 
          trend="down" 
          icon={CreditCard} 
        />
        <StatCard 
          title="Active Providers" 
          value="482" 
          change="+4" 
          trend="up" 
          icon={Building2} 
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Expenditure Trend</h3>
            <select className="rounded-lg border-slate-200 text-sm focus:ring-brand-blue">
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `₦${value/1000}M`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`₦${Number(value).toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="claims" stroke="#3b82f6" fillOpacity={1} fill="url(#colorClaims)" />
                <defs>
                  <linearGradient id="colorClaims" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <h3 className="mb-6 font-semibold text-slate-900">Expenditure Mix</h3>
          <div className="flex h-[300px] items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="ml-8 space-y-4">
              {typeData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.value}% of total</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, trend, icon: Icon }: any) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 transition hover:shadow-lg hover:shadow-slate-200/50">
      <div className="flex items-center justify-between">
        <div className="rounded-2xl bg-slate-50 p-3">
          <Icon className="h-6 w-6 text-slate-600" />
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
          {change}
          {trend === 'up' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h4 className="mt-1 text-2xl font-bold text-slate-900">{value}</h4>
      </div>
    </div>
  );
}
