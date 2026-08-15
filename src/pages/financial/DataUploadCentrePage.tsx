import { useMemo, useRef, useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  MapPin,
  RefreshCcw,
  Upload,
  FileUp,
  History,
  ListChecks,
  Trash2,
  FileText,
  Clock,
  Loader2,
  Coins
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { financialDataService, isSummaryRow } from '../../services/financial-data/financialDataService';
import { FinancialDataType, ColumnMapping, FinancialRecord, ProviderMatch } from '../../types/financial-data';
import { useCheckDuplicateBatch, useCreateImportBatch } from '../../hooks/financial-data/financialDataHooks';
import { useMockData } from '../../repositories/common';
import { collectFilesFromDrop, filterSupportedUploadFiles } from '../../utils/uploadFiles';

type UploadStep = 'upload' | 'inspect' | 'map' | 'match' | 'preview' | 'commit';
type RawRow = Record<string, unknown>;

interface FileQueueItem {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'ready' | 'review' | 'error' | 'imported';
  dataType: FinancialDataType;
  period?: string;
  rows: number;
  matched: number;
  review: number;
  errors: number;
  duplicates?: number;
  message?: string;
  data?: {
    workbook: XLSX.WorkBook;
    sourceSheet: string;
    sheetNames: string[];
    headerRowIndex: number;
    headers: string[];
    rawRows: RawRow[];
    mappings: ColumnMapping[];
    matches: ProviderMatch[];
    normalizedRecords: FinancialRecord[];
    validationErrors: string[];
  };
}

const steps: UploadStep[] = ['upload', 'inspect', 'map', 'match', 'preview', 'commit'];
const stepLabels: Record<UploadStep, string> = {
  upload: 'Upload',
  inspect: 'Inspect',
  map: 'Map',
  match: 'Match',
  preview: 'Preview',
  commit: 'Commit',
};

const mappingOptions = [
  { value: 'ignored', label: 'Ignore this column' },
  { value: 'providerCode', label: 'Provider code' },
  { value: 'providerName', label: 'Provider / facility name' },
  { value: 'facilityType', label: 'Facility type' },
  { value: 'ownership', label: 'Ownership' },
  { value: 'state', label: 'State' },
  { value: 'lga', label: 'LGA' },
  { value: 'reportingMonth', label: 'Reporting month' },
  { value: 'reportingYear', label: 'Reporting year' },
  { value: 'claimsCategory', label: 'Claims category' },
  { value: 'claimsType', label: 'Claims type' },
  { value: 'claimCount', label: 'Claim count' },
  { value: 'amountSubmitted', label: 'Amount submitted' },
  { value: 'amountClaimed', label: 'Amount claimed' },
  { value: 'amountApproved', label: 'Amount approved' },
  { value: 'amountRejected', label: 'Amount rejected' },
  { value: 'amountPaid', label: 'Amount paid' },
  { value: 'netAmountPaid', label: 'Net amount paid' },
  { value: 'amount', label: 'Generic amount' },
  { value: 'subcategory', label: 'Subcategory' },
  { value: 'address', label: 'Address' },
];

export default function DataUploadCentrePage() {
  const [searchParams] = useSearchParams();
  const initialType = (searchParams.get('type') as FinancialDataType) || 'claims';
  
  const [step, setStep] = useState<UploadStep>('upload');
  const [queue, setQueue] = useState<FileQueueItem[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [dataType, setDataType] = useState<FinancialDataType>(initialType);
  
  const [errorMessage, setErrorMessage] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { session } = useAuth();
  const createBatch = useCreateImportBatch();
  const workbookRef = useRef<XLSX.WorkBook | null>(null);

  const activeItem = useMemo(() => queue.find(item => item.id === activeFileId), [queue, activeFileId]);

  const updateQueueItem = (id: string, updates: Partial<FileQueueItem>) => {
    setQueue(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const updateActiveData = (updates: Partial<NonNullable<FileQueueItem['data']>>) => {
    if (!activeFileId) return;
    setQueue(prev => prev.map(item => item.id === activeFileId ? { 
      ...item, 
      data: item.data ? { ...item.data, ...updates } : undefined 
    } : item));
  };

  const reset = () => {
    setStep('upload');
    setQueue([]);
    setActiveFileId(null);
    setErrorMessage('');
    setCommitMessage('');
    workbookRef.current = null;
  };

  const handleSelectedFiles = async (files: File[]) => {
    const supportedFiles = filterSupportedUploadFiles(files);
    if (supportedFiles.length === 0) {
      setErrorMessage('No supported workbook files were found. Select XLSX, XLS, or CSV files.');
      return;
    }

    setErrorMessage('');
    setCommitMessage('');

    const newItems: FileQueueItem[] = supportedFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      status: 'pending',
      dataType,
      rows: 0,
      matched: 0,
      review: 0,
      errors: 0
    }));

    setQueue(prev => [...prev, ...newItems]);
    if (!activeFileId) processFile(newItems[0]);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    await handleSelectedFiles(filterSupportedUploadFiles(Array.from(event.target.files || [])));
    event.target.value = '';
  };

  const handleDrop = async (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    await handleSelectedFiles(await collectFilesFromDrop(event.dataTransfer));
  };

  const processFile = async (item: FileQueueItem) => {
    setActiveFileId(item.id);
    setIsAnalyzing(true);
    try {
      const workbook = XLSX.read(await item.file.arrayBuffer(), { type: 'array', cellDates: true });
      if (workbook.SheetNames.length === 0) throw new Error('The workbook is empty.');
      
      workbookRef.current = workbook;
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
      
      const hIndex = 0;
      const detectedHeaders = (matrix[hIndex] || []).map(value => String(value).trim()).filter(Boolean);
      const rows = XLSX.utils.sheet_to_json<RawRow>(sheet, { range: hIndex, defval: '', raw: false })
        .filter(row => Object.values(row).some(value => String(value).trim() !== ''));

      updateQueueItem(item.id, {
        status: 'processing',
        rows: rows.length,
        data: {
          workbook,
          sourceSheet: sheetName,
          sheetNames: workbook.SheetNames,
          headerRowIndex: hIndex,
          headers: detectedHeaders,
          rawRows: rows,
          mappings: financialDataService.suggestMappings(detectedHeaders, item.dataType),
          matches: [],
          normalizedRecords: [],
          validationErrors: []
        }
      });
      setStep('inspect');
    } catch (error) {
      updateQueueItem(item.id, { status: 'error', message: error instanceof Error ? error.message : 'Inspection failed' });
      setErrorMessage(error instanceof Error ? error.message : 'Inspection failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startMatching = async () => {
    if (!activeItem?.data) return;
    const { rawRows, mappings } = activeItem.data;
    
    setErrorMessage('');
    setIsAnalyzing(true);
    try {
      const providerField = mappings.find(m => m.nmisField === 'providerName')?.excelField;
      const providerCodeField = mappings.find(m => m.nmisField === 'providerCode')?.excelField;
      const lgaField = mappings.find(m => m.nmisField === 'lga')?.excelField;
      const stateField = mappings.find(m => m.nmisField === 'state')?.excelField;

      if (!providerField) throw new Error('Facility name column is required.');

      const uniqueProviders = new Map<string, { name: string; code?: string; lga?: string; state?: string }>();
      rawRows.forEach(row => {
        const name = String(row[providerField] ?? '').trim();
        if (!name || isSummaryRow(name)) return;
        const key = `${name.toLowerCase()}|${String(row[providerCodeField || ''] ?? '').trim().toLowerCase()}`;
        uniqueProviders.set(key, {
          name,
          code: providerCodeField ? String(row[providerCodeField] ?? '').trim() || undefined : undefined,
          lga: lgaField ? String(row[lgaField] ?? '').trim() || undefined : undefined,
          state: stateField ? String(row[stateField] ?? '').trim() || undefined : undefined,
        });
      });

      const results = await Promise.all([...uniqueProviders.values()].map(p => financialDataService.matchProvider(p.name, p.code, p.lga, p.state)));
      updateActiveData({ matches: results });
      setStep('match');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Matching failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generatePreview = () => {
    if (!activeItem?.data) return;
    const { rawRows, mappings, matches } = activeItem.data;
    
    const records = financialDataService.normalizeData(rawRows, mappings, activeItem.dataType, activeItem.id, activeItem.file.name, activeItem.data.sourceSheet);
    const errors = records.flatMap(r => (r.validationErrors || []).map(e => `Row ${r.sourceRow}: ${e}`));
    
    updateActiveData({ normalizedRecords: records, validationErrors: [...new Set(errors)] });
    
    const reviewCount = records.filter(r => !r.providerId).length;
    const errorCount = records.filter(r => (r.validationErrors?.length || 0) > 0).length;
    const readyCount = records.filter(r => r.providerId && (!r.validationErrors || r.validationErrors.length === 0)).length;

    updateQueueItem(activeItem.id, { 
      status: (reviewCount > 0) ? 'review' : (errorCount > 0 ? 'error' : 'ready'),
      review: reviewCount,
      errors: errorCount,
      matched: readyCount,
      duplicates: 0,
      period: records[0]?.period,
      rows: records.length
    });
    
    setStep('preview');
  };

  const handleCommit = async () => {
    if (!activeItem?.data || activeItem.status !== 'ready') return;
    
    setIsAnalyzing(true);
    try {
      await createBatch.mutateAsync({
        batch: {
          fileName: activeItem.file.name,
          dataType: activeItem.dataType,
          periodCovered: activeItem.period || null,
          totalRows: activeItem.rows,
          status: 'imported',
          uploadedBy: session?.user?.email || 'System',
          importedRows: activeItem.matched,
          warningRows: 0,
          errorRows: activeItem.errors,
          duplicateRows: 0,
          unmatchedProviders: activeItem.review,
          metadata: {
            sourceSheet: activeItem.data.sourceSheet,
            providerNames: [...new Set(activeItem.data.normalizedRecords.map(r => r.providerName).filter(Boolean))]
          }
        },
        records: activeItem.data.normalizedRecords
      });
      
      updateQueueItem(activeItem.id, { status: 'imported' });
      setCommitMessage(`Successfully imported ${activeItem.rows} records from ${activeItem.file.name}`);
      
      const nextPending = queue.find(item => item.id !== activeItem.id && item.status === 'pending');
      if (nextPending) {
        await processFile(nextPending);
      } else {
        setStep('commit');
        setIsAnalyzing(false);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Commit failed');
      setIsAnalyzing(false);
    }
  };

  const removeItem = (id: string) => {
    setQueue(prev => prev.filter(item => item.id !== id));
    if (activeFileId === id) {
      setActiveFileId(null);
      setStep('upload');
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand-blue">Network Financial Data</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Data Upload Centre</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">Secure historical bulk ingestion for Claims, Capitation, and FFS workbooks.</p>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto rounded-2xl bg-slate-100 p-1">
          {steps.map((item, index) => (
            <div key={item} className={`flex items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold ${step === item ? 'bg-brand-blue text-white' : 'text-slate-500'}`}>
              <span>{index + 1}</span>
              <span className="hidden xl:inline">{stepLabels[item]}</span>
            </div>
          ))}
        </div>
      </header>

      {errorMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Batch Queue</h3>
              <Badge variant="default">{queue.length}</Badge>
            </div>
            
            <div className="mt-4 space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {queue.length === 0 ? (
                <div className="py-10 text-center">
                  <Clock className="mx-auto h-8 w-8 text-slate-200" />
                  <p className="mt-2 text-xs text-slate-400">Queue is empty</p>
                </div>
              ) : queue.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => item.status !== 'pending' && processFile(item)}
                  className={`group relative cursor-pointer rounded-2xl border p-3 transition-all ${activeFileId === item.id ? 'border-brand-blue bg-blue-50/50' : 'border-slate-100 hover:border-slate-200 bg-white'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-slate-900">{item.file.name}</p>
                      <p className="mt-0.5 text-[10px] text-slate-500">{item.rows.toLocaleString()} records · {item.dataType.toUpperCase()}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); removeItem(item.id); }} className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge variant={item.status === 'imported' ? 'success' : item.status === 'ready' ? 'success' : item.status === 'review' ? 'warning' : item.status === 'error' ? 'error' : 'default'} className="text-[9px] py-0 px-1.5">
                      {item.status}
                    </Badge>
                    {item.status === 'processing' && <Loader2 className="h-3 w-3 animate-spin text-brand-blue" />}
                  </div>
                </div>
              ))}
            </div>

            <label className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 py-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              <Upload className="h-3.5 w-3.5" /> Add more files
              <input className="hidden" type="file" multiple accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
            </label>
            <label className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 py-3 text-xs font-semibold text-brand-blue hover:bg-blue-50 transition-colors">
              <Upload className="h-3.5 w-3.5" /> Add folder
              <input className="hidden" type="file" multiple accept=".xlsx,.xls,.csv" onChange={handleFileUpload} {...({ directory: true, webkitdirectory: true } as any)} />
            </label>
          </div>
        </aside>

        <main>
          {isAnalyzing ? (
            <div className="rounded-3xl border border-slate-200 bg-white py-20 text-center shadow-sm">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-blue" />
              <p className="mt-4 text-sm font-semibold text-slate-700">AI Engine is processing {activeItem?.file.name}...</p>
            </div>
          ) : (
            <>
              {step === 'upload' && (
                <section onDragOver={event => event.preventDefault()} onDrop={handleDrop} className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-16 text-center shadow-sm">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-brand-blue">
                    <Coins className="h-7 w-7" />
                  </div>
                  <h2 className="mt-5 text-xl font-bold text-slate-900">Upload Financial Workbooks</h2>
                  <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">Select the data type below, then drop multiple folders or choose a folder of processed workbooks.</p>
                  
                  <div className="mt-6 flex justify-center gap-2">
                    {['claims', 'capitation', 'ffs'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setDataType(type as any)}
                        className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${dataType === type ? 'bg-brand-blue text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  <label className="mt-8 inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-brand-blue px-5 py-3 text-sm font-semibold text-white hover:bg-brand-navy shadow-lg shadow-brand-blue/20 transition-all active:scale-95">
                    <Upload className="h-4 w-4" /> Choose Files / Folder
                    <input className="hidden" type="file" multiple accept=".xlsx,.xls,.csv" onChange={handleFileUpload} {...({ directory: true, webkitdirectory: true } as any)} />
                  </label>
                </section>
              )}

              {step === 'inspect' && activeItem?.data && (
                <Panel title="Inspect workbook" description="Confirm the worksheet and core table structure.">
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Worksheet</label>
                      <select className="mt-2 w-full rounded-xl border-slate-200 text-sm" value={activeItem.data.sourceSheet} onChange={e => processFile({ ...activeItem, data: { ...activeItem.data!, sourceSheet: e.target.value } } as any)}>
                        {activeItem.data.sheetNames.map(name => <option key={name} value={name}>{name}</option>)}
                      </select>
                    </div>
                    <div className="rounded-2xl border border-slate-100 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-400">
                          <tr>
                            <th className="px-4 py-2">Row</th>
                            {activeItem.data.headers.slice(0, 5).map((h, i) => <th key={i} className="px-4 py-2">{h}</th>)}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {activeItem.data.rawRows.slice(0, 5).map((row, i) => (
                            <tr key={i}>
                              <td className="px-4 py-2 font-mono text-slate-300">{i + 1}</td>
                              {activeItem.data!.headers.slice(0, 5).map((h, j) => <td key={j} className="px-4 py-2 truncate max-w-[150px]">{String(row[h] || '')}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <Actions onBack={reset} onNext={() => setStep('map')} />
                </Panel>
              )}

              {step === 'map' && activeItem?.data && (
                <Panel title="Column Mapping" description="Map workbook columns to NMIS financial fields.">
                  <div className="space-y-2">
                    {activeItem.data.mappings.map((mapping, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 hover:bg-slate-50 transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Workbook Column</p>
                          <p className="text-sm font-semibold text-slate-800 truncate">{mapping.excelField}</p>
                        </div>
                        <ArrowRight className="mx-4 h-4 w-4 text-slate-300" />
                        <div className="w-1/2">
                          <select 
                            className="w-full rounded-lg border-slate-200 text-sm py-1.5"
                            value={mapping.nmisField}
                            onChange={e => {
                              const newMappings = [...activeItem.data!.mappings];
                              newMappings[idx] = { ...mapping, nmisField: e.target.value as any, confidence: 'HIGH', confidenceScore: 1, isCustom: true };
                              updateActiveData({ mappings: newMappings });
                            }}
                          >
                            {mappingOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Actions onBack={() => setStep('inspect')} onNext={startMatching} nextLabel="Match Facilities" />
                </Panel>
              )}

              {step === 'match' && activeItem?.data && (
                <Panel title="Facility Matching" description="Linking source records to the authoritative Provider Directory.">
                  <div className="space-y-3">
                    {activeItem.data.matches.map((match, idx) => (
                      <div key={idx} className="rounded-2xl border border-slate-100 p-4 bg-white">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex items-start gap-3">
                            <div className="mt-1 rounded-lg bg-slate-50 p-2"><MapPin className="h-4 w-4 text-slate-400" /></div>
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase">Source Name</p>
                              <p className="text-sm font-bold text-slate-900">{match.excelName}</p>
                              <Badge variant={match.status === 'confirmed' ? 'success' : 'warning'} className="mt-1 text-[10px]">{match.status === 'confirmed' ? '✓ MATCHED' : '⚠ REVIEW'}</Badge>
                            </div>
                          </div>
                          <div className="flex-1 lg:max-w-md">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Matched Master</p>
                            <p className="text-sm font-semibold text-slate-700">{match.matchedProviderName || 'No match'}</p>
                          </div>
                        </div>
                        {match.status !== 'confirmed' && match.candidates && (
                          <select className="mt-4 w-full rounded-xl border-slate-200 text-sm" onChange={async (e) => {
                            const c = match.candidates?.find(c => c.id === e.target.value);
                            if (!c) return;
                            await financialDataService.resolveMatch(match, session?.user?.email, activeItem.id, c.id, match.excelName);
                            const newMatches = [...activeItem.data!.matches];
                            newMatches[idx] = { ...match, matchedProviderId: c.id, matchedProviderName: c.name, matchedProviderCode: c.code, status: 'confirmed', confidence: 1 };
                            updateActiveData({ matches: newMatches });
                          }}>
                            <option value="">Resolve to...</option>
                            {match.candidates.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                          </select>
                        )}
                      </div>
                    ))}
                  </div>
                  <Actions onBack={() => setStep('map')} onNext={generatePreview} nextLabel="Generate Preview" />
                </Panel>
              )}

              {step === 'preview' && activeItem?.data && (
                <Panel title="Validation Preview" description="Summary of normalized financial records before commit.">
                  <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-6">
                    <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">TOTAL ROWS</p>
                      <p className="mt-1 text-xl font-bold text-slate-900">{activeItem.rows.toLocaleString()}</p>
                    </div>
                    <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-100">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase">READY</p>
                      <p className="mt-1 text-xl font-bold text-emerald-700">{activeItem.matched.toLocaleString()}</p>
                    </div>
                    <div className="rounded-2xl bg-amber-50 p-4 border border-amber-100">
                      <p className="text-[10px] font-bold text-amber-600 uppercase">REVIEW</p>
                      <p className="mt-1 text-xl font-bold text-amber-700">{activeItem.review.toLocaleString()}</p>
                    </div>
                    <div className="rounded-2xl bg-rose-50 p-4 border border-rose-100">
                      <p className="text-[10px] font-bold text-rose-600 uppercase">ERRORS</p>
                      <p className="mt-1 text-xl font-bold text-rose-700">{activeItem.errors.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3">Facility</th>
                          <th className="px-4 py-3">Period</th>
                          <th className="px-4 py-3 text-right">Amount</th>
                          <th className="px-4 py-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {activeItem.data.normalizedRecords.slice(0, 10).map((r, i) => (
                          <tr key={i}>
                            <td className="px-4 py-3 font-semibold text-slate-800">{r.providerName}</td>
                            <td className="px-4 py-3 text-slate-500">{r.period}</td>
                            <td className="px-4 py-3 text-right font-mono">₦{(r.amountPaid || 0).toLocaleString()}</td>
                            <td className="px-4 py-3 text-right"><Badge variant={r.providerId ? 'success' : 'error'} className="text-[9px]">{r.providerId ? 'READY' : 'UNMATCHED'}</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Actions onBack={() => setStep('match')} onNext={handleCommit} nextLabel="Commit Batch" disabled={activeItem.status !== 'ready'} />
                </Panel>
              )}

              {step === 'commit' && (
                <Panel title="Import Complete" description="Financial data has been successfully imported.">
                  <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-10 text-center">
                    <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
                    <h3 className="mt-6 text-xl font-bold text-slate-900">Success</h3>
                    <p className="mt-2 text-slate-600">{commitMessage}</p>
                    <div className="mt-10 flex justify-center gap-4">
                      <Button onClick={reset} className="rounded-2xl px-8">New Import</Button>
                      <Button variant="secondary" className="rounded-2xl px-8" onClick={() => window.location.href = '/financial/overview'}>View Analytics</Button>
                    </div>
                  </div>
                </Panel>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function Panel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm animate-in fade-in zoom-in-95 duration-200">
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      <div className="mt-8">{children}</div>
    </section>
  );
}

function Actions({ onBack, onNext, nextLabel = 'Continue', disabled = false }: { onBack?: () => void; onNext: () => void; nextLabel?: string; disabled?: boolean }) {
  return (
    <div className="mt-10 flex items-center justify-between gap-4 border-t border-slate-50 pt-8">
      <Button variant="secondary" onClick={onBack} disabled={!onBack} className="rounded-2xl px-6 py-3">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      <Button onClick={onNext} disabled={disabled} className="rounded-2xl px-8 py-3 shadow-lg shadow-brand-blue/20">
        {nextLabel} <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
