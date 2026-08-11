import React, { useMemo, useState } from 'react';
import { AlertCircle, Calendar, CheckCircle2, Download, FileSpreadsheet, History, User, X } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { useImportBatch, useImportBatches } from '../../hooks/financial-data/financialDataHooks';
import { ImportBatch } from '../../types/financial-data';

export default function ImportHistoryPage() {
  const { data: batches = [], isLoading } = useImportBatches();
  const [search, setSearch] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const { data: selectedBatch } = useImportBatch(selectedBatchId);

  const filteredBatches = useMemo(() => batches.filter(batch => {
    const query = search.toLowerCase().trim();
    return !query || [batch.fileName, batch.id, batch.dataType, batch.status, batch.periodCovered].some(value => String(value ?? '').toLowerCase().includes(query));
  }), [batches, search]);

  const exportHistory = () => {
    const headers = ['Batch ID', 'File name', 'Data type', 'Uploaded at', 'Uploaded by', 'Period', 'Total rows', 'Imported rows', 'Warnings', 'Errors', 'Duplicates', 'Unmatched providers', 'Status'];
    const rows = batches.map(batch => [batch.id, batch.fileName, batch.dataType, batch.uploadedAt, batch.uploadedBy, batch.periodCovered, batch.totalRows, batch.importedRows, batch.warningRows, batch.errorRows, batch.duplicateRows, batch.unmatchedProviders, batch.status]);
    const csv = [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nmis-financial-import-history.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">Import History</h1><p className="mt-1 text-slate-500">Trace every workbook, validation outcome, duplicate decision, and commit result.</p></div>
        <Button variant="secondary" className="flex items-center gap-2" onClick={exportHistory} disabled={batches.length === 0}><Download className="h-4 w-4" /> Export history</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Summary label="Total batches" value={batches.length} icon={History} /><Summary label="Imported rows" value={batches.reduce((sum, batch) => sum + batch.importedRows, 0)} icon={CheckCircle2} /><Summary label="Duplicate rows" value={batches.reduce((sum, batch) => sum + batch.duplicateRows, 0)} icon={AlertCircle} /><Summary label="Validation errors" value={batches.reduce((sum, batch) => sum + batch.errorRows, 0)} icon={AlertCircle} /></div>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/50 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold text-slate-900">Financial data batches</h2><p className="mt-1 text-xs text-slate-500">{filteredBatches.length} of {batches.length} batches shown.</p></div><input type="search" aria-label="Search import history" placeholder="Search file, batch, type, status..." className="rounded-xl border-slate-200 text-sm sm:w-80" value={search} onChange={event => setSearch(event.target.value)} /></div><div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-6 py-4">File / Batch</th><th className="px-6 py-4">Type / Period</th><th className="px-6 py-4">Uploaded</th><th className="px-6 py-4">Rows</th><th className="px-6 py-4">Review signals</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{isLoading ? <LoadingRows /> : filteredBatches.length === 0 ? <tr><td colSpan={7} className="px-6 py-16 text-center text-slate-500">No import batches match the current search.</td></tr> : filteredBatches.map(batch => <BatchRow key={batch.id} batch={batch} onDetails={() => setSelectedBatchId(batch.id)} />)}</tbody></table></div></section>

      {selectedBatch && <BatchDetails batch={selectedBatch} onClose={() => setSelectedBatchId(null)} />}
    </div>
  );
}

function BatchRow({ batch, onDetails }: { batch: ImportBatch; onDetails: () => void }) {
  return <tr className="hover:bg-slate-50/60"><td className="px-6 py-4"><div className="flex items-center gap-3"><div className="rounded-xl bg-emerald-50 p-2 text-emerald-600"><FileSpreadsheet className="h-4 w-4" /></div><div><p className="font-semibold text-slate-900">{batch.fileName}</p><p className="font-mono text-xs text-slate-500">{batch.id}</p></div></div></td><td className="px-6 py-4"><Badge variant="info" className="capitalize">{batch.dataType}</Badge><p className="mt-1 text-xs text-slate-500">{batch.periodCovered || 'Period not stated'}</p></td><td className="px-6 py-4"><div className="flex items-center gap-1.5 text-slate-700"><Calendar className="h-3.5 w-3.5 text-slate-400" />{new Date(batch.uploadedAt).toLocaleDateString()}</div><div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><User className="h-3.5 w-3.5" />{batch.uploadedBy}</div></td><td className="px-6 py-4"><p className="font-bold text-slate-900">{batch.importedRows.toLocaleString()} / {batch.totalRows.toLocaleString()}</p><p className="text-xs text-slate-500">imported / total</p></td><td className="px-6 py-4"><div className="flex flex-wrap gap-1.5">{batch.warningRows > 0 && <Badge variant="warning">{batch.warningRows} warnings</Badge>}{batch.errorRows > 0 && <Badge variant="error">{batch.errorRows} errors</Badge>}{batch.duplicateRows > 0 && <Badge variant="warning">{batch.duplicateRows} duplicates</Badge>}{batch.unmatchedProviders > 0 && <Badge variant="info">{batch.unmatchedProviders} unmatched</Badge>}{batch.warningRows === 0 && batch.errorRows === 0 && batch.duplicateRows === 0 && <span className="text-xs text-emerald-600">No exceptions</span>}</div></td><td className="px-6 py-4"><Badge variant={batch.status === 'imported' ? 'success' : batch.status === 'failed' || batch.status === 'superseded' ? 'error' : 'warning'}>{batch.status}</Badge></td><td className="px-6 py-4 text-right"><Button variant="secondary" className="py-2 px-3 text-xs" onClick={onDetails}>Details</Button></td></tr>;
}

function BatchDetails({ batch, onClose }: { batch: ImportBatch; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/30 p-4 sm:items-center"><div className="w-full max-w-2xl rounded-3xl bg-white p-7 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Import batch details</p><h2 className="mt-1 text-xl font-black text-slate-900">{batch.fileName}</h2><p className="mt-1 font-mono text-xs text-slate-500">{batch.id}</p></div><button aria-label="Close details" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100" onClick={onClose}><X className="h-5 w-5" /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Detail label="Status" value={batch.status} /><Detail label="Data type" value={batch.dataType} /><Detail label="Period covered" value={batch.periodCovered || 'Not stated'} /><Detail label="Uploaded by" value={batch.uploadedBy} /><Detail label="Rows imported" value={`${batch.importedRows} / ${batch.totalRows}`} /><Detail label="Validation errors" value={String(batch.errorRows)} /><Detail label="Warnings" value={String(batch.warningRows)} /><Detail label="Duplicate rows" value={String(batch.duplicateRows)} /><Detail label="Unmatched providers" value={String(batch.unmatchedProviders)} /><Detail label="Uploaded at" value={new Date(batch.uploadedAt).toLocaleString()} /></div>{batch.metadata && <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600"><p className="font-bold text-slate-900">Source metadata</p><pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(batch.metadata, null, 2)}</pre></div>}</div></div>;
}

function Summary({ label, value, icon: Icon }: { label: string; value: number; icon: React.ComponentType<{ className?: string }> }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span><Icon className="h-4 w-4 text-brand-blue" /></div><p className="mt-3 text-2xl font-black text-slate-900">{value.toLocaleString()}</p></div>; }
function Detail({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 font-semibold text-slate-800">{value}</p></div>; }
function LoadingRows() { return <>{Array.from({ length: 4 }).map((_, index) => <tr key={index} className="animate-pulse"><td colSpan={7} className="px-6 py-6"><div className="h-10 rounded-xl bg-slate-100" /></td></tr>)}</>; }
function csvCell(value: unknown) { const text = value === undefined || value === null ? '' : String(value); return `"${text.replace(/"/g, '""')}"`; }
