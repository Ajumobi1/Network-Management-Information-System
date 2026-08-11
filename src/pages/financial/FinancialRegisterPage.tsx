import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  ChevronRight, 
  FileText,
  Building2,
  Calendar,
  MoreVertical
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
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-1 text-slate-500">Manage and analyze normalized {type} records.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="primary" className="flex items-center gap-2">
            Add Record
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/50 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search provider, code, or location..."
                className="w-full rounded-xl border-slate-200 pl-10 text-sm focus:ring-brand-blue"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <select className="rounded-xl border-slate-200 text-sm focus:ring-brand-blue">
                <option>All Periods</option>
                <option>August 2026</option>
                <option>July 2026</option>
              </select>
              <Button variant="secondary" className="flex items-center gap-2 py-2 px-3 text-xs">
                <Filter className="h-4 w-4" />
                More Filters
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Provider</th>
                <th className="px-6 py-4 font-semibold">Period</th>
                {type === 'claims' && <th className="px-6 py-4 font-semibold text-right">Claimed</th>}
                <th className="px-6 py-4 font-semibold text-right">Amount</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4">
                      <div className="h-10 rounded-lg bg-slate-50" />
                    </td>
                  </tr>
                ))
              ) : records?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No records found matching your criteria.
                  </td>
                </tr>
              ) : (
                records?.map((record) => (
                  <tr key={record.id} className="group hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{record.providerName}</p>
                          <p className="text-xs text-slate-500">{record.providerCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="h-4 w-4" />
                        {record.period}
                      </div>
                    </td>
                    {type === 'claims' && (
                      <td className="px-6 py-4 text-right font-medium text-slate-500">
                        {formatNaira(record.amountClaimed)}
                      </td>
                    )}
                    <td className="px-6 py-4 text-right font-bold text-slate-900">
                      {formatNaira(record.amountPaid || record.netAmount || record.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={record.paymentStatus === 'paid' ? 'success' : 'warning'}>
                        {record.paymentStatus || 'pending'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                        <ChevronRight className="h-5 w-5" />
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
