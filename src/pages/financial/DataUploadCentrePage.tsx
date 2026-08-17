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
  Coins,
  X,
  Search,
  Copy,
  Calendar
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { financialDataService, isSummaryRow, FinancialIntegritySummary } from '../../services/financial-data/financialDataService';
import { FinancialDataType, ColumnMapping, FinancialRecord, ProviderMatch } from '../../types/financial-data';
import { useCreateImportBatch } from '../../hooks/financial-data/financialDataHooks';
import { useMockData } from '../../repositories/common';
import { collectFilesFromDrop, filterSupportedUploadFiles } from '../../utils/uploadFiles';
import { detectPeriodFromWorkbook, DetectedPeriod } from '../../utils/periodDetection';
import { aiIngestionEngine } from '../../services/ingestion/aiIngestionEngine';

type UploadStep = 'upload' | 'inspect' | 'identify' | 'map' | 'classify' | 'match' | 'preview' | 'commit';
type UploadWorkflow = 'claims-ffs' | 'capitation';
type RowTypeSelection = 'auto' | 'capitation' | 'claims-ffs';
type RawRow = Record<string, unknown>;
const AUTO_SHEET_VALUE = '__AUTO__';

interface FileQueueItem {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'ready' | 'review' | 'error' | 'imported';
  dataType: FinancialDataType;
  workflow: UploadWorkflow;
  period?: string;
  rows: number;
  matched: number;
  review: number;
  errors: number;
  duplicates?: number;
  importedRows?: number;
  message?: string;
  data?: {
    workbook: XLSX.WorkBook;
    sourceSheet: string;
    sheetNames: string[];
    headerRowIndex: number;
    autonomousMode?: boolean;
    blockCount?: number;
    autonomousPeriodDetection?: boolean;
    detectedPeriods?: string[];
    autonomousBlocks?: Array<{
      sheetName: string;
      blockIndex: number;
      providerName?: string;
      facilityType?: string;
      detectedPeriods: string[];
      rowCount: number;
    }>;
    headers: string[];
    rawRows: RawRow[];
    mappings: ColumnMapping[];
    matches: ProviderMatch[];
    normalizedRecords: FinancialRecord[];
    validationErrors: string[];
    reportingYear?: string;
    reportingMonth?: string;
    periodDetection: DetectedPeriod;
    horizontalSchedule: boolean;
    extractedContext: { facilityName?: string; lga?: string; period?: string };
    rowTypeSelection: RowTypeSelection;
    aiIntegrity?: FinancialIntegritySummary;
  };
}

const steps: UploadStep[] = ['upload', 'inspect', 'identify', 'map', 'classify', 'match', 'preview', 'commit'];
const normalizeProviderKey = (value: unknown) => String(value ?? '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
const isMonthColumn = (value: string) => ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'january', 'february', 'march', 'april', 'june', 'july', 'august', 'september', 'october', 'november', 'december'].includes(value.trim().toLowerCase());
const amountMappingFields = new Set(['amount', 'amountSubmitted', 'amountClaimed', 'amountApproved', 'amountRejected', 'amountPaid', 'netAmountPaid', 'netAmount', 'grossAmount']);
const amountForPreview = (record: FinancialRecord) => record.netAmountPaid ?? record.amountPaid ?? record.amountApproved ?? record.amountClaimed ?? record.amountSubmitted ?? record.amount ?? 0;
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

const months = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
  { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
  { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' },
];

const mappingOptions = [
  { value: 'ignored', label: 'Ignore this column' },
  { value: 'providerCode', label: 'Provider code' },
  { value: 'providerName', label: 'Provider / facility name' },
  { value: 'dataType', label: 'Financial row type' },
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
  const initialWorkflow: UploadWorkflow = searchParams.get('type') === 'capitation' ? 'capitation' : 'claims-ffs';

  const [step, setStep] = useState<UploadStep>('upload');
  const [queue, setQueue] = useState<FileQueueItem[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [uploadWorkflow, setUploadWorkflow] = useState<UploadWorkflow>(initialWorkflow);
  const [dataType, setDataType] = useState<FinancialDataType>(initialWorkflow === 'capitation' ? 'capitation' : 'claims');

  const [errorMessage, setErrorMessage] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [matchSearch, setMatchSearch] = useState<Record<string, string>>({});
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorSearch, setErrorSearch] = useState('');
  const [errorTypeFilter, setErrorTypeFilter] = useState<string>('all');
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
      workflow: uploadWorkflow,
      rows: 0,
      matched: 0,
      review: 0,
      errors: 0
    }));

    setQueue(prev => [...prev, ...newItems]);

    // Pre-inspect files for row counts
    for (const item of newItems) {
      try {
        const wb = XLSX.read(await item.file.arrayBuffer(), { type: 'array', cellDates: true });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
        const hIdx = financialDataService.detectHeaderRowIndex(matrix);
        const rows = XLSX.utils.sheet_to_json<RawRow>(sheet, { range: hIdx, defval: '', raw: false })
          .filter(r => Object.values(r).some(v => String(v).trim() !== ''));
        updateQueueItem(item.id, { rows: rows.length });
      } catch (e) {
        // Silently skip pre-inspection failures
      }
    }

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

  const processFile = async (item: FileQueueItem, requestedSheet?: string) => {
    setActiveFileId(item.id);
    setIsAnalyzing(true);
    try {
      const workbook = XLSX.read(await item.file.arrayBuffer(), { type: 'array', cellDates: true });
      if (workbook.SheetNames.length === 0) throw new Error('The workbook is empty.');

      workbookRef.current = workbook;
      const autonomousMode = !requestedSheet || requestedSheet === AUTO_SHEET_VALUE;

      if (autonomousMode) {
        const blocks = workbook.SheetNames.flatMap(sheetName => {
          const matrix = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], { header: 1, defval: '' });
          return aiIngestionEngine.extractFinancialBlocks(matrix, sheetName);
        });

        if (blocks.length > 0) {
          const headers = [...new Set(blocks.flatMap(block => block.headers))];
          const rawRows = blocks.flatMap(block => block.rows);
          const titles = blocks.map(block => block.title || '').filter(Boolean);
          const detectedType = financialDataService.detectDataType([...headers, ...titles], item.file.name);
          const inferredType: FinancialDataType = item.workflow === 'capitation' ? 'capitation' : detectedType === 'ffs' ? 'ffs' : 'claims';
          const detectedPeriods = [...new Set(blocks.flatMap(block => block.detectedPeriods))].sort();
          const firstDetectedPeriod = detectedPeriods[0]?.match(/^(\\d{4})-(\\d{2})$/);
          const fallbackPeriod = detectPeriodFromWorkbook(item.file.name, [], workbook.SheetNames);
          const detectedPeriod: DetectedPeriod = firstDetectedPeriod
            ? { year: firstDetectedPeriod[1], month: String(Number(firstDetectedPeriod[2])), source: 'workbook-metadata' }
            : fallbackPeriod;
          const firstBlock = blocks[0];
          const context = {
            facilityName: blocks.length === 1 ? firstBlock.providerName : undefined,
            lga: undefined,
            period: detectedPeriods[0],
          };
          const headerRowIndex = Math.min(...blocks.map(block => block.headerRowIndex));
          const horizontalSchedule = headers.some(isMonthColumn);
          const hasAutonomousRowPeriods = detectedPeriods.length > 0;

          updateQueueItem(item.id, {
            status: 'processing',
            dataType: inferredType,
            rows: rawRows.length,
            data: {
              workbook,
              sourceSheet: AUTO_SHEET_VALUE,
              sheetNames: [AUTO_SHEET_VALUE, ...workbook.SheetNames],
              headerRowIndex,
              autonomousMode: true,
              blockCount: blocks.length,
              autonomousPeriodDetection: hasAutonomousRowPeriods,
              detectedPeriods,
              autonomousBlocks: blocks.map(block => ({
                sheetName: block.sheetName,
                blockIndex: block.blockIndex,
                providerName: block.providerName,
                facilityType: block.category,
                detectedPeriods: block.detectedPeriods,
                rowCount: block.rows.length,
              })),
              headers,
              rawRows,
              mappings: financialDataService.suggestMappings(headers, inferredType, rawRows),
              matches: [],
              normalizedRecords: [],
              validationErrors: [],
              reportingYear: detectedPeriod.year,
              reportingMonth: detectedPeriod.month,
              periodDetection: detectedPeriod,
              horizontalSchedule,
              extractedContext: context,
              rowTypeSelection: item.workflow === 'capitation' ? 'capitation' : 'claims-ffs',
            }
          });
          setStep(detectedPeriod.year && (detectedPeriod.month || horizontalSchedule || hasAutonomousRowPeriods) ? 'inspect' : 'identify');
          return;
        }
      }

      const sheetName = requestedSheet || item.data?.sourceSheet || workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) throw new Error(`Worksheet "${sheetName}" could not be found.`);
      const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
      const hIndex = financialDataService.detectHeaderRowIndex(matrix);
      const detectedContext = financialDataService.extractWorkbookContext(matrix, hIndex);
      const context = {
        ...detectedContext,
        facilityName: detectedContext.facilityName || financialDataService.extractFacilityNameFromFilename(item.file.name),
      };
      const detectedPeriod = detectPeriodFromWorkbook(item.file.name, matrix, workbook.SheetNames);
      const detectedHeaders = (matrix[hIndex] || []).map((value, index) => String(value ?? '').trim() || `Column ${index + 1}`);
      const detectedType = financialDataService.detectDataType(detectedHeaders, item.file.name);
      const inferredType: FinancialDataType = item.workflow === 'capitation' ? 'capitation' : detectedType === 'ffs' ? 'ffs' : 'claims';
      const rows = XLSX.utils.sheet_to_json<RawRow>(sheet, { header: detectedHeaders, range: hIndex + 1, defval: '', raw: false })
        .filter(row => Object.values(row).some(value => String(value).trim() !== ''));
      const horizontalSchedule = detectedHeaders.some(isMonthColumn);

      updateQueueItem(item.id, {
        status: 'processing',
        dataType: inferredType,
        rows: rows.length,
        data: {
          workbook,
          sourceSheet: sheetName,
          sheetNames: workbook.SheetNames,
          headerRowIndex: hIndex,
          headers: detectedHeaders,
          rawRows: rows,
          mappings: financialDataService.suggestMappings(detectedHeaders, inferredType, rows),
          matches: [],
          normalizedRecords: [],
          validationErrors: [],
          reportingYear: detectedPeriod.year,
          reportingMonth: detectedPeriod.month,
          periodDetection: detectedPeriod,
          horizontalSchedule,
          extractedContext: context,
          rowTypeSelection: item.workflow === 'capitation' ? 'capitation' : 'claims-ffs',
        }
      });
      setStep(detectedPeriod.year && (detectedPeriod.month || horizontalSchedule) ? 'inspect' : 'identify');
    } catch (error) {
      updateQueueItem(item.id, { status: 'error', message: error instanceof Error ? error.message : 'Inspection failed' });
      setErrorMessage(error instanceof Error ? error.message : 'Inspection failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startMatching = async () => {
    if (!activeItem?.data) return;
    const { rawRows, mappings, headers, horizontalSchedule } = activeItem.data;

    setErrorMessage('');
    setIsAnalyzing(true);
    try {
      const providerField = mappings.find(m => m.nmisField === 'providerName')?.excelField;
      const providerCodeField = mappings.find(m => m.nmisField === 'providerCode')?.excelField;
      const lgaField = mappings.find(m => m.nmisField === 'lga')?.excelField;
      const stateField = mappings.find(m => m.nmisField === 'state')?.excelField;
      const hasAmountField = mappings.some(mapping => amountMappingFields.has(mapping.nmisField));
      const lowConfidence = mappings.filter(mapping => mapping.nmisField !== 'ignored' && mapping.confidence === 'LOW');

      if (!providerField && !activeItem.data.extractedContext.facilityName) {
        throw new Error('Could not detect a facility/provider name. Add a provider column or use a descriptive workbook filename.');
      }
      if (!hasAmountField && !horizontalSchedule) throw new Error('Map at least one financial amount column before continuing.');
      if (lowConfidence.length > 0) throw new Error(`Review or ignore ${lowConfidence.length} low-confidence mapping${lowConfidence.length === 1 ? '' : 's'} before continuing.`);
      if (!headers.some(header => header.trim())) throw new Error('The workbook does not contain usable headers.');

      const uniqueProviders = new Map<string, { name: string; code?: string; lga?: string; state?: string }>();
      rawRows.forEach(row => {
        const name = String(providerField ? row[providerField] ?? '' : '').trim();
        if (!name || isSummaryRow(name)) return;
        const key = `${name.toLowerCase()}|${String(row[providerCodeField || ''] ?? '').trim().toLowerCase()}`;
        uniqueProviders.set(key, {
          name,
          code: providerCodeField ? String(row[providerCodeField] ?? '').trim() || undefined : undefined,
          lga: lgaField ? String(row[lgaField] ?? '').trim() || undefined : undefined,
          state: stateField ? String(row[stateField] ?? '').trim() || undefined : undefined,
        });
      });

      let results = await Promise.all([...uniqueProviders.values()].map(p => financialDataService.matchProvider(p.name, p.code, p.lga, p.state)));
      if (results.length === 0 && activeItem.data.extractedContext.facilityName) {
        results = [await financialDataService.matchProvider(
          activeItem.data.extractedContext.facilityName,
          undefined,
          activeItem.data.extractedContext.lga,
          'Ondo',
        )];
      }
      updateActiveData({ matches: results });
      setMatchSearch(() => {
        const next: Record<string, string> = {};
        results.forEach(match => {
          if (match.status !== 'confirmed') next[match.excelName] = match.excelName;
        });
        return next;
      });
      setStep('classify');
    } catch (error) {
    setErrorMessage(error instanceof Error ? error.message : 'Matching failed');
  } finally {
    setIsAnalyzing(false);
  }
};

const generatePreview = () => {
    if (!activeItem?.data) return;
    const { rawRows, mappings, matches, reportingYear, reportingMonth, horizontalSchedule, rowTypeSelection } = activeItem.data;
    const hasAmountField = mappings.some(mapping => amountMappingFields.has(mapping.nmisField));
    const lowConfidence = mappings.filter(mapping => mapping.nmisField !== 'ignored' && mapping.confidence === 'LOW');
    if (!mappings.some(mapping => mapping.nmisField === 'providerName') && !activeItem.data.extractedContext.facilityName) {
      setErrorMessage('Map the required facility/provider name field or confirm a facility was detected from the workbook context.');
      return;
    }
    if (!hasAmountField && !horizontalSchedule) {
      setErrorMessage('Map at least one financial amount field before continuing.');
      return;
    }
    if (lowConfidence.length > 0) {
      setErrorMessage(`Review or ignore ${lowConfidence.length} low-confidence mapping${lowConfidence.length === 1 ? '' : 's'} before generating preview.`);
      return;
    }

    const rawRecords = financialDataService.normalizeData(
      rawRows,
      mappings,
      activeItem.dataType,
      activeItem.id,
      activeItem.file.name,
      activeItem.data.sourceSheet,
      reportingYear && (reportingMonth || horizontalSchedule) ? { reportingYear: Number(reportingYear), reportingMonth: Number(reportingMonth || 1) } : undefined,
      activeItem.data.extractedContext,
      { mode: rowTypeSelection || 'auto' },
    );
    const records = rawRecords.map(record => {
      const match = matches.find(candidate => {
        const sameName = normalizeProviderKey(candidate.excelName) === normalizeProviderKey(record.providerName);
        const sameCode = !candidate.matchedProviderCode || !record.providerCode || normalizeProviderKey(candidate.matchedProviderCode) === normalizeProviderKey(record.providerCode);
        return sameName && sameCode;
      });
      return match?.matchedProviderId ? {
        ...record,
        providerId: match.matchedProviderId,
        providerName: match.matchedProviderName || record.providerName,
        providerCode: match.matchedProviderCode || record.providerCode,
        lga: match.matchedProviderLga || record.lga,
        state: match.matchedProviderState || record.state,
        facilityType: match.matchedProviderFacilityType || record.facilityType,
        ownership: match.matchedProviderOwnership || record.ownership,
      } : record;
    });

    const seenFingerprints = new Set<string>();
    let duplicateCount = 0;
    const classifiedRecords = records.map(record => {
      const fingerprint = record.fingerprint || financialDataService.generateFingerprint(record);
      const alreadySeen = seenFingerprints.has(fingerprint);
      seenFingerprints.add(fingerprint);
      if (alreadySeen) {
        duplicateCount += 1;
        return { ...record, fingerprint, recordStatus: 'duplicate' as const, validationErrors: [...(record.validationErrors || []), 'Duplicate row in this workbook.'] };
      }
      return { ...record, fingerprint };
    });
    const aiIntegrity = financialDataService.analyzeIntegrity(rawRows, mappings, classifiedRecords, horizontalSchedule);
    const errors = classifiedRecords.flatMap(r => (r.validationErrors || []).map(e => `Row ${r.sourceRow}: ${e}`));
    const reviewCount = classifiedRecords.filter(r => !r.providerId && !(r.validationErrors?.length)).length;
    const errorCount = classifiedRecords.filter(r => (r.validationErrors?.length || 0) > 0).length;
    const readyCount = classifiedRecords.filter(r => r.providerId && r.recordStatus !== 'duplicate' && (!r.validationErrors || r.validationErrors.length === 0)).length;
    const periods = [...new Set(classifiedRecords.map(record => record.period).filter(Boolean))].sort();
    const period = periods.length === 1 ? periods[0] : periods.length > 1 ? `${periods[0]} to ${periods[periods.length - 1]}` : activeItem.period;

    updateActiveData({ normalizedRecords: classifiedRecords, validationErrors: [...new Set(errors)], aiIntegrity });
    updateQueueItem(activeItem.id, {
      status: (reviewCount > 0 || errorCount > 0) ? (reviewCount > 0 ? 'review' : 'error') : 'ready',
      review: reviewCount,
      errors: errorCount,
      matched: readyCount,
      duplicates: duplicateCount,
      period,
      rows: classifiedRecords.length,
    });
    setErrorMessage('');
    setStep('preview');
  };

  const handleCommit = async () => {
    if (!activeItem?.data || activeItem.status !== 'ready') return;

    setIsAnalyzing(true);
    try {
      const selectedBatchType: FinancialDataType = activeItem.data.rowTypeSelection === 'capitation'
        ? 'capitation'
        : activeItem.data.rowTypeSelection === 'claims-ffs'
          ? 'claims'
          : activeItem.dataType;
      const result = await createBatch.mutateAsync({
        batch: {
          fileName: activeItem.file.name,
          dataType: selectedBatchType,
          periodCovered: activeItem.period || null,
          totalRows: activeItem.rows,
          status: 'imported',
          uploadedBy: session?.user?.email || 'System',
          importedRows: activeItem.matched,
          warningRows: 0,
          errorRows: activeItem.errors,
          duplicateRows: activeItem.duplicates || 0,
          unmatchedProviders: activeItem.review,
            metadata: {
            sourceSheet: activeItem.data.sourceSheet,
            workflow: activeItem.workflow,
            detectedDataTypes: [...new Set(activeItem.data.normalizedRecords.map(record => record.dataType))],
            rowTypeSelection: activeItem.data.rowTypeSelection,
            providerNames: [...new Set(activeItem.data.normalizedRecords.map(r => r.providerName).filter(Boolean))],
            aiIntegrity: activeItem.data.aiIntegrity,
          }
        },
        records: activeItem.data.normalizedRecords
      });

      const importedRows = Number(result?.importedRows ?? 0);
      const duplicateRows = Number(result?.duplicateRows ?? 0);
      const rejectedRows = Number(result?.errorRows ?? 0);
      const totalAccepted = importedRows + duplicateRows;
      if (totalAccepted === 0 && rejectedRows === 0) {
        throw new Error('The trusted import workflow returned no imported, duplicate, or rejected rows. No persistence result was recorded.');
      }

      updateQueueItem(activeItem.id, {
        status: 'imported',
        importedRows,
        duplicates: duplicateRows,
        errors: rejectedRows,
        matched: importedRows,
      });
      setCommitMessage(`${activeItem.file.name}: imported ${importedRows.toLocaleString()}, duplicates ${duplicateRows.toLocaleString()}, rejected ${rejectedRows.toLocaleString()}.`);

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
    <>
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand-blue">Network Financial Data</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">{uploadWorkflow === 'capitation' ? 'Capitation Upload Centre' : 'Claims/FFS Upload Centre'}</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">Capitation is processed separately. Claims and Fee-for-Service share the **Claims/FFS** workflow, while any row-level CAPITATION or FFS type in the workbook remains authoritative.</p>
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
                  onClick={() => processFile(item)}
                  className={`group relative cursor-pointer rounded-2xl border p-3 transition-all ${activeFileId === item.id ? 'border-brand-blue bg-blue-50/50' : 'border-slate-100 hover:border-slate-200 bg-white'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-slate-900">{item.file.name}</p>
                      <p className="mt-0.5 text-[10px] text-slate-500">{item.rows.toLocaleString()} records · {item.workflow === 'capitation' ? 'CAPITATION' : 'CLAIMS/FFS'}</p>
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
                  <h2 className="mt-5 text-xl font-bold text-slate-900">Upload {uploadWorkflow === 'capitation' ? 'Capitation' : 'Claims/FFS'} Workbooks</h2>
                  <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">Choose the workflow first, then drop multiple folders or select a folder of processed workbooks. A mapped row-level type remains authoritative.</p>

                  <div className="mt-6 flex justify-center gap-2">
                    {([
                      { value: 'claims-ffs', label: 'Claims/FFS' },
                      { value: 'capitation', label: 'Capitation' },
                    ] as Array<{ value: UploadWorkflow; label: string }>).map(option => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setUploadWorkflow(option.value);
                          setDataType(option.value === 'capitation' ? 'capitation' : 'claims');
                        }}
                        className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${uploadWorkflow === option.value ? 'bg-brand-blue text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                      >
                        {option.label}
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
                  <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Workbook handling</label>
                        <select className="mt-2 w-full rounded-xl border-slate-200 text-sm" value={activeItem.data.sourceSheet} onChange={e => processFile(activeItem, e.target.value)}>
                          {activeItem.data.sheetNames.map(name => <option key={name} value={name}>{name === AUTO_SHEET_VALUE ? 'AI scan all worksheets and blocks' : name}</option>)}
                        </select>
                        {activeItem.data.autonomousMode && (
                          <p className="mt-2 text-[10px] font-semibold text-emerald-700">Automatic mode is active. No worksheet or column selection is required.</p>
                        )}
                      </div>
                      <div className="rounded-2xl bg-blue-50/50 p-4 border border-blue-100">
                        <div className="flex items-center gap-2 text-brand-blue">
                          <CheckCircle2 size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">AI Autonomous Detection</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-600 font-medium">Header row detected at index <strong>{activeItem.data.headerRowIndex + 1}</strong>.</p>
                        {activeItem.data.autonomousMode && <p className="mt-1 text-[10px] text-slate-500">Scanned {activeItem.data.sheetNames.length - 1} worksheet(s), {activeItem.data.blockCount || 0} provider table block(s), and {activeItem.rows.toLocaleString()} source row(s).</p>}
                        {activeItem.data.autonomousMode && (activeItem.data.detectedPeriods?.length || 0) > 0 && (
                          <p className="mt-1 text-[10px] font-semibold text-slate-600">Detected periods: {activeItem.data.detectedPeriods!.join(', ')}</p>
                        )}
                        {activeItem.data.extractedContext.facilityName && (
                          <p className="mt-1 text-[10px] text-slate-500 italic">Extracted facility: {activeItem.data.extractedContext.facilityName}</p>
                        )}
                      </div>
                    </div>
                    {activeItem.data.autonomousMode && (activeItem.data.autonomousBlocks?.length || 0) > 0 && (
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Autonomous scan results</p>
                          <span className="text-[10px] font-semibold text-emerald-700">{activeItem.data.autonomousBlocks!.length} blocks</span>
                        </div>
                        <div className="mt-3 max-h-56 overflow-y-auto rounded-xl border border-emerald-100 bg-white">
                          <table className="w-full text-left text-[11px]">
                            <thead className="sticky top-0 bg-emerald-50 text-emerald-800">
                              <tr>
                                <th className="px-3 py-2">Worksheet / block</th>
                                <th className="px-3 py-2">Provider context</th>
                                <th className="px-3 py-2">Category</th>
                                <th className="px-3 py-2">Periods</th>
                                <th className="px-3 py-2 text-right">Rows</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-emerald-50">
                              {activeItem.data.autonomousBlocks!.slice(0, 25).map(block => (
                                <tr key={`${block.sheetName}-${block.blockIndex}`}>
                                  <td className="px-3 py-2 font-semibold text-slate-700">{block.sheetName} · {block.blockIndex + 1}</td>
                                  <td className="px-3 py-2 text-slate-600">{block.providerName || 'Row-level provider column'}</td>
                                  <td className="px-3 py-2 text-slate-600">{block.facilityType || 'Inferred from data'}</td>
                                  <td className="px-3 py-2 text-slate-600">{block.detectedPeriods.length > 0 ? block.detectedPeriods.join(', ') : 'Context / filename'}</td>
                                  <td className="px-3 py-2 text-right font-mono text-slate-600">{block.rowCount.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {(activeItem.data.autonomousBlocks!.length > 25) && <p className="mt-2 text-[10px] text-emerald-700">Showing the first 25 blocks; all blocks remain included in normalization.</p>}
                      </div>
                    )}
                    <div className="rounded-2xl border border-slate-100 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-400">
                          <tr>
                            <th className="px-4 py-2">Row</th>
                            {activeItem.data.headers.slice(0, activeItem.data.autonomousMode ? 6 : 5).map((h, i) => <th key={i} className="px-4 py-2">{h}</th>)}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {activeItem.data.rawRows.slice(0, 5).map((row, i) => (
                            <tr key={i}>
                              <td className="px-4 py-2 font-mono text-slate-300">{i + 1}</td>
                              {activeItem.data!.headers.slice(0, activeItem.data!.autonomousMode ? 6 : 5).map((h, j) => <td key={j} className="px-4 py-2 truncate max-w-[150px]">{String(row[h] || '')}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <Actions
                    onBack={reset}
                    onNext={() => setStep(activeItem.data?.reportingYear && activeItem.data?.reportingMonth ? 'map' : 'identify')}
                  />
                </Panel>
              )}

              {step === 'identify' && activeItem?.data && (
                <Panel title="Reporting Period" description="The workbook did not contain a complete reporting month and year. Confirm or enter the missing period before continuing.">
                  <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    <p className="font-semibold">Manual period confirmation required</p>
                    <p className="mt-1 text-xs">NMIS will not invent a reporting period. Any value detected from the filename, worksheet name, or workbook metadata is prefilled below.</p>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reporting Year</label>
                      <input
                        className="mt-2 w-full rounded-xl border-slate-200 font-semibold"
                        value={activeItem.data.reportingYear ?? ''}
                        onChange={event => updateActiveData({ reportingYear: event.target.value })}
                        placeholder="e.g. 2026"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reporting Month</label>
                      <select
                        className="mt-2 w-full rounded-xl border-slate-200 font-semibold"
                        value={activeItem.data.reportingMonth ?? ''}
                        onChange={event => updateActiveData({ reportingMonth: event.target.value })}
                      >
                        <option value="">Select Month</option>
                        {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month, index) => (
                          <option key={month} value={String(index + 1)}>{month}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <Actions
                    onBack={() => setStep('inspect')}
                    onNext={() => {
                      const year = activeItem.data?.reportingYear?.trim();
                      const month = Number(activeItem.data?.reportingMonth);
                      const horizontalSchedule = activeItem.data?.horizontalSchedule;
                      const validYear = /^20\d{2}$/.test(year || '');
                      const validMonth = Number.isInteger(month) && month >= 1 && month <= 12;
                      if (!validYear || (!horizontalSchedule && !validMonth)) {
                        setErrorMessage(horizontalSchedule ? 'Enter a valid reporting year before continuing.' : 'Enter a valid reporting year and month before continuing.');
                        return;
                      }
                      setErrorMessage('');
                      updateQueueItem(activeItem.id, { period: horizontalSchedule ? year : `${year}-${String(month).padStart(2, '0')}` });
                      setStep('map');
                    }}
                  />
                </Panel>
              )}

              {step === 'map' && activeItem?.data && (
                <Panel title="Column Mapping" description="Map workbook columns to NMIS financial fields.">
                  <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-brand-blue">Import row types</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-600">Column 3 is the source row-type field. Choose what this upload should keep; excluded row types will not reach matching, preview, or commit.</p>
                      </div>
                      <select
                        className="w-full rounded-xl border-blue-200 bg-white text-sm font-semibold lg:w-80"
                        value={activeItem.data.rowTypeSelection}
                        onChange={event => updateActiveData({ rowTypeSelection: event.target.value as RowTypeSelection })}
                      >
                        <option value="capitation">Capitation only — exclude Claims/FFS</option>
                        <option value="claims-ffs">Claims/FFS only — exclude Capitation</option>
                        <option value="auto">Auto-detect mixed rows — keep both</option>
                      </select>
                    </div>
                  </div>
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
                            {financialDataService.isMonthColumn(mapping.excelField) && (
                              <option value="amountPaid">Monthly amount · {mapping.excelField.toUpperCase()}</option>
                            )}
                            {mappingOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Actions onBack={() => setStep('inspect')} onNext={startMatching} nextLabel="Match Facilities" />
                </Panel>
              )}

              {step === 'classify' && activeItem?.data && (
                <Panel title="Classification Rules" description="NMIS applies smart rules to identify row-level financial types and handle horizontal schedules.">
                  <div className="space-y-8">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="rounded-3xl border border-slate-100 bg-slate-50/50 p-6">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-brand-blue">
                          <ListChecks className="h-5 w-5" />
                        </div>
                        <h3 className="mt-4 text-sm font-bold text-slate-900 uppercase tracking-wider">AI Normalization Engine</h3>
                        <div className="mt-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={12} className="text-emerald-500" />
                            <p className="text-[11px] font-semibold text-slate-700">Autonomous Row Inheritance</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={12} className="text-emerald-500" />
                            <p className="text-[11px] font-semibold text-slate-700">Summary Row Suppression</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={12} className="text-emerald-500" />
                            <p className="text-[11px] font-semibold text-slate-700">Self-Healing Provider Logic</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-3xl border border-slate-100 bg-slate-50/50 p-6">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <h3 className="mt-4 text-sm font-bold text-slate-900 uppercase tracking-wider">Schedule Rule</h3>
                        <p className="mt-2 text-xs leading-relaxed text-slate-500">
                          {activeItem.data.horizontalSchedule
                            ? 'Horizontal month columns detected. The AI engine will pivot each month column into a distinct vertical record.'
                            : 'Single-period schedule detected. Records will be mapped to the identified reporting month and year.'}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-blue-100 bg-blue-50/30 p-6">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">AI Classification Summary</h3>
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Workflow Mode</span>
                          <span className="font-bold text-slate-900">{activeItem.workflow === 'capitation' ? 'Capitation' : 'Claims/FFS'}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-sm">
                          <span className="text-slate-500">Import row-type policy</span>
                          <span className="text-right font-bold text-slate-900">{activeItem.data.rowTypeSelection === 'auto' ? 'Auto-detect mixed rows' : activeItem.data.rowTypeSelection === 'capitation' ? 'Capitation only' : 'Claims/FFS only'}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Detected Records</span>
                          <span className="font-bold text-slate-900">{activeItem.rows.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Reporting Period</span>
                        <span className="font-bold text-slate-900">
                          {activeItem.data.reportingYear} {activeItem.data.reportingMonth ? months[Number(activeItem.data.reportingMonth) - 1].label : (activeItem.data.horizontalSchedule ? '(Multi-month)' : '')}
                        </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Actions onBack={() => setStep('map')} onNext={() => setStep('match')} />
                </Panel>
              )}

              {step === 'match' && activeItem?.data && (
                <Panel title="Match Providers" description="Matching source names against authoritative providers and approved aliases.">
                  <div className="space-y-4">
                    {activeItem.data.matches.map((match, idx) => (
                      <div key={idx} className="rounded-2xl border border-slate-100 p-4 bg-white">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                          <div className="flex-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Workbook Name</p>
                            <div className="mt-1 flex items-center gap-3">
                              <p className="text-sm font-bold text-slate-900">{match.excelName}</p>
                              <Badge variant={match.status === 'confirmed' ? 'success' : 'warning'} className="mt-1 text-[10px]">{match.status === 'confirmed' ? '✓ MATCHED' : '⚠ REVIEW'}</Badge>
                            </div>
                          </div>
                          <div className="flex-1 lg:max-w-md">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Matched Master</p>
                            <p className="text-sm font-semibold text-slate-700">{match.matchedProviderName || 'No match'}</p>
                          </div>
                        </div>
                        {match.status !== 'confirmed' && (
                          <div className="mt-4 space-y-3">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                              <input
                                className="w-full rounded-xl border-slate-200 pl-9 text-xs focus:ring-brand-blue"
                                value={matchSearch[match.excelName] || ''}
                                onChange={event => setMatchSearch(previous => ({ ...previous, [match.excelName]: event.target.value }))}
                                placeholder="Search Provider Directory to resolve & learn alias..."
                              />
                            </div>

                            <div className="grid grid-cols-1 gap-2">
                              {(match.candidates || [])
                                .filter(candidate => {
                                  const query = (matchSearch[match.excelName] || '').toLowerCase().trim();
                                  return !query || [candidate.name, candidate.code, candidate.lga, candidate.state].filter(Boolean).join(' ').toLowerCase().includes(query);
                                })
                                .slice(0, 5)
                                .map(candidate => (
                                  <button
                                    key={candidate.id}
                                    onClick={async () => {
                                      await financialDataService.resolveMatch(match, session?.user?.email, activeItem.id, candidate.id, match.excelName);
                                      const newMatches = [...activeItem.data!.matches];
                                      newMatches[idx] = {
                                        ...match,
                                        matchedProviderId: candidate.id,
                                        matchedProviderName: candidate.name,
                                        matchedProviderCode: candidate.code,
                                        matchedProviderLga: candidate.lga,
                                        matchedProviderState: candidate.state,
                                        matchedProviderFacilityType: candidate.facilityType,
                                        matchedProviderOwnership: candidate.ownership,
                                        status: 'confirmed',
                                        confidence: 1,
                                        matchType: 'manual'
                                      };
                                      updateActiveData({ matches: newMatches });
                                    }}
                                    className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-left hover:border-brand-blue hover:bg-blue-50/30 transition-all group"
                                  >
                                    <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-slate-900 group-hover:text-brand-blue transition-colors">{candidate.name}</p>
                          </div>
                                      <p className="mt-0.5 text-[10px] text-slate-500">{candidate.code} · {candidate.lga} · {candidate.ownership}</p>
                                    </div>
                                    <ArrowRight size={14} className="text-slate-300 group-hover:text-brand-blue transition-all" />
                                  </button>
                                ))}

                              {(!match.candidates || match.candidates.length === 0) && (
                                <div className="rounded-xl border border-amber-100 bg-amber-50/30 p-3 text-center">
                                  <p className="text-xs text-amber-700">No candidates were returned. Refine the search to resolve.</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <Actions onBack={() => setStep('classify')} onNext={generatePreview} nextLabel="Generate Preview" />
                </Panel>
              )}

              {step === 'preview' && activeItem?.data && (
                <Panel title="Validation Preview" description={`Summary of normalized ${activeItem.workflow === 'capitation' ? 'Capitation' : 'Claims/FFS'} records before commit. Row-level CAPITATION and FFS values remain preserved.`}>
                  <div className="grid gap-3 grid-cols-2 lg:grid-cols-5 mb-6">
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
                    <button onClick={() => { setErrorTypeFilter('error'); setIsErrorModalOpen(true); }} className="rounded-2xl bg-rose-50 p-4 border border-rose-100 text-left hover:bg-rose-100 transition-colors">
                      <p className="text-[10px] font-bold text-rose-600 uppercase">ERRORS</p>
                      <p className="mt-1 text-xl font-bold text-rose-700">{activeItem.errors.toLocaleString()}</p>
                    </button>
                    <button onClick={() => { setErrorTypeFilter('duplicate'); setIsErrorModalOpen(true); }} className="rounded-2xl bg-slate-50 p-4 border border-slate-200 text-left hover:bg-slate-100 transition-colors">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">DUPLICATES</p>
                      <p className="mt-1 text-xl font-bold text-slate-700">{(activeItem.duplicates || 0).toLocaleString()}</p>
                    </button>
                  </div>
                  {activeItem.data.aiIntegrity && (
                    <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50/40 p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2 text-brand-blue">
                            <CheckCircle2 size={15} />
                            <p className="text-[10px] font-bold uppercase tracking-widest">AI Integrity Summary</p>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">Read-only evidence of how the workbook was scanned, cleaned, inherited, and transformed.</p>
                        </div>
                        <button type="button" onClick={() => { setErrorTypeFilter('records'); setIsErrorModalOpen(true); }} className="shrink-0 rounded-xl border border-blue-200 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-brand-blue hover:bg-blue-50">
                          Inspect all records
                        </button>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        <div className="rounded-xl border border-blue-100 bg-white p-3"><p className="text-[10px] font-bold uppercase text-slate-400">Rows scanned</p><p className="mt-1 text-lg font-bold text-slate-800">{activeItem.data.aiIntegrity.scannedRows.toLocaleString()}</p></div>
                        <div className="rounded-xl border border-blue-100 bg-white p-3"><p className="text-[10px] font-bold uppercase text-slate-400">Provider rows inherited</p><p className="mt-1 text-lg font-bold text-slate-800">{activeItem.data.aiIntegrity.inheritedProviderRows.toLocaleString()}</p></div>
                        <div className="rounded-xl border border-blue-100 bg-white p-3"><p className="text-[10px] font-bold uppercase text-slate-400">Summary rows suppressed</p><p className="mt-1 text-lg font-bold text-slate-800">{activeItem.data.aiIntegrity.suppressedSummaryRows.toLocaleString()}</p></div>
                        <div className="rounded-xl border border-blue-100 bg-white p-3"><p className="text-[10px] font-bold uppercase text-slate-400">Empty schedule cells</p><p className="mt-1 text-lg font-bold text-slate-800">{activeItem.data.aiIntegrity.skippedEmptyScheduleCells.toLocaleString()}</p></div>
                        <div className="rounded-xl border border-blue-100 bg-white p-3"><p className="text-[10px] font-bold uppercase text-slate-400">Invalid amounts</p><p className={`mt-1 text-lg font-bold ${activeItem.data.aiIntegrity.invalidAmountCells > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{activeItem.data.aiIntegrity.invalidAmountCells.toLocaleString()}</p></div>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-bold uppercase tracking-wider text-slate-400">Detected row types:</span>
                        {activeItem.data.aiIntegrity.detectedDataTypes.length > 0 ? activeItem.data.aiIntegrity.detectedDataTypes.map(type => (
                          <Badge key={type} variant={type === 'capitation' ? 'success' : 'info'}>{type === 'ffs' ? 'Claims/FFS' : type}</Badge>
                        )) : <span className="text-slate-500">No row-level type values detected</span>}
                      </div>
                      {activeItem.data.aiIntegrity.warnings.length > 0 ? (
                        <div className="mt-4 space-y-1 rounded-xl border border-amber-100 bg-amber-50 p-3">
                          {activeItem.data.aiIntegrity.warnings.map((warning, index) => <p key={index} className="text-xs text-amber-800">{warning}</p>)}
                        </div>
                      ) : (
                        <p className="mt-4 text-xs font-semibold text-emerald-700">No AI integrity warnings were generated for this preview.</p>
                      )}
                    </div>
                  )}
                  <div className="overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3">Facility</th>
                          <th className="px-4 py-3">Source row</th>
                          <th className="px-4 py-3">Period</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3 text-right">Amount</th>
                          <th className="px-4 py-3 text-right">Status</th>
                          <th className="px-4 py-3 text-right">Inspect</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {activeItem.data.normalizedRecords.slice(0, 10).map((r, i) => (
                          <tr key={i}>
                            <td className="px-4 py-3 font-semibold text-slate-800">{r.providerName}</td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-400">{r.sourceRow ?? '—'}</td>
                            <td className="px-4 py-3 text-slate-500">{r.period}</td>
                            <td className="px-4 py-3"><Badge variant={r.dataType === 'capitation' ? 'success' : 'info'}>{r.dataType === 'ffs' ? 'Claims/FFS' : r.dataType}</Badge></td>
                            <td className="px-4 py-3 text-right font-mono">₦{amountForPreview(r).toLocaleString()}</td>
                            <td className="px-4 py-3 text-right">
                              <Badge variant={r.recordStatus === 'duplicate' ? 'default' : r.validationErrors?.length ? 'error' : r.providerId ? 'success' : 'warning'} className="text-[9px]">
                                {r.recordStatus === 'duplicate' ? 'DUPLICATE' : r.validationErrors?.length ? 'ERROR' : r.providerId ? 'READY' : 'MATCH REVIEW'}
                              </Badge>
                              {r.validationErrors?.[0] && <p className="mt-1 max-w-[220px] text-[10px] text-rose-600">{r.validationErrors[0]}</p>}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button type="button" onClick={() => { setErrorTypeFilter('records'); setIsErrorModalOpen(true); }} className="rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-bold uppercase text-brand-blue hover:bg-blue-50">Inspect</button>
                            </td>
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

    {isErrorModalOpen && activeItem?.data && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="w-full max-w-5xl max-h-[90vh] rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col">
          <div className="flex items-start justify-between bg-slate-50 p-6 border-b border-slate-200">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-blue">AI Validation Inspector</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">{errorTypeFilter === 'records' ? 'All Normalized Records' : 'Record-Level Issues'}</h2>
              <p className="mt-1 text-sm text-slate-500">{errorTypeFilter === 'records' ? 'Inspect every normalized record with source row, period, type, and validation status.' : 'Review and correct individual validation errors or provider matching issues.'}</p>
            </div>
            <button className="rounded-xl p-2 text-slate-400 hover:bg-white hover:text-slate-900 transition-all" onClick={() => setIsErrorModalOpen(false)}><X size={20} /></button>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col p-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Search by provider or error..." className="pl-10" value={errorSearch} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setErrorSearch(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Filter</span>
                <select className="rounded-xl border-slate-200 text-sm" value={errorTypeFilter} onChange={e => setErrorTypeFilter(e.target.value)}>
                  <option value="all">All Issues</option>
                  <option value="error">Validation Errors</option>
                  <option value="review">Unmatched Providers</option>
                  <option value="duplicate">Duplicates</option>
                  <option value="records">All normalized records</option>
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 border-b border-slate-100">Row</th>
                          <th className="px-4 py-3 border-b border-slate-100">Provider</th>
                          <th className="px-4 py-3 border-b border-slate-100">Period / Type</th>
                          <th className="px-4 py-3 border-b border-slate-100">Issue</th>
                    <th className="px-4 py-3 border-b border-slate-100 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {activeItem.data.normalizedRecords
                    .filter(r => {
                      const showAllRecords = errorTypeFilter === 'records';
                      const hasIssue = (r.validationErrors?.length || 0) > 0 || !r.providerId || r.recordStatus === 'duplicate';
                      if (!showAllRecords && !hasIssue) return false;

                      const matchesSearch = !errorSearch || [r.providerName, r.period, r.dataType, ...(r.validationErrors || [])].some(v => String(v).toLowerCase().includes(errorSearch.toLowerCase()));
                      const matchesType = showAllRecords || errorTypeFilter === 'all'
                        || (errorTypeFilter === 'error' && (r.validationErrors?.length || 0) > 0)
                        || (errorTypeFilter === 'review' && !r.providerId && (!r.validationErrors || r.validationErrors.length === 0))
                        || (errorTypeFilter === 'duplicate' && r.recordStatus === 'duplicate');

                      return matchesSearch && matchesType;
                    })
                    .map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4 font-mono text-xs text-slate-400">{r.sourceRow}</td>
                        <td className="px-4 py-4 font-semibold text-slate-900">{r.providerName}</td>
                        <td className="px-4 py-4 text-xs text-slate-500">{r.period} · {r.dataType === 'ffs' ? 'Claims/FFS' : r.dataType}</td>
                        <td className="px-4 py-4">
                          {r.validationErrors?.map((e, idx) => <p key={idx} className="text-xs text-rose-600 flex items-center gap-1.5"><AlertCircle size={12} /> {e}</p>)}
                          {!r.providerId && (!r.validationErrors || r.validationErrors.length === 0) && <p className="text-xs text-amber-600 flex items-center gap-1.5"><MapPin size={12} /> Provider matching required</p>}
                          {r.recordStatus === 'duplicate' && <p className="text-xs text-slate-500 flex items-center gap-1.5"><Copy size={12} /> Duplicate record skipped</p>}
                          {!r.validationErrors?.length && r.providerId && r.recordStatus !== 'duplicate' && <p className="text-xs text-emerald-600 flex items-center gap-1.5"><CheckCircle2 size={12} /> No validation issues</p>}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Badge variant={r.recordStatus === 'duplicate' ? 'default' : r.validationErrors?.length ? 'error' : 'warning'}>
                            {r.recordStatus === 'duplicate' ? 'DUPLICATE' : r.validationErrors?.length ? 'FIX REQUIRED' : 'MATCHING'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-end">
            <Button onClick={() => setIsErrorModalOpen(false)} className="rounded-2xl px-8">Close Inspector</Button>
          </div>
        </div>
      </div>
    )}
    </>
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
