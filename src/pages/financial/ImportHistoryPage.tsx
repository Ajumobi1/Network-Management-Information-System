import React, { useMemo, useState } from 'react';
import { AlertCircle, Calendar, CheckCircle2, Download, FileSpreadsheet, History, User, X, Search, ChevronRight } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import KpiCard from '../../components/ui/KpiCard';
import Input from '../../components/ui/Input';
import { useImportBatch, useImportBatches } from '../../hooks/financial-data/financialDataHooks';
import { ImportBatch } from '../../types/financial-data';
import { LoadingState, ErrorState } from '../../components/ui/FeedbackStates';
import { SectionHeader } from '../../components/ui/LayoutComponents';
import { isSecureContractError } from '../../lib/security/secureContracts';

export default function ImportHistoryPage() {
  const { data: batches = [], isLoading, isError, error, refetch } = useImportBatches();
  const [search, setSearch] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const { data: selectedBatch } = useImportBatch(selectedBatchId);

  const filteredBatches = useMemo(() => batches.filter(batch => {
    const query = search.toLowerCase().trim();
    return !query || [batch.fileName, batch.id, batch.dataType, batch.status, batch.periodCovered].some(value => String(value ?? '').toLowerCase().includes(query));
  }), [batches, search]);

  const stats = useMemo(() => ({
    total: batches.length,
    rows: batches.reduce((sum, b) => sum + b.importedRows, 0),
    duplicates: batches.reduce((sum, b) => sum + b.duplicateRows, 0),
    errors: batches.reduce((sum, b) => sum + b.errorRows, 0),
  }), [batches]);

  const exportHistory = () => {
    const headers = ['Batch ID', 'File name', 'Data type', 'Uploaded at', 'Uploaded by', 'Period', 'Total rows', 'Imported rows', 'Warnings', 'Errors', 'Duplicates', 'Unmatched providers', 'Status'];
    const rows = batches.map(batch => [batch.id, batch.fileName, batch.dataType, batch.uploadedAt, batch.uploadedBy, batch.periodCovered, batch.totalRows, batch.importedRows, batch.warningRows, batch.errorRows, batch.duplicateRows, batch.unmatchedProviders, batch.status]);
    const csv = [headers, ...rows].map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nmis-financial-import-history.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isError) return <main className="nmis-page"><ErrorState title={isSecureContractError(error) ? 'Secure import history unavailable' : 'Import history unavailable'} description={isSecureContractError(error) ? 'No import history was loaded because this screen requires the approved secure import-history contract.' : undefined} action={{ label: 'Retry', onClick: () => refetch() }} /></main>;

  return (
    <main className="nmis-page">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Financial Operations"
          title="Import History"
          subtitle="Trace every workbook, validation outcome, duplicate decision, and commit result across the financial data pipeline."
          actions={<Button variant="secondary" onClick={exportHistory} disabled={batches.length === 0} className="gap-2"><Download size={16} /> Export History</Button>}
        />

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard title="Total Batches" value={stats.total} tone="primary" icon={<History size={20} />} />
          <KpiCard title="Imported Rows" value={stats.rows.toLocaleString()} tone="success" icon={<CheckCircle2 size={20} />} />
          <KpiCard title="Duplicate Rows" value={stats.duplicates.toLocaleString()} tone="warning" icon={<AlertCircle size={20} />} />
          <KpiCard title="Validation Errors" value={stats.errors.toLocaleString()} tone="danger" icon={<AlertCircle size={20} />} />
        </section>

        <div className="nmis-table-wrap">
          <div className="flex flex-col gap-4 border-b border-brand-divider bg-brand-surface/70 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <SectionHeader title="Financial Data Batches" subtitle={`${filteredBatches.length} batches matching current view.`} />
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-subtle" />
              <Input placeholder="Search file, batch, type..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="nmis-table min-w-[1000px]">
              <thead>
                <tr>
                  <th>File / Batch</th>
                  <th>Type / Period</th>
                  <th>Uploaded</th>
                  <th>Rows</th>
                  <th>Review Signals</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="py-20 text-center"><LoadingState title="Loading history..." /></td></tr>
                ) : filteredBatches.length === 0 ? (
                  <tr><td colSpan={7} className="py-20 text-center text-brand-muted">No import batches found.</td></tr>
                ) : (
                  filteredBatches.map(batch => (
                    <tr key={batch.id} className="hover:bg-brand-surface/50">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl bg-brand-soft p-2 text-brand-blue"><FileSpreadsheet size={16} /></div>
                          <div>
                            <p className="font-bold text-brand-foreground">{batch.fileName}</p>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">{batch.id}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge variant="info" className="capitalize">{batch.dataType}</Badge>
                        <p className="mt-1 text-[10px] font-bold text-brand-muted uppercase">{batch.periodCovered || 'N/A'}</p>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-brand-secondary"><Calendar size={12} className="text-brand-subtle" />{new Date(batch.uploadedAt).toLocaleDateString()}</div>
                        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-brand-muted uppercase font-bold"><User size={12} />{batch.uploadedBy}</div>
                      </td>
                      <td>
                        <p className="font-bold text-brand-foreground">{batch.importedRows.toLocaleString()} / {batch.totalRows.toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-brand-muted uppercase">Imported / Total</p>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1.5">
                          {batch.warningRows > 0 && <Badge variant="warning">{batch.warningRows} warnings</Badge>}
                          {batch.errorRows > 0 && <Badge variant="error">{batch.errorRows} errors</Badge>}
                          {batch.duplicateRows > 0 && <Badge variant="warning">{batch.duplicateRows} dups</Badge>}
                          {batch.warningRows === 0 && batch.errorRows === 0 && batch.duplicateRows === 0 && <span className="text-[10px] font-bold text-status-success uppercase">Clean Import</span>}
                        </div>
                      </td>
                      <td>
                        <Badge variant={batch.status === 'imported' ? 'success' : ['failed', 'superseded'].includes(batch.status) ? 'error' : 'warning'}>
                          {batch.status}
                        </Badge>
                      </td>
                      <td className="text-right">
                        <Button variant="secondary" size="sm" onClick={() => setSelectedBatchId(batch.id)}>Details</Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selectedBatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-2xl rounded-panel border border-brand-border bg-brand-card shadow-panel overflow-hidden">
              <div className="flex items-start justify-between bg-brand-surface/50 p-6 border-b border-brand-divider">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-blue">Batch Analysis</p>
                  <h2 className="mt-1 text-2xl font-black text-brand-foreground">{selectedBatch.fileName}</h2>
                  <p className="mt-1 font-mono text-[10px] text-brand-muted">{selectedBatch.id}</p>
                </div>
                <button className="rounded-control p-2 text-brand-muted hover:bg-brand-surface hover:text-brand-foreground" onClick={() => setSelectedBatchId(null)}><X size={20} /></button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailItem label="Status" value={selectedBatch.status} isStatus />
                  <DetailItem label="Data Type" value={selectedBatch.dataType} />
                  <DetailItem label="Period Covered" value={selectedBatch.periodCovered || 'Not stated'} />
                  <DetailItem label="Uploaded By" value={selectedBatch.uploadedBy} />
                  <DetailItem label="Rows Processed" value={`${selectedBatch.importedRows} / ${selectedBatch.totalRows}`} />
                  <DetailItem label="Validation Errors" value={String(selectedBatch.errorRows)} isError={selectedBatch.errorRows > 0} />
                  <DetailItem label="Warnings Found" value={String(selectedBatch.warningRows)} isWarning={selectedBatch.warningRows > 0} />
                  <DetailItem label="Duplicates Detected" value={String(selectedBatch.duplicateRows)} isWarning={selectedBatch.duplicateRows > 0} />
                </div>

                {selectedBatch.metadata && (
                  <div className="rounded-control border border-brand-divider bg-brand-surface p-4">
                    <p className="nmis-label">Source Metadata</p>
                    <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-[10px] font-mono text-brand-secondary">{JSON.stringify(selectedBatch.metadata, null, 2)}</pre>
                  </div>
                )}
              </div>

              <div className="bg-brand-surface/50 p-6 border-t border-brand-divider flex justify-end">
                <Button onClick={() => setSelectedBatchId(null)}>Close Analysis</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function DetailItem({ label, value, isStatus, isError, isWarning }: { label: string; value: string; isStatus?: boolean; isError?: boolean; isWarning?: boolean }) {
  return (
    <div className="rounded-control border border-brand-divider bg-brand-surface p-4">
      <p className="nmis-label">{label}</p>
      <div className="mt-1">
        {isStatus ? (
          <Badge variant={value === 'imported' ? 'success' : 'warning'}>{value}</Badge>
        ) : (
          <p className={`font-bold ${isError ? 'text-status-error' : isWarning ? 'text-status-warning' : 'text-brand-foreground'}`}>{value}</p>
        )}
      </div>
    </div>
  );
}
