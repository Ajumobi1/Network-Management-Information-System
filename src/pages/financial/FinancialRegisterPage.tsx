import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  ChevronRight, 
  FileText,
  Building2,
  Calendar,
  MoreVertical,
  TrendingUp,
  BarChart3,
  Layers
} from 'lucide-react';
import { useFinancialRecords } from '../../hooks/financial-data/financialDataHooks';
import { FinancialDataType } from '../../types/financial-data';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

interface Props {
  type: FinancialDataType;
}

export default function FinancialRegisterPage({ type }: Props) {
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('All Periods');
  const { data: records, isLoading } = useFinancialRecords({ dataType: type, search });

  const title = {
    claims: 'Claims Register',
    capitation: 'Capitation Register',
    ffs: 'FFS Register',
    enrolment: 'Enrolment Register',
    'provider-network': 'Network Register',
    other: 'Financial Register'
  }[type];

  const formatNaira = (amount?: number) => {
    if (amount === undefined) return '-';
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculateAnalytics = () => {
    if (!records || records.length === 0) return null;
    const total = records.reduce((sum, r) => sum + (r.amountPaid || r.netAmount || r.amount || 0), 0);
    const avg = total / records.length;
    return { total, avg, count: records.length };
  };

  const analytics = calculateAnalytics();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-1 text-slate-500">Analytics and monitoring for normalized {type} datasets.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex items-center gap-2 py-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {analytics && (
        <div className="grid gap-6 sm:grid-cols-3">
          <AnalyticsCard 
            label="Total Amount" 
            value={formatNaira(analytics.total)} 
            icon={TrendingUp} 
            color="text-brand-blue" 
          />
          <AnalyticsCard 
            label="Average Per Record" 
            value={formatNaira(analytics.avg)} 
            icon={BarChart3} 
            color="text-emerald-600" 
          />
          <AnalyticsCard 
            label="Record Count" 
            value={analytics.count.toLocaleString()} 
            icon={Layers} 
            color="text-slate-600" 
          />
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/50 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search provider, code, or location..."
                className="w-full rounded-2xl border-slate-200 pl-12 py-3 text-sm focus:ring-brand-blue"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <select 
                className="rounded-2xl border-slate-200 text-sm py-3 focus:ring-brand-blue"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                <option>All Periods</option>
                <option>2026-08</option>
                <option>2026-07</option>
              </select>
              <Button variant="secondary" className="flex items-center gap-2 py-3 px-4">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-bold">
              <tr>
                <th className="px-8 py-5">Provider & Location</th>
                <th className="px-8 py-5">Reporting Period</th>
                {type === 'claims' && <th className="px-8 py-5 text-right">Gross Claimed</th>}
                <th className="px-8 py-5 text-right">Net Payable</th>
                <th className="px-8 py-5">Source Batch</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-8 py-6">
                      <div className="h-12 rounded-2xl bg-slate-50" />
                    </td>
                  </tr>
                ))
              ) : records?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <FileText size={48} className="opacity-20" />
                      <p className="text-lg font-medium">No normalized records found</p>
                      <p className="text-sm">Try adjusting your filters or search criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                records?.map((record) => (
                  <tr key={record.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="rounded-2xl bg-slate-100 p-3 text-slate-600 group-hover:bg-white group-hover:shadow-sm transition-all">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{record.providerName}</p>
                          <p className="text-xs text-slate-500 font-medium">
                            {record.providerCode} • {record.lga}, {record.state}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        {record.period}
                      </div>
                    </td>
                    {type === 'claims' && (
                      <td className="px-8 py-5 text-right font-bold text-slate-400">
                        {formatNaira(record.amountClaimed)}
                      </td>
                    )}
                    <td className="px-8 py-5 text-right font-black text-slate-900">
                      {formatNaira(record.amountPaid || record.netAmount || record.amount)}
                    </td>
                    <td className="px-8 py-5">
                      <Badge variant="info" className="font-mono text-[10px]">
                        {record.importBatchId.substring(0, 8)}
                      </Badge>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button className="rounded-xl p-2 text-slate-400 hover:bg-white hover:text-brand-blue hover:shadow-sm transition-all">
                        <ChevronRight className="h-6 w-6" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AnalyticsCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`rounded-xl bg-slate-50 p-2 ${color}`}>
          <Icon size={18} />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}
