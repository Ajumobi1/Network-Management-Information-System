import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Award, Building2, ShieldAlert, Target, TrendingUp, AlertTriangle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useProviderPerformanceRecords, useProviderPerformanceSummary } from '../hooks/performance/providerPerformanceHooks';
import { PerformanceFilters, PerformanceRating } from '../types/performance/providerPerformanceTypes';
import { ProviderCategory, ProviderOwnership } from '../types/providers/providerTypes';

const ratingColors: Record<PerformanceRating, string> = {
  'Excellent': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Good': 'bg-blue-100 text-blue-800 border-blue-200',
  'Satisfactory': 'bg-slate-100 text-slate-800 border-slate-200',
  'Needs Improvement': 'bg-amber-100 text-amber-800 border-amber-200',
  'Critical': 'bg-rose-100 text-rose-800 border-rose-200',
};

export default function PerformancePage() {
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

  const distributionData = summary ? [
    { rating: 'Excellent', count: summary.ratingDistribution['Excellent'] },
    { rating: 'Good', count: summary.ratingDistribution['Good'] },
    { rating: 'Satisfactory', count: summary.ratingDistribution['Satisfactory'] },
    { rating: 'Needs Improvement', count: summary.ratingDistribution['Needs Improvement'] },
    { rating: 'Critical', count: summary.ratingDistribution['Critical'] },
  ] : [];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="Provider performance management"
          description="Consolidated quality scores, inspection ratings, compliance records, and management attention tracking."
          actions={[{ label: 'Export Performance Report', onClick: () => alert('Exporting performance register CSV...') }]}
        />

        {/* Summary KPIs */}
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Evaluated Providers</p>
              <Building2 className="text-indigo-600" size={20} />
            </div>
            <p className="mt-4 text-3xl font-semibold text-slate-900">{isSummaryLoading ? '...' : summary?.totalEvaluated}</p>
            <p className="mt-1 text-xs text-slate-500">Active network facilities</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Average Composite Score</p>
              <Award className="text-emerald-600" size={20} />
            </div>
            <p className="mt-4 text-3xl font-semibold text-slate-900">{isSummaryLoading ? '...' : `${summary?.averageScore}%`}</p>
            <p className="mt-1 text-xs text-slate-500">Weighted network quality</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Management Attention</p>
              <AlertTriangle className="text-rose-600" size={20} />
            </div>
            <p className="mt-4 text-3xl font-semibold text-rose-600">{isSummaryLoading ? '...' : summary?.attentionCount}</p>
            <p className="mt-1 text-xs text-slate-500">Facilities requiring intervention</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Inspection Compliance</p>
              <Target className="text-blue-600" size={20} />
            </div>
            <p className="mt-4 text-3xl font-semibold text-slate-900">{isSummaryLoading ? '...' : `${summary?.inspectionComplianceRate}%`}</p>
            <p className="mt-1 text-xs text-slate-500">Meeting regulatory benchmark</p>
          </div>
        </div>

        {/* Rating Distribution Chart */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft lg:col-span-2">
            <h2 className="text-lg font-semibold text-slate-900">Performance Rating Distribution</h2>
            <p className="text-sm text-slate-500 mt-1">Breakdown of facilities across standard rating tiers.</p>
            <div className="mt-6 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributionData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="rating" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Scoring Model</h2>
              <p className="text-sm text-slate-500 mt-1">Composite score weighting methodology.</p>
              <div className="mt-6 space-y-4 text-sm">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Inspection Audit</span>
                  <span className="font-semibold text-slate-900">35%</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Credentialing & Licensing</span>
                  <span className="font-semibold text-slate-900">25%</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Complaint Resolution</span>
                  <span className="font-semibold text-slate-900">20%</span>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <span className="text-slate-600">Financial / Capitation</span>
                  <span className="font-semibold text-slate-900">20%</span>
                </div>
              </div>
            </div>
            <div className="mt-6 rounded-2xl bg-amber-50 p-4 border border-amber-200">
              <p className="text-xs font-semibold text-amber-800">Intervention Policy</p>
              <p className="mt-1 text-xs text-amber-700">Facilities scoring below 70% or flagged with critical inspection failures enter mandatory review.</p>
            </div>
          </div>
        </div>

        {/* Filters & Register */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <input
              type="text"
              placeholder="Search provider name, code, LGA..."
              value={filters.search}
              onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none min-w-[280px]"
            />
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={filters.rating}
                onChange={e => setFilters(prev => ({ ...prev, rating: e.target.value as any }))}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
              >
                <option value="all">All Ratings</option>
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Satisfactory">Satisfactory</option>
                <option value="Needs Improvement">Needs Improvement</option>
                <option value="Critical">Critical</option>
              </select>

              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  checked={filters.attentionOnly}
                  onChange={e => setFilters(prev => ({ ...prev, attentionOnly: e.target.checked }))}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Attention Required Only
              </label>
            </div>
          </div>

          <div className="nmis-table-scroll">
            {isRecordsLoading ? (
              <div className="p-8 text-center text-slate-500">Loading performance register...</div>
            ) : records.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No facilities found matching performance criteria.</div>
            ) : (
              <table className="w-full min-w-[1000px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-3">Facility</th>
                    <th className="px-6 py-3">Rating</th>
                    <th className="px-6 py-3 text-center">Composite Score</th>
                    <th className="px-6 py-3 text-center">Inspection</th>
                    <th className="px-6 py-3 text-center">Credentialing</th>
                    <th className="px-6 py-3 text-center">Complaints</th>
                    <th className="px-6 py-3">Attention / Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {records.map(r => (
                    <tr key={r.providerId} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{r.providerName}</p>
                        <p className="text-xs text-slate-500">{r.providerCode} • {r.lga}, {r.state}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${ratingColors[r.rating]}`}>
                          {r.rating}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-900">
                        {r.compositeScore}%
                      </td>
                      <td className="px-6 py-4 text-center text-slate-600 font-medium">
                        {r.inspectionScore}%
                      </td>
                      <td className="px-6 py-4 text-center text-slate-600 font-medium">
                        {r.credentialingScore}%
                      </td>
                      <td className="px-6 py-4 text-center text-slate-600 font-medium">
                        {r.complaintScore}%
                      </td>
                      <td className="px-6 py-4">
                        {r.attentionFlag ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-700">
                            <ShieldAlert size={14} /> {r.attentionReason || 'Requires Review'}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Normal</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
