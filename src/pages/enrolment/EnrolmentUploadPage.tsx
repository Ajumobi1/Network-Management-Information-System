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
  Loader2,
  X,
  Search,
  Copy,
  Download,
  Filter,
  Folder
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { financialDataService, isSummaryRow } from '../../services/financial-data/financialDataService';
import { findProviderMatchCandidates } from '../../services/providers/providersService';
import { enrolmentService } from '../../services/enrolment/enrolmentService';
import { useCreateEnrolmentImportBatch } from '../../hooks/enrolment';
import { EnrolleeRecord, EnrolmentColumnMapping, EnrolmentField, EnrolmentValidationError } from '../../types/enrolment/enrolmentTypes';
import { ImportBatch, ProviderMatch } from '../../types/financial-data';
import { useMockData } from '../../repositories/common';
import { collectFilesFromDrop, filterSupportedUploadFiles } from '../../utils/uploadFiles';
import { detectPeriodFromWorkbook, DetectedPeriod } from '../../utils/periodDetection';
import { exportBatchErrorsAndDuplicatesReport } from '../../utils/reportExport';

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
  duplicates: number;
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
    periodDetection: DetectedPeriod;
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
  const [isAutonomousMode, setIsAutonomousMode] = useState(true);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  
  const [errorMessage, setErrorMessage] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorSearch, setErrorSearch] = useState('');
  const [errorTypeFilter, setErrorTypeFilter] = useState<string>('all');
  const [providerSearchTerms, setProviderSearchTerms] = useState<Record<number, string>>({});
  const [providerSearchResults, setProviderSearchResults] = useState<Record<number, NonNullable<ProviderMatch['candidates']>>>({});
  const [providerSearchLoading, setProviderSearchLoading] = useState<number | null>(null);
  const [providerSearchErrors, setProviderSearchErrors] = useState<Record<number, string>>({});
  const providerSearchTimers = useRef<Record<number, number>>({});
  const { session } = useAuth();
  const createBatch = useCreateEnrolmentImportBatch();
  const workbookRef = useRef<XLSX.WorkBook | null>(null);

  const activeItem = useMemo(() => queue.find(item => item.id === activeFileId), [queue, activeFileId]);

  useEffect(() => {
    if (activeFileId && activeItem?.data) {
      workbookRef.current = activeItem.data.workbook;
      // Reset search state when switching files to prevent stale prefills
      setProviderSearchTerms(() => {
        const next: Record<number, string> = {};
        if (activeItem.data?.matches) {
          activeItem.data.matches.forEach((match, index) => {
            if (match.status !== 'confirmed') next[index] = match.excelName;
          });
        }
        return next;
      });
      setProviderSearchResults({});
      setProviderSearchErrors({});
    }
  }, [activeFileId, activeItem?.id]);
  
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

  const openIssueInspection = (filter: string = 'all') => {
    setErrorTypeFilter(filter);
    setIsErrorModalOpen(true);
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
      rows: 0,
      matched: 0,
      review: 0,
      errors: 0,
      duplicates: 0
    }));

    setQueue(prev => [...prev, ...newItems]);

    // Pre-inspect every selected workbook, including files discovered inside a folder.
    for (const item of newItems) {
      try {
        const wb = XLSX.read(await item.file.arrayBuffer(), { type: 'array', cellDates: true });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
        let hIdx = enrolmentService.detectHeaderRowIndex(matrix);
        let rows = XLSX.utils.sheet_to_json<RawRow>(sheet, { range: hIdx, defval: '', raw: false })
          .filter(r => Object.values(r).some(v => String(v).trim() !== ''));

        if (rows.length === 0 && matrix.length > 0) {
          const fallbackIdx = matrix.findIndex(r => Array.isArray(r) && r.filter(c => String(c ?? '').trim() !== '').length >= 3);
          if (fallbackIdx !== -1) {
            hIdx = fallbackIdx;
            rows = XLSX.utils.sheet_to_json<RawRow>(sheet, { range: hIdx, defval: '', raw: false })
              .filter(r => Object.values(r).some(v => String(v).trim() !== ''));
          }
        }
        updateQueueItem(item.id, { rows: rows.length });
      } catch (e) {
        updateQueueItem(item.id, { status: 'error', message: 'Workbook could not be inspected.' });
      }
    }

    if (!activeFileId && newItems.length > 0) {
      processFile(newItems[0]);
    }
  };

  const startAutomatedProcessing = async () => {
    if (isProcessingQueue) return;
    setIsProcessingQueue(true);
    setErrorMessage('');
    
    try {
      // Find all items that are not yet imported
      const pendingItems = queue.filter(item => item.status !== 'imported');
      
      for (const item of pendingItems) {
        try {
          // Switch to this item
          setActiveFileId(item.id);
          
          // 1. Process/Inspect File
          const workbook = XLSX.read(await item.file.arrayBuffer(), { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
        const workbookContext = enrolmentService.extractWorkbookContext(matrix);
        const context = {
          ...workbookContext,
          facilityName: workbookContext.facilityName || enrolmentService.extractFacilityNameFromFilename(item.file.name),
        };
        const detectedPeriod = detectPeriodFromWorkbook(item.file.name, matrix, workbook.SheetNames);
        const detectedYear = detectedPeriod.year;
        const detectedMonth = detectedPeriod.month;

        let hIndex = enrolmentService.detectHeaderRowIndex(matrix);
        let detectedHeaders = (matrix[hIndex] || []).map(value => String(value).trim()).filter(Boolean);
        let rows = XLSX.utils.sheet_to_json<RawRow>(sheet, { range: hIndex, defval: '', raw: false })
          .filter(row => Object.values(row).some(value => String(value).trim() !== ''));

        if (rows.length === 0 && matrix.length > 0) {
          const fallbackIndex = matrix.findIndex(r => Array.isArray(r) && r.filter(c => String(c ?? '').trim() !== '').length >= 3);
          if (fallbackIndex !== -1) {
            hIndex = fallbackIndex;
            detectedHeaders = (matrix[hIndex] || []).map(value => String(value ?? '').trim() || `Column_${Math.random().toString(36).substring(7)}`).filter(Boolean);
            rows = XLSX.utils.sheet_to_json<RawRow>(sheet, { range: hIndex, defval: '', raw: false }).filter(row => Object.values(row).some(value => String(value).trim() !== ''));
          }
        }

        if (!detectedYear || !detectedMonth) {
          updateQueueItem(item.id, { status: 'review', message: 'Manual period confirmation required.' });
          setIsProcessingQueue(false);
          setStep('identify');
          return;
        }

        const mappings = enrolmentService.suggestEnrolmentMappings(detectedHeaders);
        const period = `${detectedYear}-${detectedMonth.padStart(2, '0')}`;
        
        // 2. Match Providers
        const providerField = mappings.find(m => m.enrolmentField === 'providerName')?.excelField;
        const providerCodeField = mappings.find(m => m.enrolmentField === 'providerCode')?.excelField;
        const lgaField = mappings.find(m => m.enrolmentField === 'lga')?.excelField;
        const stateField = mappings.find(m => m.enrolmentField === 'state')?.excelField;

        let matches: ProviderMatch[] = [];
        if (providerField) {
          const uniqueProviders = new Map<string, { name: string; code?: string; lga?: string; state?: string }>();
          rows.forEach(row => {
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
          if (uniqueProviders.size > 0) {
            matches = await Promise.all([...uniqueProviders.values()].map(p => financialDataService.matchProvider(p.name, p.code, p.lga, p.state)));
          }
        }

        if (matches.length === 0 && context.facilityName) {
          matches = [await financialDataService.matchProvider(context.facilityName, undefined, context.lga, 'Ondo')];
        }

        if (matches.some(m => m.status !== 'confirmed')) {
          updateQueueItem(item.id, { 
            status: 'review', 
            rows: rows.length,
            period,
            data: { workbook, sourceSheet: sheetName, sheetNames: workbook.SheetNames, headerRowIndex: hIndex, headers: detectedHeaders, rawRows: rows, mappings, reportingYear: detectedYear, reportingMonth: detectedMonth, matches, normalizedRecords: [], validationErrors: [], extractedContext: context, periodDetection: detectedPeriod }
          });
          // Download report for the unmatched providers
          const records = enrolmentService.normalizeEnrolmentRows(rows, mappings, matches, period, item.id, item.file.name, sheetName);
          exportBatchErrorsAndDuplicatesReport(item.file.name, records);
          continue;
        }

        // 3. Normalize & Preview
        const records = enrolmentService.normalizeEnrolmentRows(rows, mappings, matches, period, item.id, item.file.name, sheetName);
        
        const reviewCount = records.filter(r => r.recordStatus === 'match-review-required').length;
        const errorCount = records.filter(r => r.recordStatus === 'error').length;
        const duplicateCount = records.filter(r => r.recordStatus === 'duplicate').length;
        const readyCount = records.filter(r => r.recordStatus === 'valid').length;
        const validationErrors = records.flatMap(r => (r.validationErrors || []).map(msg => `Row ${r.sourceRow}: ${msg}`));

        if (reviewCount > 0 || errorCount > 0 || duplicateCount > 0) {
          exportBatchErrorsAndDuplicatesReport(item.file.name, records);
        }

        if (reviewCount > 0 || errorCount > 0) {
          updateQueueItem(item.id, { 
            status: reviewCount > 0 ? 'review' : 'error', 
            rows: records.length,
            matched: readyCount,
            review: reviewCount,
            errors: errorCount,
            duplicates: duplicateCount,
            period,
            data: { workbook, sourceSheet: sheetName, sheetNames: workbook.SheetNames, headerRowIndex: hIndex, headers: detectedHeaders, rawRows: rows, mappings, reportingYear: detectedYear, reportingMonth: detectedMonth, matches, normalizedRecords: records, validationErrors, extractedContext: context, periodDetection: detectedPeriod }
          });
          
          // If there are no ready records, we can't commit, so move to next file.
          // If there are ready records, we'll proceed to commit the valid ones.
          if (readyCount === 0) {
            continue;
          }
        }

        // 4. Commit
          await createBatch.mutateAsync({
            batch: {
              fileName: item.file.name,
              dataType: 'enrolment',
              periodCovered: period,
              totalRows: records.length,
              status: 'imported',
              uploadedBy: session?.user?.email || 'System',
              importedRows: readyCount,
              warningRows: 0,
              errorRows: errorCount,
              duplicateRows: duplicateCount,
              unmatchedProviders: reviewCount,
              metadata: { 
                sourceSheet: sheetName, 
                extractedContext: context,
                providerNames: [...new Set(records.map(r => r.providerName).filter(Boolean))] 
              }
            },
            records: records.filter(r => r.recordStatus === 'valid')
          });

          updateQueueItem(item.id, {
            status: 'imported',
            matched: readyCount,
            duplicates: duplicateCount,
            errors: errorCount,
            review: reviewCount,
          });
        } catch (fileError) {
          console.error(`Error processing file ${item.file.name}:`, fileError);
          updateQueueItem(item.id, { 
            status: 'error', 
            message: fileError instanceof Error ? fileError.message : 'Autonomous processing failed for this file' 
          });
          // Continue to next file
        }
      }
      
      setStep('commit');
      setCommitMessage('Autonomous processing completed for all files.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Autonomous processing failed');
    } finally {
      setIsProcessingQueue(false);
    }
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
      if (workbook.SheetNames.length === 0) throw new Error('The workbook does not contain a readable worksheet.');
      
      workbookRef.current = workbook;
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
      
      // AI Context Extraction, with the descriptive filename as a safe fallback
      // for workbooks whose provider name is not present in a metadata row.
      const workbookContext = enrolmentService.extractWorkbookContext(matrix);
      const context = {
        ...workbookContext,
        facilityName: workbookContext.facilityName || enrolmentService.extractFacilityNameFromFilename(item.file.name),
      };
      
      // Automatic Period Detection from filename, sheet metadata, and headers
      const detectedPeriod = detectPeriodFromWorkbook(item.file.name, matrix, workbook.SheetNames);
      const detectedYear = detectedPeriod.year;
      const detectedMonth = detectedPeriod.month;

      let hIndex = enrolmentService.detectHeaderRowIndex(matrix);
      let detectedHeaders = (matrix[hIndex] || []).map(value => String(value).trim()).filter(Boolean);
      let rows = XLSX.utils.sheet_to_json<RawRow>(sheet, { range: hIndex, defval: '', raw: false })
        .filter(row => Object.values(row).some(value => String(value).trim() !== ''));

      // Robust Fallback: If no rows found with detected header, look for first row with at least 3 columns of data
      if (rows.length === 0 && matrix.length > 0) {
        const fallbackIndex = matrix.findIndex(r => Array.isArray(r) && r.filter(c => String(c ?? '').trim() !== '').length >= 3);
        if (fallbackIndex !== -1) {
          hIndex = fallbackIndex;
          detectedHeaders = (matrix[hIndex] || []).map(value => {
            const v = String(value ?? '').trim();
            return v || `Column_${Math.random().toString(36).substring(7)}`;
          }).filter(Boolean);
          
          rows = XLSX.utils.sheet_to_json<RawRow>(sheet, { range: hIndex, defval: '', raw: false })
            .filter(row => Object.values(row).some(value => String(value).trim() !== ''));
        }
      }

      updateQueueItem(item.id, {
        status: 'processing',
        rows: rows.length,
        period: detectedYear && detectedMonth ? `${detectedYear}-${detectedMonth.padStart(2, '0')}` : undefined,
        data: {
          workbook,
          sourceSheet: sheetName,
          sheetNames: workbook.SheetNames,
          headerRowIndex: hIndex,
          headers: detectedHeaders,
          rawRows: rows,
          mappings: enrolmentService.suggestEnrolmentMappings(detectedHeaders),
          reportingYear: detectedYear || '',
          reportingMonth: detectedMonth || '',
          matches: [],
          normalizedRecords: [],
          validationErrors: [],
          extractedContext: context,
          periodDetection: detectedPeriod
        }
      });
      // Skip manual period selection only when both month and year were found.
      setStep(detectedYear && detectedMonth ? 'map' : 'identify');
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
        if (uniqueProviders.size > 0) {
          results = await Promise.all([...uniqueProviders.values()].map(provider => financialDataService.matchProvider(provider.name, provider.code, provider.lga, provider.state)));
        }
      }

      // If the mapped column was absent or empty, use the workbook context. This
      // includes a descriptive facility filename such as an original provider workbook.
      if (results.length === 0) {
        const nameToMatch = extractedContext.facilityName || enrolmentService.extractFacilityNameFromFilename(activeItem.file.name);
        if (nameToMatch) {
          const match = await financialDataService.matchProvider(nameToMatch, undefined, extractedContext.lga, 'Ondo');
          results = [match];
        }
      }

      if (results.length === 0) {
        throw new Error('Could not detect a facility/provider name. Add a provider name column or use a descriptive facility filename.');
      }

      updateActiveData({ matches: results });
      setProviderSearchTerms(() => {
        const next: Record<number, string> = {};
        results.forEach((match, index) => {
          if (match.status !== 'confirmed') next[index] = match.excelName;
        });
        return next;
      });
      setProviderSearchResults({});
      setProviderSearchErrors({});
      setStep('match');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Matching failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resolveProviderCandidate = async (matchIndex: number, match: ProviderMatch, candidate: NonNullable<ProviderMatch['candidates']>[number]) => {
    if (!activeItem?.data) return;
    try {
      await financialDataService.resolveMatch(match, session?.user?.email, activeItem.id, candidate.id, match.excelName);
      const newMatches = [...activeItem.data.matches];
      newMatches[matchIndex] = {
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
      setProviderSearchTerms(prev => ({ ...prev, [matchIndex]: '' }));
      setProviderSearchResults(prev => ({ ...prev, [matchIndex]: [] }));
    } catch (error) {
      setProviderSearchErrors(prev => ({
        ...prev,
        [matchIndex]: error instanceof Error ? error.message : 'Provider resolution failed.'
      }));
    }
  };

  const searchProviderDirectory = (matchIndex: number, query: string) => {
    setProviderSearchTerms(prev => ({ ...prev, [matchIndex]: query }));
    setProviderSearchErrors(prev => ({ ...prev, [matchIndex]: '' }));
    if (providerSearchTimers.current[matchIndex]) {
      window.clearTimeout(providerSearchTimers.current[matchIndex]);
    }

    if (query.trim().length < 2) {
      setProviderSearchLoading(current => current === matchIndex ? null : current);
      setProviderSearchResults(prev => ({ ...prev, [matchIndex]: [] }));
      return;
    }

    providerSearchTimers.current[matchIndex] = window.setTimeout(async () => {
      setProviderSearchLoading(matchIndex);
      try {
        const providers = await findProviderMatchCandidates(query.trim(), 25);
        const candidates = providers.map(provider => ({
          id: provider.id,
          name: provider.providerName,
          code: provider.providerCode,
          lga: provider.lga,
          state: provider.state,
          facilityType: provider.category,
          ownership: provider.ownership,
        }));
        setProviderSearchResults(prev => ({ ...prev, [matchIndex]: candidates }));
      } catch (error) {
        setProviderSearchErrors(prev => ({
          ...prev,
          [matchIndex]: error instanceof Error ? error.message : 'Provider directory search failed.'
        }));
        setProviderSearchResults(prev => ({ ...prev, [matchIndex]: [] }));
      } finally {
        setProviderSearchLoading(current => current === matchIndex ? null : current);
      }
    }, 300);
  };

  const getProviderCandidatesForDisplay = (matchIndex: number, match: ProviderMatch) => {
    const candidates = [
      ...(providerSearchResults[matchIndex] || []),
      ...(match.candidates || []),
    ];
    return candidates
      .filter((candidate, index, all) => all.findIndex(item => item.id === candidate.id) === index)
      .slice(0, 5);
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
    const errorCount = records.filter(r => r.recordStatus === 'error').length;
    const duplicateCount = records.filter(r => r.recordStatus === 'duplicate').length;
    const readyCount = records.filter(r => r.recordStatus === 'valid').length;

    updateQueueItem(activeFileId!, {
      status: (reviewCount > 0) ? 'review' : (errorCount > 0 ? 'error' : 'ready'),
      review: reviewCount,
      errors: errorCount,
      matched: readyCount,
      duplicates: duplicateCount,
      rows: records.length
    });
    
    setStep('preview');
  };

  const handleCommit = async () => {
    if (!activeItem?.data || activeItem.matched === 0) return;
    
    const hasIssues = activeItem.errors > 0 || activeItem.review > 0 || activeItem.duplicates > 0;
    if (hasIssues) {
      const confirmed = window.confirm(
        `This batch contains ${activeItem.errors + activeItem.review + activeItem.duplicates} issues that will be skipped. Only ${activeItem.matched} READY records will be committed.\n\nDo you want to proceed with a partial import?`
      );
      if (!confirmed) return;
    }

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
          duplicateRows: activeItem.duplicates,
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
      
      // Auto-download issues report if any issues exist
      if (activeItem.errors > 0 || activeItem.review > 0 || activeItem.duplicates > 0) {
        exportBatchErrorsAndDuplicatesReport(activeItem.file.name, activeItem.data.normalizedRecords);
      }

      setCommitMessage(`Successfully imported ${activeItem.matched} records from ${activeItem.file.name}. ${activeItem.errors + activeItem.review + activeItem.duplicates} records were skipped due to validation issues.`);
      
      // Check if there are more files in queue
      setQueue(currentQueue => {
        const nextPending = currentQueue.find(item => item.id !== activeItem.id && item.status === 'pending');
        if (nextPending) {
          setTimeout(() => processFile(nextPending), 0);
        } else {
          setStep('commit');
        }
        return currentQueue;
      });
      setIsAnalyzing(false);
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
            <label className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 py-3 text-xs font-semibold text-brand-blue hover:bg-blue-50 transition-colors">
              <Upload className="h-3.5 w-3.5" /> Add folder
              <input className="hidden" type="file" multiple accept=".xlsx,.xls,.csv" onChange={handleFileUpload} {...({ directory: true, webkitdirectory: true } as any)} />
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
                <section onDragOver={event => event.preventDefault()} onDrop={handleDrop} className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-16 text-center shadow-sm">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-brand-blue">
                    <FileUp className="h-7 w-7" />
                  </div>
                  <h2 className="mt-5 text-xl font-bold text-slate-900">Select Historical Capitation Files</h2>
                  <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">Drop multiple files or folders here. The system supports bulk processing of monthly enrollee workbooks from January 2025 onwards.</p>
                  
                  <div className="mt-8 flex flex-col items-center justify-center gap-6">
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-2 pr-4">
                      <div className="flex items-center gap-1 rounded-xl bg-white p-1 shadow-sm">
                        <button 
                          onClick={() => setIsAutonomousMode(true)}
                          className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${isAutonomousMode ? 'bg-brand-blue text-white' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          Autonomous
                        </button>
                        <button 
                          onClick={() => setIsAutonomousMode(false)}
                          className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${!isAutonomousMode ? 'bg-brand-blue text-white' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          Manual
                        </button>
                      </div>
                      <p className="text-[11px] font-medium text-slate-500">
                        {isAutonomousMode ? 'AI processes the entire queue automatically' : 'Review each step for every workbook'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all active:scale-95">
                        <Upload className="h-4 w-4" /> Choose Files
                        <input className="hidden" type="file" multiple accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
                      </label>
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all active:scale-95">
                        <Folder className="h-4 w-4" /> Add Folder
                        <input className="hidden" type="file" multiple accept=".xlsx,.xls,.csv" onChange={handleFileUpload} {...({ directory: true, webkitdirectory: true } as any)} />
                      </label>
                      {queue.length > 0 && (
                        <button 
                          onClick={isAutonomousMode ? startAutomatedProcessing : () => setStep('inspect')}
                          disabled={isProcessingQueue}
                          className="inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-6 py-3 text-sm font-bold text-white hover:bg-brand-navy shadow-lg shadow-brand-blue/20 transition-all active:scale-95 disabled:opacity-50"
                        >
                          {isProcessingQueue ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Processing Queue...</>
                          ) : (
                            <><RefreshCcw className="h-4 w-4" /> {isAutonomousMode ? 'Process Queue' : 'Start Manual Review'}</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {step === 'inspect' && activeItem?.data && (
                <Panel title="Inspect workbook structure" description="Confirm the worksheet and column headers. The AI has detected the core table structure.">
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="min-w-[200px]">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Worksheet</label>
                        <select 
                          className="mt-2 w-full rounded-xl border-slate-200 text-sm"
                          value={activeItem.data.sourceSheet}
                          onChange={e => processFile({ ...activeItem, data: { ...activeItem.data!, sourceSheet: e.target.value } } as any)}
                        >
                          {activeItem.data.sheetNames.map(name => <option key={name} value={name}>{name}</option>)}
                        </select>
                      </div>
                      <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                        <div className="flex items-center gap-2 text-brand-blue">
                          <CheckCircle2 size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">AI Autonomous Detection</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-600 font-medium">Header row detected at index {activeItem.data.headerRowIndex + 1}.</p>
                        {activeItem.data.extractedContext.facilityName && (
                          <p className="mt-1 text-[10px] text-slate-500 italic">Facility context: {activeItem.data.extractedContext.facilityName}{activeItem.data.extractedContext.lga ? ` · ${activeItem.data.extractedContext.lga} LGA` : ''}</p>
                        )}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Header intelligence</p>
                          <p className="mt-1 text-xs font-semibold text-slate-700">Scans the entire worksheet</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Context inheritance</p>
                          <p className="mt-1 text-xs font-semibold text-slate-700">Provider, code, and LGA propagate safely</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Noise suppression</p>
                          <p className="mt-1 text-xs font-semibold text-slate-700">Totals and summary rows excluded</p>
                        </div>
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
                <Panel title="Reporting Period" description="The workbook did not contain a complete reporting month and year. Confirm or enter the missing period before continuing.">
                  <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    <p className="font-semibold">Manual period confirmation required</p>
                    <p className="mt-1 text-xs">NMIS will not invent a reporting period. Any month or year that was detected is prefilled below; enter the missing value only when it is not written in the workbook.</p>
                  </div>
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
                  <Actions
                    onBack={() => setStep('inspect')}
                    onNext={() => {
                      const year = activeItem.data?.reportingYear.trim();
                      const month = Number(activeItem.data?.reportingMonth);
                      if (!/^20\d{2}$/.test(year || '') || !Number.isInteger(month) || month < 1 || month > 12) {
                        setErrorMessage('Enter a valid reporting year and month before continuing.');
                        return;
                      }
                      setErrorMessage('');
                      updateQueueItem(activeItem.id, { period: `${year}-${String(month).padStart(2, '0')}` });
                      setStep('map');
                    }}
                  />
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
                  <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                    <div className="flex items-center gap-2 text-brand-blue">
                      <CheckCircle2 size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">AI Normalization Engine</span>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      <p className="text-xs font-semibold text-slate-700">Row inheritance enabled</p>
                      <p className="text-xs font-semibold text-slate-700">Summary suppression enabled</p>
                      <p className="text-xs font-semibold text-slate-700">Filename context fallback enabled</p>
                    </div>
                  </div>
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
                        
                        {match.status !== 'confirmed' && (
                          <div className="mt-4 border-t border-slate-50 pt-4">
                            <label htmlFor={`provider-search-${idx}`} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              Search Provider Directory to resolve &amp; learn alias
                            </label>
                            <div className="relative mt-2">
                              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden="true" />
                              <input
                                id={`provider-search-${idx}`}
                                type="search"
                                value={providerSearchTerms[idx] || ''}
                                onChange={event => searchProviderDirectory(idx, event.target.value)}
                                placeholder="Type the full provider name, code, or LGA..."
                                autoComplete="off"
                                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-10 text-sm text-slate-800 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15"
                              />
                              {providerSearchLoading === idx && (
                                <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-brand-blue" aria-label="Searching provider directory" />
                              )}
                            </div>
                            <p className="mt-1 text-[10px] text-slate-400">The workbook name is prefilled. Edit or replace it to narrow to the closest authoritative provider.</p>

                            {providerSearchErrors[idx] && (
                              <p className="mt-2 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                                {providerSearchErrors[idx]}
                              </p>
                            )}

                            {providerSearchResults[idx]?.length > 0 && (
                              <div className="mt-2 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                                {providerSearchResults[idx].map(candidate => (
                                  <button
                                    key={candidate.id}
                                    type="button"
                                    onClick={() => resolveProviderCandidate(idx, match, candidate)}
                                    className="flex w-full items-start justify-between gap-3 border-b border-slate-100 px-3 py-3 text-left last:border-b-0 hover:bg-slate-50"
                                  >
                                    <span>
                                      <span className="block text-sm font-semibold text-slate-800">{candidate.name}</span>
                                      <span className="mt-0.5 block text-[10px] text-slate-500">{candidate.code} · {candidate.lga} · {candidate.ownership || 'Ownership unavailable'}</span>
                                    </span>
                                    <span className="shrink-0 text-[10px] font-bold uppercase text-brand-blue">Use provider</span>
                                  </button>
                                ))}
                              </div>
                            )}

                            {providerSearchTerms[idx]?.trim().length >= 2 && !providerSearchLoading && providerSearchResults[idx]?.length === 0 && !providerSearchErrors[idx] && (
                              <p className="mt-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">No authoritative provider matched that search.</p>
                            )}

                            {getProviderCandidatesForDisplay(idx, match).length > 0 && (
                              <div className="mt-3">
                                <div className="mb-2 flex items-center justify-between gap-3">
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    {providerSearchResults[idx]?.length ? 'Closest matches' : 'Suggested closest matches'}
                                  </p>
                                  <span className="text-[10px] text-slate-400">Showing up to 5</span>
                                </div>
                                <div className="space-y-2">
                                  {getProviderCandidatesForDisplay(idx, match).map((candidate, candidateIndex) => (
                                    <button
                                      key={candidate.id}
                                      type="button"
                                      onClick={() => resolveProviderCandidate(idx, match, candidate)}
                                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-brand-blue hover:bg-brand-soft/30"
                                    >
                                      <span className="min-w-0">
                                        <span className="flex items-center gap-2">
                                          <span className="truncate text-sm font-semibold text-slate-800">{candidate.name}</span>
                                          {candidateIndex === 0 && <Badge variant="success" className="shrink-0 text-[9px]">Closest</Badge>}
                                        </span>
                                        <span className="mt-1 block text-[10px] text-slate-500">
                                          {candidate.code} · {candidate.lga || 'LGA unavailable'} · {candidate.ownership || 'Ownership unavailable'}
                                        </span>
                                      </span>
                                      <span className="shrink-0 text-[10px] font-bold uppercase text-brand-blue">Use provider</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
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
                    <div className="rounded-2xl bg-rose-50 p-4 border border-rose-100 relative group">
                      <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">ERRORS</p>
                      <p className="mt-1 text-xl font-bold text-rose-700">{activeItem.errors.toLocaleString()}</p>
                                              {activeItem.errors > 0 && (
                         <button
                           type="button"
                           onClick={() => openIssueInspection('all')}
                           className="mt-2 flex items-center gap-1 text-[10px] font-bold text-rose-600 hover:text-rose-800 transition-colors uppercase"
                         >
                           <AlertCircle size={12} /> View Errors
                         </button>
                       )}

                    </div>
                    <button
                      type="button"
                      onClick={() => activeItem.duplicates > 0 && openIssueInspection('DUPLICATE_RECORD')}
                      disabled={activeItem.duplicates === 0}
                      className={`rounded-2xl bg-slate-50 p-4 border border-slate-100 text-left transition-colors ${
                        activeItem.duplicates > 0 ? 'cursor-pointer hover:border-amber-300 hover:bg-amber-50/40' : 'cursor-default'
                      }`}
                      aria-label={activeItem.duplicates > 0 ? 'Inspect duplicate records' : 'No duplicate records'}
                    >
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">DUPLICATES</p>
                      <p className="mt-1 text-xl font-bold text-slate-700">{activeItem.duplicates?.toLocaleString() || 0}</p>
                      {activeItem.duplicates > 0 && (
                        <span className="mt-2 block text-[10px] font-bold uppercase text-amber-700">View duplicates</span>
                      )}
                    </button>
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

                  {(activeItem.errors > 0 || activeItem.review > 0 || activeItem.duplicates > 0) && (
                    <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                      <AlertCircle className="h-5 w-5 shrink-0" />
                      <div>
                        <p className="font-bold">Validation Issues Detected</p>
                        <p className="text-xs mt-1">
                          {activeItem.errors + activeItem.review + activeItem.duplicates} records have errors or require review and will be skipped during commit. 
                          You can inspect and resolve these issues using the <strong>View Errors</strong> action above.
                        </p>
                      </div>
                    </div>
                  )}

                  <Actions 
                    onBack={() => setStep('match')} 
                    onNext={handleCommit} 
                    nextLabel={activeItem.errors > 0 || activeItem.review > 0 || activeItem.duplicates > 0 ? "Commit Ready Records" : "Commit Batch"} 
                    disabled={activeItem.matched === 0} 
                  />
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
        {isErrorModalOpen && activeItem?.data && (
          <ErrorInspectionModal 
            item={activeItem} 
            onClose={() => setIsErrorModalOpen(false)} 
            search={errorSearch}
            setSearch={setErrorSearch}
            typeFilter={errorTypeFilter}
            setTypeFilter={setErrorTypeFilter}
            onUpdateRecords={(newRecords) => {
              const reviewCount = newRecords.filter(r => r.recordStatus === 'match-review-required').length;
              const errorCount = newRecords.filter(r => r.recordStatus === 'error').length;
              const duplicateCount = newRecords.filter(r => r.recordStatus === 'duplicate').length;
              const readyCount = newRecords.filter(r => r.recordStatus === 'valid').length;

              updateActiveData({ normalizedRecords: newRecords });
              updateQueueItem(activeFileId!, {
                status: (reviewCount > 0) ? 'review' : (errorCount > 0 ? 'error' : 'ready'),
                review: reviewCount,
                errors: errorCount,
                matched: readyCount,
                duplicates: duplicateCount,
                rows: newRecords.length
              });
            }}
          />
        )}
      </div>
    </div>
  );
}

function ErrorInspectionModal({ 
  item, 
  onClose,
  search,
  setSearch,
  typeFilter,
  setTypeFilter,
  onUpdateRecords
}: { 
  item: FileQueueItem; 
  onClose: () => void;
  search: string;
  setSearch: (v: string) => void;
  typeFilter: string;
  setTypeFilter: (v: string) => void;
  onUpdateRecords: (records: EnrolleeRecord[]) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<EnrolleeRecord>>({});

  const records = item.data?.normalizedRecords || [];
  const errorRecords = records.filter(r => r.recordStatus === 'error' || r.recordStatus === 'match-review-required' || r.recordStatus === 'duplicate');
  
  const errorStats = useMemo(() => {
    const stats: Record<string, number> = {};
    errorRecords.forEach(r => {
      r.structuredErrors?.forEach(e => {
        stats[e.code] = (stats[e.code] || 0) + 1;
      });
    });
    return stats;
  }, [errorRecords]);

  const filteredErrors = useMemo(() => {
    return errorRecords.filter(r => {
      const matchesSearch = !search || 
        r.policyNumber.toLowerCase().includes(search.toLowerCase()) ||
        `${r.firstName} ${r.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        r.providerName.toLowerCase().includes(search.toLowerCase());
      
      const matchesType = typeFilter === 'all' || 
        r.structuredErrors?.some(e => e.code === typeFilter);
      
      return matchesSearch && matchesType;
    });
  }, [errorRecords, search, typeFilter]);

  const downloadErrorReport = () => {
    const headers = ['Source Row', 'Policy Number', 'Beneficiary', 'Age', 'Category', 'Facility', 'Error Type', 'Error Message', 'Suggested Action'];
    const rows = errorRecords.flatMap(r => 
      (r.structuredErrors || []).map(e => [
        r.sourceRow,
        r.policyNumber,
        `${r.firstName} ${r.lastName}`,
        r.age || '',
        r.category,
        r.providerName,
        e.code,
        e.message,
        e.suggestedAction || ''
      ])
    );
    const csv = [headers, ...rows].map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${item.file.name.replace(/\.[^/.]+$/, "")}_errors.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadReadyRecords = () => {
    const readyRecords = records.filter(r => r.recordStatus === 'valid');
    const headers = ['Policy Number', 'First Name', 'Last Name', 'Age', 'Gender', 'Category', 'Sector', 'Facility', 'LGA', 'State', 'Period'];
    const rows = readyRecords.map(r => [
      r.policyNumber,
      r.firstName,
      r.lastName,
      r.age || '',
      r.gender,
      r.category,
      r.sector,
      r.providerName,
      r.lga,
      r.state,
      r.period
    ]);
    const csv = [headers, ...rows].map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${item.file.name.replace(/\.[^/.]+$/, "")}_ready.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-5xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between bg-slate-50/80 p-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="error" className="text-[10px]">IMPORT ISSUES</Badge>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{item.file.name}</p>
            </div>
            <h2 className="mt-1 text-2xl font-black text-slate-900">Issue Inspection & Resolution</h2>
            <p className="mt-1 text-sm text-slate-500">Review validation issues and duplicate records before committing this batch.</p>
          </div>
          <div className="flex items-center gap-2">
                          <Button variant="secondary" size="sm" onClick={downloadErrorReport} className="gap-2">
                <Download size={14} /> Issue Report
              </Button>

            <Button variant="secondary" size="sm" onClick={downloadReadyRecords} className="gap-2">
              <CheckCircle2 size={14} className="text-emerald-500" /> Ready Records
            </Button>
            <button 
              className="ml-2 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors" 
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Summary Bar */}
          <div className="bg-white px-6 py-4 border-b border-slate-50 overflow-x-auto flex items-center gap-6 no-scrollbar">
            <div className="shrink-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Total Issues</p>
              <p className="text-lg font-black text-rose-600">{errorRecords.length}</p>
            </div>
            <div className="h-8 w-px bg-slate-100 shrink-0" />
            <div className="flex items-center gap-4 py-1">
              {Object.entries(errorStats).map(([code, count]) => (
                <div key={code} className="shrink-0 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{code.replace(/_/g, ' ')}</p>
                  <p className="text-sm font-bold text-slate-700">{count}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="px-6 py-4 bg-slate-50/30 border-b border-slate-50 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search policy, beneficiary, or facility..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border-slate-200 text-sm focus:ring-brand-blue focus:border-brand-blue"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter size={14} className="text-slate-400" />
              <select 
                className="flex-1 sm:w-48 rounded-xl border-slate-200 text-sm py-2"
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
              >
                <option value="all">All Issue Types</option>
                {Object.keys(errorStats).map(code => (
                  <option key={code} value={code}>{code.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Error List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/20">
            {filteredErrors.length === 0 ? (
              <div className="py-20 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                  <Search size={32} />
                </div>
                <p className="text-slate-500 font-medium">No issues match your current filters.</p>
                <button 
                  onClick={() => { setSearch(''); setTypeFilter('all'); }}
                  className="mt-2 text-brand-blue font-bold text-sm hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              filteredErrors.map((record, idx) => (
                <div key={idx} className="rounded-2xl border border-slate-100 bg-white p-5 hover:shadow-md transition-shadow group">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left: Record Context */}
                    <div className="w-full lg:w-1/3 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Source Row {record.sourceRow}</p>
                        <Badge variant={record.recordStatus === 'duplicate' ? 'warning' : 'error'} className="text-[9px]">
                          {record.recordStatus.toUpperCase()}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Policy Number</p>
                        <p className="text-sm font-mono font-bold text-slate-800">{record.policyNumber || record.metadata?.sourceValues?.policyNumber || 'MISSING'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Beneficiary</p>
                        <p className="text-sm font-bold text-slate-900">{record.firstName} {record.lastName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Facility</p>
                        <p className="text-sm font-semibold text-slate-700">{record.providerName}</p>
                      </div>
                    </div>

                    {/* Right: Error Details */}
                    <div className="flex-1 space-y-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Validation Issues</p>
                      <div className="space-y-3">
                        {record.structuredErrors?.map((error, eIdx) => (
                          <div key={eIdx} className="rounded-xl border border-rose-100 bg-rose-50/30 p-4">
                            <div className="flex items-start gap-3">
                              <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-bold text-rose-700 uppercase tracking-tight">{error.code.replace(/_/g, ' ')}</p>
                                  <span className="text-[10px] font-bold text-rose-400 uppercase">{error.severity}</span>
                                </div>
                                <p className="mt-1 text-sm font-semibold text-slate-800">{error.message}</p>
                                {error.suggestedAction && (
                                  <div className="mt-2 flex items-start gap-2 text-xs text-slate-600 bg-white/50 p-2 rounded-lg border border-rose-100/50">
                                    <span className="font-bold text-rose-600 uppercase text-[9px] mt-0.5">Required:</span>
                                    <span>{error.suggestedAction}</span>
                                  </div>
                                )}
                                {error.originalValue !== undefined && (
                                  <p className="mt-2 text-[10px] font-mono text-slate-400 italic">Source value: "{String(error.originalValue)}"</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="shrink-0 flex flex-row lg:flex-col gap-2">
                      {editingId === record.id ? (
                        <>
                          <Button 
                            size="sm" 
                            onClick={() => {
                              const newRecords = records.map(r => r.id === record.id ? { ...r, ...editValues } : r);
                              // Re-normalize to apply validation logic to the manual changes
                              // Note: We need to pass the updated records through normalization again
                              // For simplicity in this UI, we'll just update and re-run the service logic
                              const period = `${item.data?.reportingYear}-${item.data?.reportingMonth.padStart(2, '0')}`;
                              
                              // We need a way to re-validate without full workbook re-processing
                              // Let's manually trigger the record-level validation here
                              const updatedRecord = { ...record, ...editValues };
                              const errors: string[] = [];
                              const structuredErrors: EnrolmentValidationError[] = [];
                              
                              // Policy check
                              if (!updatedRecord.policyNumber) {
                                structuredErrors.push({ code: 'POLICY_NUMBER_MISSING', message: 'Policy number is required.', field: 'policyNumber', severity: 'error' });
                              } else {
                                const sector = enrolmentService.deriveSectorFromPolicy(updatedRecord.policyNumber);
                                if (!sector) {
                                  structuredErrors.push({ code: 'POLICY_NUMBER_INVALID', message: 'Policy number must contain /C/ for formal or /D/ for informal sector.', field: 'policyNumber', severity: 'error' });
                                } else {
                                  updatedRecord.sector = sector;
                                }
                              }
                              
                              if (!updatedRecord.firstName) structuredErrors.push({ code: 'BENEFICIARY_NAME_MISSING', message: 'First name is required.', field: 'firstName', severity: 'error' });
                              if (!updatedRecord.lastName) structuredErrors.push({ code: 'BENEFICIARY_NAME_MISSING', message: 'Last name is required.', field: 'lastName', severity: 'error' });
                              
                              updatedRecord.structuredErrors = structuredErrors;
                              updatedRecord.validationErrors = structuredErrors.map(e => e.message);
                              updatedRecord.recordStatus = structuredErrors.length > 0 ? 'error' : 'valid';
                              
                              const finalRecords = records.map(r => r.id === record.id ? updatedRecord : r);
                              // Re-run batch-level duplicate detection to update all affected records
                              onUpdateRecords(enrolmentService.markDuplicateEnrollees(finalRecords));
                              setEditingId(null);
                            }}
                          >
                            Save
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="gap-1"
                            onClick={() => {
                              setEditingId(record.id);
                              setEditValues({
                                policyNumber: record.policyNumber,
                                firstName: record.firstName,
                                lastName: record.lastName,
                                age: record.age,
                                gender: record.gender,
                                category: record.category
                              });
                            }}
                          >
                            Resolve
                          </Button>
                          <button
                            className="p-2 rounded-xl border border-slate-100 text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors" 
                            title="Exclude Record"
                            onClick={() => {
                              const newRecords = records.filter(r => r.id !== record.id);
                              onUpdateRecords(newRecords);
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Inline Edit Form */}
                  {editingId === record.id && (
                    <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in slide-in-from-top-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Policy Number</label>
                        <input 
                          type="text" 
                          className="mt-1 w-full rounded-xl border-slate-200 text-sm font-mono"
                          value={editValues.policyNumber || ''}
                          onChange={e => setEditValues({ ...editValues, policyNumber: e.target.value.toUpperCase() })}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">First Name</label>
                        <input 
                          type="text" 
                          className="mt-1 w-full rounded-xl border-slate-200 text-sm"
                          value={editValues.firstName || ''}
                          onChange={e => setEditValues({ ...editValues, firstName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Name</label>
                        <input 
                          type="text" 
                          className="mt-1 w-full rounded-xl border-slate-200 text-sm"
                          value={editValues.lastName || ''}
                          onChange={e => setEditValues({ ...editValues, lastName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Age</label>
                        <input 
                          type="number" 
                          className="mt-1 w-full rounded-xl border-slate-200 text-sm"
                          value={editValues.age || ''}
                          onChange={e => setEditValues({ ...editValues, age: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gender</label>
                        <select 
                          className="mt-1 w-full rounded-xl border-slate-200 text-sm"
                          value={editValues.gender || ''}
                          onChange={e => setEditValues({ ...editValues, gender: e.target.value as any })}
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</label>
                        <select 
                          className="mt-1 w-full rounded-xl border-slate-200 text-sm"
                          value={editValues.category || ''}
                          onChange={e => setEditValues({ ...editValues, category: e.target.value as any })}
                        >
                          <option value="principal">Principal</option>
                          <option value="dependant">Dependant</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-6 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Showing <strong>{filteredErrors.length}</strong> of <strong>{errorRecords.length}</strong> issues found in <strong>{item.rows.toLocaleString()}</strong> records.
          </p>
          <Button onClick={onClose}>Close Inspector</Button>
        </div>
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
