import React from 'react';
import { 
  History, 
  FileSpreadsheet, 
  ChevronRight, 
  Download,
  Calendar,
  User,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useImportBatches } from '../../hooks/financial-data/financialDataHooks';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

export default function ImportHistoryPage() {
  const { data: batches, isLoading } = useImportBatches();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Import History</h1>
          <p className="mt-1 text-slate-500">Track and review previous financial data ingestion batches.</p>
        </div>
        <Button variant="secondary" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export History
        </Button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">File / Batch</th>
                <th className="px-6 py-4 font-semibold">Type</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Records</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4">
                      <div className="h-12 rounded-lg bg-slate-50" />
                    </td>
                  </tr>
                ))
              ) : batches?.map((batch) => (
                <tr key={batch.id} className="group hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                        <FileSpreadsheet className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{batch.fileName}</p>
                        <p className="text-xs text-slate-500">ID: {batch.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="info" className="capitalize">{batch.dataType}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {new Date(batch.uploadedAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <User className="h-3.5 w-3.5" />
                        {batch.uploadedBy}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="font-medium text-slate-900">{batch.importedRows} / {batch.totalRows}</p>
                      {batch.errorRows > 0 && (
                        <p className="text-xs text-rose-600">{batch.errorRows} errors</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={batch.status === 'imported' ? 'success' : 'warning'}>
                      {batch.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="secondary" className="py-2 px-3 text-xs">Details</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
