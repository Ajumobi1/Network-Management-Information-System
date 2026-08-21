import { ResponsiveContainer, Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area, BarChart, Bar } from 'recharts';
import { useProviderDistribution, useProviderCategories, useMonthlyGrowth, useInspectionCompletion, usePerformanceRating, useCapitationTrend, useUtilizationTrend } from '../../../hooks/dashboard/dashboardHooks';

const categoryColors = ['#0f3c91', '#10b981', '#0ea5e9', '#f59e0b', '#ec4899', '#64748b'];

export default function DashboardCharts() {
  const { data: distribution = [] } = useProviderDistribution();
  const { data: categories = [] } = useProviderCategories();
  const { data: growth = [] } = useMonthlyGrowth();
  const { data: inspectionCompletion = [] } = useInspectionCompletion();
  const { data: performanceRating = [] } = usePerformanceRating();
  const { data: capitationTrend = [] } = useCapitationTrend();
  const { data: utilizationTrend = [] } = useUtilizationTrend();

  return (
    <section className="grid gap-6 xl:grid-cols-[1.25fr_0.8fr]">
      <div className="space-y-6">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">Provider distribution</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Regional network spread</h2>
            </div>
            <span className="rounded-2xl bg-slate-100 px-3 py-2 text-xs text-slate-600">Live segment</span>
          </div>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={distribution} dataKey="value" nameKey="category" innerRadius={70} outerRadius={110} paddingAngle={4} stroke="none">
                  {distribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value ?? 0, 'Providers']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">Provider categories</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Network specialization mix</h2>
            </div>
            <span className="rounded-2xl bg-slate-100 px-3 py-2 text-xs text-slate-600">Category share</span>
          </div>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categories} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="category" tick={{ fill: '#64748b', fontSize: 12 }} interval={0} angle={-10} textAnchor="end" height={60} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#0f3c91" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">Monthly growth</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Network activation</h2>
            </div>
            <span className="rounded-2xl bg-slate-100 px-3 py-2 text-xs text-slate-600">Current quarter</span>
          </div>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="capitationGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f3c91" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0f3c91" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="capitation" stroke="#0f3c91" fill="url(#capitationGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">Inspection completion</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Operational readiness</h2>
            </div>
            <span className="rounded-2xl bg-slate-100 px-3 py-2 text-xs text-slate-600">Week view</span>
          </div>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={inspectionCompletion} outerRadius={110}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Radar name="Completion" dataKey="completed" stroke="#0f3c91" fill="#0f3c91" fillOpacity={0.2} />
                <Legend iconType="circle" />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">Performance rating</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Quality score</h2>
            </div>
            <span className="rounded-2xl bg-slate-100 px-3 py-2 text-xs text-slate-600">Current month</span>
          </div>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={performanceRating} outerRadius={110}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Radar name="Score" dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                <Legend iconType="circle" />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">Utilization trend</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Provider capacity</h2>
            </div>
            <span className="rounded-2xl bg-slate-100 px-3 py-2 text-xs text-slate-600">Provider network</span>
          </div>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={utilizationTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#0f3c91" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
