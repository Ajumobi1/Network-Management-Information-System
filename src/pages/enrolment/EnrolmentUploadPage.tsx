import { useMemo, useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  FileSpreadsheet, 
  Hospital, 
  MapPin, 
  RefreshCcw, 
  Upload,
  FileUp,
  History,
  ListChecks,
  Trash2,
  FileText,
  Clock,
  Loader2
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { financialDataService, isSummaryRow } from '../../services/financial-data/financialDataService';
import { enrolmentService } from '../../services/enrolment/enrolmentService';
import { useCreateEnrolmentImportBatch } from '../../hooks/enrolment';
import { EnrolleeRecord, EnrolmentColumnMapping, EnrolmentField } from '../../types/enrolment/enrolmentTypes';
import { ImportBatch, ProviderMatch } from '../../types/financial-data';
import { useMockData } from '../../repositories/common';

type UploadStep = 'upload' | 'inspect' | 'identify' | 'map' | 'classify' | 'match' | 'preview' | 'commit';
type RawRow = Record<string, unknown>;

interface FileQueueItem {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'ready' | 'review' | 'error' | 'imported';
  period?: string;
  rows: number;
  matched: number;
  review: number;
  errors: number;
  message?: string;
  // Stored processing state for this specific file
  data?: {
    workbook: XLSX.WorkBook;
    sourceSheet: string;
    sheetNames: string[];
    headerRowIndex: number;
    headers: string[];
    rawRows: RawRow[];
    mappings: EnrolmentColumnMapping[];
    reportingYear: string;
    reportingMonth: string;
    matches: ProviderMatch[];
    normalizedRecords: EnrolleeRecord[];
    validationErrors: string[];
    extractedContext: { facilityName?: string; lga?: string; period?: string };
  };
}

const steps: UploadStep[] = ['upload', 'inspect', 'identify', 'map', 'classify', 'match', 'preview', 'commit'];
const stepLabels: Record<UploadStep, string> = {
  upload: 'Upload',
  inspect: 'Inspect',
  identify: 'Period',
  map: 'Map',
  classify: 'Classify',
  match: 'Match',
  preview: 'Preview',
  commit: 'Commit',
};

export default function EnrolmentUploadPage() {
  const [step, setStep] = useState<UploadStep>('upload');
  const [queue, setQueue] = useState<FileQueueItem[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  
  const [errorMessage, setErrorMessage] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { session } = useAuth();
  const createBatch = useCreateEnrolmentImportBatch();
  const workbookRef = useRef<XLSX.WorkBook | null>(null);

  const activeItem = useMemo(() => queue.find(item => item.id === activeFileId), [queue, activeFileId]);
  
  // Helper to update queue item state
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setErrorMessage('');
    setCommitMessage('');
    
    const newItems: FileQueueItem[] = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      status: 'pending',
      rows: 0,
      matched: 0,
      review: 0,
      errors: 0
    }));

    setQueue(prev => [...prev, ...newItems]);
    
    // Auto-process first file if nothing active
    if (!activeFileId) {
      processFile(newItems[0]);
    }
  };

  const processFile = async (item: FileQueueItem) => {
    setActiveFileId(item.id);
    setIsAnalyzing(true);
    try {
      const workbook = XLSX.read(await item.file.arrayBuffer(), { type: 'array', cellDates: true });
      if (workbook.SheetNames.length === 0) throw new Error('The workbook does not contain a readable worksheet.');
      
      workbookRef.current = workbook;
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
      
      // AI Context Extraction
      const context = enrolmentService.extractWorkbookContext(matrix);
      
      // Automatic Period Detection from filename or context
      let detectedYear = '';
      let detectedMonth = '';
      
      const fileName = item.file.name.toLowerCase();
      const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
      const monthIdx = monthNames.findIndex(m => fileName.includes(m));
      if (monthIdx !== -1) detectedMonth = String(monthIdx + 1);
      
      const yearMatch = fileName.match(/202[4-6]/);
      if (yearMatch) detectedYear = yearMatch[0];

      if (context.period) {
        const ctxYearMatch = context.period.match(/202[4-6]/);
        if (ctxYearMatch) detectedYear = ctxYearMatch[0];
        const ctxMonthIdx = monthNames.findIndex(m => context.period?.toLowerCase().includes(m));
        if (ctxMonthIdx !== -1) detectedMonth = String(ctxMonthIdx + 1);
      }

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
          mappings: enrolmentService.suggestEnrolmentMappings(detectedHeaders),
          reportingYear: detectedYear,
          reportingMonth: detectedMonth,
          matches: [],
          normalizedRecords: [],
          validationErrors: [],
          extractedContext: context
        }
      });
      setStep('inspect');
    } catch (error) {
      updateQueueItem(item.id, { status: 'error', message: error instanceof Error ? error.message : 'Inspection failed' });
      setErrorMessage(error instanceof Error ? error.message : 'The workbook could not be inspected.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startMatching = async () => {
    if (!activeItem?.data) return;
    const { rawRows, mappings, extractedContext } = activeItem.data;
    
    setErrorMessage('');
    setIsAnalyzing(true);
    try {
      const providerField = mappings.find(mapping => mapping.enrolmentField === 'providerName')?.excelField;
      const providerCodeField = mappings.find(mapping => mapping.enrolmentField === 'providerCode')?.excelField;
      const lgaField = mappings.find(mapping => mapping.enrolmentField === 'lga')?.excelField;
      const stateField = mappings.find(mapping => mapping.enrolmentField === 'state')?.excelField;

      let results: ProviderMatch[] = [];

      if (providerField) {
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
        results = await Promise.all([...uniqueProviders.values()].map(provider => financialDataService.matchProvider(provider.name, provider.code, provider.lga, provider.state)));
      } else if (extractedContext.facilityName) {
        const match = await financialDataService.matchProvider(extractedContext.facilityName, undefined, extractedContext.lga, 'Ondo');
        results = [match];
      } else {
        throw new Error('Could not detect a facility/provider name.');
      }

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
    const { rawRows, mappings, matches, reportingYear, reportingMonth, extractedContext } = activeItem.data;
    
    const period = `${reportingYear}-${reportingMonth.padStart(2, '0')}`;
    const records = enrolmentService.normalizeEnrolmentRows(rawRows, mappings, matches, period, activeItem.id, activeItem.file.name, activeItem.data.sourceSheet);
    const errors = records.flatMap(record => (record.validationErrors || []).map(error => `Source row ${record.sourceRow || '?'}: ${error}`));
    
    updateActiveData({ 
      normalizedRecords: records, 
      validationErrors: [...new Set(errors)] 
    });
    
    const reviewCount = records.filter(r => r.recordStatus === 'match-review-required').length;
    updateQueueItem(activeItem.id, { 
      status: reviewCount > 0 ? 'review' : 'ready',
      review: reviewCount,
      errors: errors.length,
      matched: records.filter(r => r.recordStatus === 'valid').length
    });
    
    setStep('preview');
  };

  const handleCommit = async () => {
    if (!activeItem?.data || activeItem.status !== 'ready') return;
    
    setIsAnalyzing(true);
    try {
      const period = `${activeItem.data.reportingYear}-${activeItem.data.reportingMonth.padStart(2, '0')}`;
      await createBatch.mutateAsync({
        batch: {
          fileName: activeItem.file.name,
          dataType: 'enrolment',
          periodCovered: period,
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
            extractedContext: activeItem.data.extractedContext,
            providerNames: [...new Set(activeItem.data.normalizedRecords.map(r => r.providerName).filter(Boolean))]
          }
        },
        records: activeItem.data.normalizedRecords.filter(r => r.recordStatus === 'valid')
      });
      
      updateQueueItem(activeItem.id, { status: 'imported' });
      setCommitMessage(`Successfully imported ${activeItem.rows} records from ${activeItem.file.name}`);
      
      // Check if there are more files in queue
      const nextPending = queue.find(item => item.id !== activeItem.id && item.status === 'pending');
      if (nextPending) {
        processFile(nextPending);
      } else {
        setStep('commit');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Commit failed');
    } finally {
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
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand-blue">Population &amp; Enrolment</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Historical Bulk Import</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">Upload multiple capitation workbooks. The AI engine automatically detects periods, extracts facility context, and matches against the Provider Master Register.</p>
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
        {/* Sidebar: Queue Management */}
        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Import Queue</h3>
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
                      <p className="mt-0.5 text-[10px] text-slate-500">{item.rows.toLocaleString()} records {item.period ? `· ${item.period}` : ''}</p>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge variant={
                      item.status === 'imported' ? 'success' : 
                      item.status === 'ready' ? 'success' :
                      item.status === 'review' ? 'warning' :
                      item.status === 'error' ? 'error' : 'default'
                    } className="text-[9px] py-0 px-1.5">
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
          </div>
        </aside>

        {/* Main Content Area */}
        <main>
          {isAnalyzing ? (
            <div className="rounded-3xl border border-slate-200 bg-white py-20 text-center shadow-sm">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-blue" />
              <p className="mt-4 text-sm font-semibold text-slate-700">AI Engine is processing {activeItem?.file.name}...</p>
              <p className="mt-1 text-xs text-slate-400 italic">Matching against 80 authoritative providers & aliases</p>
            </div>
          ) : (
            <>
              {step === 'upload' && (
                <section className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-16 text-center shadow-sm">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-brand-blue">
                    <FileUp className="h-7 w-7" />
                  </div>
                  <h2 className="mt-5 text-xl font-bold text-slate-900">Select Historical Capitation Files</h2>
                  <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">Drag and drop files or folders here. The system supports bulk processing of monthly enrollee workbooks from January 2025 onwards.</p>
                  <label className="mt-7 inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-brand-blue px-5 py-3 text-sm font-semibold text-white hover:bg-brand-navy shadow-lg shadow-brand-blue/20 transition-all active:scale-95">
                    <Upload className="h-4 w-4" /> Choose Files / Folders
                    <input className="hidden" type="file" multiple accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
                  </label>
                </section>
              )}

              {step === 'inspect' && activeItem?.data && (
                <Panel title="Inspect workbook structure" description="Confirm the worksheet and column headers. The AI has detected the core table structure.">
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-4">
                      <div className="flex-1 min-w-[200px]">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Worksheet</label>
                        <select 
                          className="mt-2 w-full rounded-xl border-slate-200 text-sm"
                          value={activeItem.data.sourceSheet}
                          onChange={e => processFile({ ...activeItem, data: { ...activeItem.data!, sourceSheet: e.target.value } } as any)}
                        >
                          {activeItem.data.sheetNames.map(name => <option key={name} value={name}>{name}</option>)}
                        </select>
                      </div>
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
                  <Actions onBack={reset} onNext={() => setStep('identify')} />
                </Panel>
              )}

              {step === 'identify' && activeItem?.data && (
                <Panel title="Reporting Period" description="The AI has attempted to detect the period from the filename and workbook headers.">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reporting Year</label>
                      <input 
                        className="mt-2 w-full rounded-xl border-slate-200 font-semibold"
                        value={activeItem.data.reportingYear}
                        onChange={e => updateActiveData({ reportingYear: e.target.value })}
                        placeholder="e.g. 2025"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reporting Month</label>
                      <select 
                        className="mt-2 w-full rounded-xl border-slate-200 font-semibold"
                        value={activeItem.data.reportingMonth}
                        onChange={e => updateActiveData({ reportingMonth: e.target.value })}
                      >
                        <option value="">Select Month</option>
                        {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                          <option key={m} value={String(i + 1)}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center gap-3 rounded-2xl bg-amber-50 p-4 text-xs text-amber-800 border border-amber-100">
                    <Clock className="h-4 w-4 shrink-0" />
                    <p>Historical imports must be mapped to the correct month to ensure accurate capitation and FFS comparative analytics.</p>
                  </div>
                  <Actions onBack={() => setStep('inspect')} onNext={() => setStep('map')} />
                </Panel>
              )}

              {step === 'map' && activeItem?.data && (
                <Panel title="AI Column Mapping" description="The ingestion engine has automatically mapped your source columns to the NMIS schema.">
                  {activeItem.data.extractedContext.facilityName && (
                    <div className="mb-6 flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
                      <Hospital className="h-5 w-5" />
                      <div>
                        <p className="font-bold">AI Detected Facility Context</p>
                        <p className="text-xs">Workbook header: <strong>{activeItem.data.extractedContext.facilityName}</strong> {activeItem.data.extractedContext.lga ? `(${activeItem.data.extractedContext.lga} LGA)` : ''}</p>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    {activeItem.data.mappings.map((mapping, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 hover:bg-slate-50 transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Source Column</p>
                          <p className="text-sm font-semibold text-slate-800 truncate">{mapping.excelField}</p>
                        </div>
                        <ArrowRight className="mx-4 h-4 w-4 text-slate-300" />
                        <div className="w-1/2">
                          <select 
                            className="w-full rounded-lg border-slate-200 text-sm py-1.5"
                            value={mapping.enrolmentField}
                            onChange={e => {
                              const newMappings = [...activeItem.data!.mappings];
                              newMappings[idx] = { ...mapping, enrolmentField: e.target.value as any, confidence: 'HIGH', confidenceScore: 1 };
                              updateActiveData({ mappings: newMappings });
                            }}
                          >
                            <option value="ignored">Ignore Column</option>
                            <option value="policyNumber">Policy Number</option>
                            <option value="firstName">First Name</option>
                            <option value="lastName">Last Name</option>
                            <option value="category">Category (Principal/Dependant)</option>
                            <option value="gender">Gender</option>
                            <option value="age">Age</option>
                            <option value="phoneNumber">Phone Number</option>
                            <option value="providerName">Facility Name</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Actions onBack={() => setStep('identify')} onNext={() => setStep('classify')} />
                </Panel>
              )}

              {step === 'classify' && activeItem?.data && (
                <Panel title="Classification Rules" description="NMIS preserves source CATEGORY values while deriving SECTOR from policy identifiers.">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-100 p-5 bg-slate-50/50">
                      <p className="text-[10px] font-bold text-brand-blue uppercase tracking-widest">CATEGORY RULE</p>
                      <p className="mt-2 text-sm text-slate-600 leading-relaxed">Values are imported exactly as stated in the workbook (PRINCIPAL or DEPENDANT). No reconstruction is performed.</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 p-5 bg-slate-50/50">
                      <p className="text-[10px] font-bold text-brand-blue uppercase tracking-widest">SECTOR RULE</p>
                      <p className="mt-2 text-sm text-slate-600 leading-relaxed">Derived from policy numbers: <strong>/C/</strong> for Formal and <strong>/D/</strong> for Informal. Invalid formats are flagged for review.</p>
                    </div>
                  </div>
                  <div className="mt-8 flex items-center gap-4 p-4 rounded-2xl border border-blue-100 bg-blue-50/50">
                    <FileText className="h-6 w-6 text-brand-blue" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">{activeItem.rows.toLocaleString()} records will be classified.</p>
                      <p className="text-xs text-slate-500">Period: {activeItem.data.reportingYear}-{activeItem.data.reportingMonth.padStart(2, '0')}</p>
                    </div>
                  </div>
                  <Actions onBack={() => setStep('map')} onNext={startMatching} nextLabel="Match Facilities" />
                </Panel>
              )}

              {step === 'match' && activeItem?.data && (
                <Panel title="Provider Matching" description="Matching source names against 80 authoritative providers and their approved aliases.">
                  <div className="space-y-3">
                    {activeItem.data.matches.map((match, idx) => (
                      <div key={idx} className="rounded-2xl border border-slate-100 p-4 hover:shadow-md transition-all bg-white">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex items-start gap-3">
                            <div className="mt-1 rounded-lg bg-slate-50 p-2">
                              <MapPin className="h-4 w-4 text-slate-400" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Workbook Name</p>
                              <p className="text-sm font-bold text-slate-900">{match.excelName}</p>
                              <div className="mt-1 flex items-center gap-2">
                                <Badge variant={match.status === 'confirmed' ? 'success' : 'warning'} className="text-[10px]">
                                  {match.status === 'confirmed' ? '✓ CONFIRMED' : '⚠ MANUAL REVIEW'}
                                </Badge>
                                {match.confidence > 0 && (
                                  <span className="text-[10px] font-mono text-slate-400">{Math.round(match.confidence * 100)}% Confidence</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex-1 lg:max-w-md">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Authoritative Master</p>
                            <div className="mt-1 flex items-center gap-2">
                              <p className="text-sm font-semibold text-slate-700">{match.matchedProviderName || 'No match found'}</p>
                              {match.matchedProviderCode && <Badge variant="default" className="text-[9px]">{match.matchedProviderCode}</Badge>}
                            </div>
                          </div>
                        </div>
                        
                        {match.status !== 'confirmed' && match.candidates && (
                          <div className="mt-4 border-t border-slate-50 pt-4">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Authoritative Provider to resolve & learn alias</label>
                            <select 
                              className="mt-2 w-full rounded-xl border-slate-200 text-sm"
                              onChange={async (e) => {
                                const candidate = match.candidates?.find(c => c.id === e.target.value);
                                if (!candidate) return;
                                
                                // Resolve and trigger learning mechanism
                                await financialDataService.resolveMatch(match, session?.user?.email, activeItem.id, candidate.id, match.excelName);
                                
                                const newMatches = [...activeItem.data!.matches];
                                newMatches[idx] = {
                                  ...match,
                                  matchedProviderId: candidate.id,
                                  matchedProviderName: candidate.name,
                                  matchedProviderCode: candidate.code,
                                  status: 'confirmed',
                                  confidence: 1,
                                  matchType: 'manual'
                                };
                                updateActiveData({ matches: newMatches });
                              }}
                            >
                              <option value="">Search directory...</option>
                              {match.candidates.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code}) - {c.lga}</option>)}
                            </select>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <Actions onBack={() => setStep('classify')} onNext={generatePreview} nextLabel="Generate Preview" />
                </Panel>
              )}

              {step === 'preview' && activeItem?.data && (
                <Panel title="Validation & Preview" description="Paginated preview of normalized records. All records must be matched before commit.">
                  <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-6">
                    <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TOTAL ROWS</p>
                      <p className="mt-1 text-xl font-bold text-slate-900">{activeItem.rows.toLocaleString()}</p>
                    </div>
                    <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-100">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">READY</p>
                      <p className="mt-1 text-xl font-bold text-emerald-700">{activeItem.matched.toLocaleString()}</p>
                    </div>
                    <div className="rounded-2xl bg-amber-50 p-4 border border-amber-100">
                      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">REVIEW</p>
                      <p className="mt-1 text-xl font-bold text-amber-700">{activeItem.review.toLocaleString()}</p>
                    </div>
                    <div className="rounded-2xl bg-rose-50 p-4 border border-rose-100">
                      <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">ERRORS</p>
                      <p className="mt-1 text-xl font-bold text-rose-700">{activeItem.errors.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3">Policy Number</th>
                          <th className="px-4 py-3">Beneficiary</th>
                          <th className="px-4 py-3">Age</th>
                          <th className="px-4 py-3">Category</th>
                          <th className="px-4 py-3">Matched Provider</th>
                          <th className="px-4 py-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {activeItem.data.normalizedRecords.slice(0, 10).map(record => (
                          <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs text-slate-500">{record.policyNumber}</td>
                            <td className="px-4 py-3 font-bold text-slate-800">{record.firstName} {record.lastName}</td>
                            <td className="px-4 py-3 text-slate-500">{record.age || '-'}</td>
                            <td className="px-4 py-3 capitalize text-slate-500">{record.category}</td>
                            <td className="px-4 py-3">
                              <p className="text-xs font-semibold text-slate-700">{record.providerName}</p>
                              <p className="text-[9px] text-slate-400 font-mono">{record.providerId?.substring(0, 8)}...</p>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Badge variant={record.recordStatus === 'valid' ? 'success' : 'error'} className="text-[9px]">
                                {record.recordStatus === 'valid' ? 'READY' : 'REVIEW'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 p-4 rounded-2xl bg-slate-50 text-[10px] text-slate-400 text-center uppercase tracking-widest font-bold">
                    Showing first 10 of {activeItem.rows.toLocaleString()} records
                  </div>
                  <Actions onBack={() => setStep('match')} onNext={handleCommit} nextLabel="Commit Batch" disabled={activeItem.status !== 'ready'} />
                </Panel>
              )}

              {step === 'commit' && (
                <Panel title="Bulk Import Complete" description="The historical records have been successfully normalized and persisted.">
                  <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-10 text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm">
                      <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                    </div>
                    <h3 className="mt-6 text-xl font-bold text-slate-900">All Files Processed Successfully</h3>
                    <p className="mt-2 text-slate-600">{commitMessage}</p>
                    <div className="mt-10 flex flex-wrap justify-center gap-4">
                      <Button onClick={reset} size="lg" className="rounded-2xl px-8 shadow-lg shadow-brand-blue/20">
                        <RefreshCcw className="mr-2 h-4 w-4" /> Start New Import
                      </Button>
                      <Button variant="secondary" size="lg" className="rounded-2xl px-8" onClick={() => window.location.href = '/population/enrolment'}>
                        <ListChecks className="mr-2 h-4 w-4" /> View Register
                      </Button>
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
