import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, FileSpreadsheet, Hospital, MapPin, RefreshCcw, Upload } from 'lucide-react';
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

const mappingOptions: Array<{ value: EnrolmentField | 'ignored'; label: string }> = [
  { value: 'ignored', label: 'Ignore this column' },
  { value: 'policyNumber', label: 'Policy number' },
  { value: 'category', label: 'CATEGORY (Principal/Dependant)' },
  { value: 'firstName', label: 'First name' },
  { value: 'lastName', label: 'Last name' },
  { value: 'gender', label: 'Gender' },
  { value: 'age', label: 'Age' },
  { value: 'phoneNumber', label: 'Phone number' },
  { value: 'providerCode', label: 'Provider/facility code' },
  { value: 'providerName', label: 'Facility/provider name' },
  { value: 'lga', label: 'LGA' },
  { value: 'state', label: 'State' },
  { value: 'senatorialDistrict', label: 'Senatorial district' },
  { value: 'reportingMonth', label: 'Reporting month' },
  { value: 'reportingYear', label: 'Reporting year' },
];

export default function EnrolmentUploadPage() {
  const workbookRef = useRef<XLSX.WorkBook | null>(null);
  const [step, setStep] = useState<UploadStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [sourceSheet, setSourceSheet] = useState('');
  const [headerRowIndex, setHeaderRowIndex] = useState(0);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<RawRow[]>([]);
  const [mappings, setMappings] = useState<EnrolmentColumnMapping[]>([]);
  const [reportingYear, setReportingYear] = useState('');
  const [reportingMonth, setReportingMonth] = useState('');
  const [matches, setMatches] = useState<ProviderMatch[]>([]);
  const [normalizedRecords, setNormalizedRecords] = useState<EnrolleeRecord[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState<ImportBatch[] | null>(null);
  const [duplicateAcknowledged, setDuplicateAcknowledged] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { session } = useAuth();
  const liveCommitUnavailable = false; // Workflow is now wired to secure RPCs
  const createBatch = useCreateEnrolmentImportBatch();

  const period = reportingYear && reportingMonth
    ? `${reportingYear}-${reportingMonth.padStart(2, '0')}`
    : '';
  const mappingFields = useMemo(() => new Set(mappings.map(mapping => mapping.enrolmentField)), [mappings]);
  const [extractedContext, setExtractedContext] = useState<{ facilityName?: string; lga?: string; period?: string }>({});

  const missingRequiredMappings = ['policyNumber', 'category', 'firstName', 'lastName', 'gender']
    .filter(field => !mappingFields.has(field as EnrolmentField));
  const matchSummary = useMemo(() => ({
    matched: matches.filter(match => match.status === 'confirmed' && Boolean(match.matchedProviderId)).length,
    ambiguous: matches.filter(match => match.status === 'pending' && Boolean(match.candidates?.length)).length,
    unmatched: matches.filter(match => !match.matchedProviderId && match.status !== 'confirmed').length,
  }), [matches]);
  const validRecords = normalizedRecords.filter(record => record.recordStatus === 'valid');
  const duplicateRecords = normalizedRecords.filter(record => record.recordStatus === 'duplicate');
  const recordsRequiringReview = normalizedRecords.filter(record => record.recordStatus === 'match-review-required');
  const readyToImport = validRecords.length;

  const readSheet = (workbook: XLSX.WorkBook, sheetName: string, hIndex: number) => {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) throw new Error('The selected worksheet could not be read.');
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
    
    // AI Context Extraction from header rows above the table
    const context = enrolmentService.extractWorkbookContext(matrix);
    setExtractedContext(context);
    if (context.period) {
      const yearMatch = context.period.match(/20\d\d/);
      if (yearMatch) setReportingYear(yearMatch[0]);
    }
    
    const detectedHeaders = (matrix[hIndex] || []).map(value => String(value).trim()).filter(Boolean);
    const rows = XLSX.utils.sheet_to_json<RawRow>(sheet, { range: hIndex, defval: '', raw: false })
      .filter(row => Object.values(row).some(value => String(value).trim() !== ''));
    if (detectedHeaders.length === 0 || rows.length === 0) throw new Error('The selected header row has no readable columns.');
    setSourceSheet(sheetName);
    setHeaderRowIndex(hIndex);
    setHeaders(detectedHeaders);
    setRawRows(rows);
    setMappings(enrolmentService.suggestEnrolmentMappings(detectedHeaders));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    setErrorMessage('');
    setCommitMessage('');
    setFile(selectedFile);
    setIsAnalyzing(true);
    try {
      const workbook = XLSX.read(await selectedFile.arrayBuffer(), { type: 'array', cellDates: true });
      if (workbook.SheetNames.length === 0) throw new Error('The workbook does not contain a readable worksheet.');
      workbookRef.current = workbook;
      setSheetNames(workbook.SheetNames);
      readSheet(workbook, workbook.SheetNames[0], 0);
      setStep('inspect');
    } catch (error) {
      setFile(null);
      setErrorMessage(error instanceof Error ? error.message : 'The workbook could not be inspected.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateMapping = (index: number, value: EnrolmentField | 'ignored') => {
    setMappings(current => current.map((mapping, mappingIndex) => mappingIndex === index
      ? { ...mapping, enrolmentField: value, confidence: 'HIGH', confidenceScore: 1, isCustom: true }
      : mapping));
  };

  const continueToPeriod = () => {
    setErrorMessage('');
    setStep('identify');
  };

  const continueToMap = () => {
    setErrorMessage('');
    if (!reportingYear || !reportingMonth) {
      setErrorMessage('Enter the reporting year and month before continuing.');
      return;
    }
    setStep('map');
  };

  const continueToClassify = () => {
    setErrorMessage('');
    if (missingRequiredMappings.length > 0) {
      setErrorMessage(`Map the required fields before continuing: ${missingRequiredMappings.join(', ')}.`);
      return;
    }
    setStep('classify');
  };

  const startMatching = async () => {
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
        // Use extracted context facility name from header rows
        const match = await financialDataService.matchProvider(extractedContext.facilityName, undefined, extractedContext.lga, 'Ondo');
        results = [match];
      } else {
        throw new Error('Could not detect a facility/provider name in the column mappings or workbook header.');
      }

      setMatches(results);
      setStep('match');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Facility matching could not be completed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resolveMatch = async (index: number, candidateId: string) => {
    const current = matches[index];
    const candidate = current?.candidates?.find(item => item.id === candidateId);
    if (!candidate) return;
    const resolved: ProviderMatch = {
      ...current,
      matchedProviderId: candidate.id,
      matchedProviderName: candidate.name,
      matchedProviderCode: candidate.code,
      matchedProviderLga: candidate.lga,
      matchedProviderState: candidate.state,
      matchedProviderSenatorialDistrict: candidate.senatorialDistrict,
      matchedProviderFacilityType: candidate.facilityType,
      matchedProviderOwnership: candidate.ownership,
      confidence: 1,
      matchType: 'manual',
      status: 'confirmed',
    };
    setMatches(items => items.map((item, itemIndex) => itemIndex === index ? resolved : item));
    // Preview-only resolution. Persistent provider-match resolution requires the trusted import workflow.
  };

  const generatePreview = () => {
    setErrorMessage('');
    if (!period) {
      setErrorMessage('A valid reporting period is required.');
      return;
    }
    const records = enrolmentService.normalizeEnrolmentRows(rawRows, mappings, matches, period, 'pending-enrolment-batch', file?.name || 'unknown.xlsx', sourceSheet);
    const errors = records.flatMap(record => (record.validationErrors || []).map(error => `Source row ${record.sourceRow || '?'}: ${error}`));
    setNormalizedRecords(records);
    setValidationErrors([...new Set(errors)]);
    setDuplicateWarning(null);
    setDuplicateAcknowledged(false);
    setStep('preview');
  };

  const handleCommit = async () => {
    if (liveCommitUnavailable) {
      setErrorMessage('This operation requires the approved secure import workflow. Workbook preview and validation remain available, but live commit is disabled.');
      return;
    }
    if (!file || !period || readyToImport === 0 || validationErrors.length > 0) return;
    setErrorMessage('');
    try {
      if (!duplicateAcknowledged) {
        const providerNames = [...new Set(matches.map(match => (match.matchedProviderName || match.excelName).trim()).filter(Boolean))];
        const duplicateCheck = await enrolmentService.checkDuplicateEnrolmentBatch(period, providerNames);
        if (duplicateCheck.isDuplicate) {
          setDuplicateWarning(duplicateCheck.batches);
          setErrorMessage('Potential duplicate dataset detected. Review the existing batch or choose to import only records that are not already present.');
          return;
        }
        setDuplicateAcknowledged(true);
      }
      const committed = await createBatch.mutateAsync({
        batch: {
          fileName: file.name,
          dataType: 'enrolment',
          reportingYear: Number(reportingYear),
          reportingMonth: Number(reportingMonth),
          uploadedBy: session?.user.email || 'NMIS user',
          totalRows: rawRows.length,
          importedRows: readyToImport,
          warningRows: recordsRequiringReview.length,
          errorRows: normalizedRecords.length - validRecords.length - duplicateRecords.length,
          duplicateRows: duplicateRecords.length,
          unmatchedProviders: matchSummary.unmatched + matchSummary.ambiguous,
          status: 'processing',
          periodCovered: period,
          metadata: { sourceSheet, headers, fileSize: file.size, providerNames: [...new Set(matches.map(match => (match.matchedProviderName || match.excelName).trim()).filter(Boolean))], formalCount: validRecords.filter(record => record.sector === 'formal').length, informalCount: validRecords.filter(record => record.sector === 'informal').length, principalCount: validRecords.filter(record => record.category === 'principal').length, dependantCount: validRecords.filter(record => record.category === 'dependant').length, sectorDerivation: 'policy-number /C/ or /D/', categorySource: 'source CATEGORY field' },
        },
        records: validRecords,
        actor: session?.user ? { id: session.user.id, email: session.user.email } : undefined,
      });
      setCommitMessage(`Import committed as ${committed.id}. ${committed.importedRows.toLocaleString()} enrollee records are now available for ${period}.`);
      setStep('commit');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'The enrolment dataset could not be committed.');
    }
  };

  const reset = () => {
    workbookRef.current = null;
    setStep('upload');
    setFile(null);
    setSheetNames([]);
    setSourceSheet('');
    setHeaders([]);
    setRawRows([]);
    setMappings([]);
    setMatches([]);
    setNormalizedRecords([]);
    setValidationErrors([]);
    setCommitMessage('');
    setDuplicateWarning(null);
    setDuplicateAcknowledged(false);
    setErrorMessage('');
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand-blue">Population &amp; Enrolment</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Upload Capitation List</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">Normalize monthly beneficiary lists without changing source CATEGORY values. Sector is derived from the policy number and facilities are matched against the Provider Directory.</p>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto rounded-2xl bg-slate-100 p-1">
          {steps.map((item, index) => <div key={item} className={`flex items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold ${step === item ? 'bg-brand-blue text-white' : 'text-slate-500'}`}><span>{index + 1}</span><span className="hidden xl:inline">{stepLabels[item]}</span></div>)}
        </div>
      </header>

      {liveCommitUnavailable && <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><AlertCircle className="h-5 w-5 shrink-0" /><p><strong>Secure workflow unavailable.</strong> Workbook inspection, period identification, mapping, CATEGORY preservation, /C/ and /D/ sector validation, matching preview, and record preview remain enabled. Live commit and persistent match resolution are disabled.</p></div>}
      {errorMessage && <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><AlertCircle className="h-5 w-5 shrink-0" /><p>{errorMessage}</p></div>}
      {commitMessage && <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"><CheckCircle2 className="h-5 w-5 shrink-0" /><p>{commitMessage}</p></div>}

      {isAnalyzing && <div className="rounded-3xl border border-slate-200 bg-white py-20 text-center"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-blue" /><p className="mt-4 text-sm font-semibold text-slate-700">Processing workbook and provider directory...</p></div>}

      {!isAnalyzing && step === 'upload' && <section className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-16 text-center shadow-sm"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-brand-blue"><Upload className="h-7 w-7" /></div><h2 className="mt-5 text-xl font-bold text-slate-900">Upload a monthly capitation or enrollee workbook</h2><p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">Supports XLSX, XLS, and CSV files with flexible column order, naming, and worksheet selection.</p><label className="mt-7 inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-brand-blue px-5 py-3 text-sm font-semibold text-white hover:bg-brand-navy"><Upload className="h-4 w-4" /> Select workbook<input className="hidden" type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} /></label></section>}

      {!isAnalyzing && step === 'inspect' && file && (
        <div className="space-y-6">
          <Panel title="Inspect workbook" description="Confirm the worksheet and source structure before identifying the reporting period.">
            <div className="grid gap-4 md:grid-cols-3">
              <Info label="File" value={file.name} />
              <Info label="Worksheets" value={String(sheetNames.length)} />
              <Info label="Rows in sheet" value={rawRows.length.toLocaleString()} />
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">Source worksheet
                <select className="mt-2 w-full rounded-xl border-slate-200 text-sm" value={sourceSheet} onChange={event => workbookRef.current && readSheet(workbookRef.current, event.target.value, 0)}>
                  {sheetNames.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </label>
              <label className="block text-sm font-semibold text-slate-700">Header row index
                <select className="mt-2 w-full rounded-xl border-slate-200 text-sm" value={headerRowIndex} onChange={event => workbookRef.current && readSheet(workbookRef.current, sourceSheet, Number(event.target.value))}>
                  {Array.from({ length: 10 }).map((_, i) => <option key={i} value={i}>Row {i + 1}</option>)}
                </select>
              </label>
            </div>
            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Detected headers</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {headers.map(header => <Badge key={header} variant="info">{header}</Badge>)}
              </div>
            </div>
            <Actions onNext={continueToPeriod} />
          </Panel>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <h3 className="text-sm font-bold text-slate-900">Workbook preview (First 10 rows)</h3>
              <p className="text-xs text-slate-500">Select the row that contains your column headers.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-400">
                    <th className="px-6 py-3 font-bold">Index</th>
                    {Array.from({ length: 10 }).map((_, i) => <th key={i} className="px-4 py-3">Col {i + 1}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(() => {
                    if (!workbookRef.current || !sourceSheet) return [];
                    const sheet = workbookRef.current.Sheets[sourceSheet];
                    return XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, range: 0, defval: '' }).slice(0, 10);
                  })().map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex === headerRowIndex ? 'bg-blue-50 font-bold text-blue-700' : ''}>
                      <td className="px-6 py-3 font-mono text-slate-400 whitespace-nowrap">Row {rowIndex + 1} {rowIndex === headerRowIndex && '(Headers)'}</td>
                      {Array.from({ length: 10 }).map((_, colIndex) => (
                        <td key={colIndex} className="px-4 py-3 truncate max-w-[150px]">{String(row[colIndex] ?? '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!isAnalyzing && step === 'identify' && <Panel title="Identify reporting period" description="Use the workbook values where available, then confirm the month that this list represents."><div className="grid gap-4 md:grid-cols-2"><label className="text-sm font-semibold text-slate-700">Reporting year<input className="mt-2 w-full rounded-xl border-slate-200" inputMode="numeric" value={reportingYear} onChange={event => setReportingYear(event.target.value.replace(/[^0-9]/g, '').slice(0, 4))} placeholder="2026" /></label><label className="text-sm font-semibold text-slate-700">Reporting month<select className="mt-2 w-full rounded-xl border-slate-200" value={reportingMonth} onChange={event => setReportingMonth(event.target.value)}><option value="">Select month</option>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={String(index + 1)}>{new Date(2020, index, 1).toLocaleString('en', { month: 'long' })}</option>)}</select></label></div><div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">The reporting period is independent from CATEGORY and SECTOR. CATEGORY is preserved from the source, while SECTOR is derived only from <strong>/C/</strong> or <strong>/D/</strong> in the policy number.</div><Actions onBack={() => setStep('inspect')} onNext={continueToMap} /></Panel>}

      {!isAnalyzing && step === 'map' && (
        <Panel title="Map source columns" description="Map each source column once. The AI handler automatically detects variations in naming and structure.">
          {extractedContext.facilityName && (
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
              <Hospital className="h-5 w-5" />
              <div>
                <p className="font-bold">AI Detected Facility Context</p>
                <p className="text-xs">Workbook header: <strong>{extractedContext.facilityName}</strong> {extractedContext.lga ? `(${extractedContext.lga} LGA)` : ''}</p>
              </div>
            </div>
          )}
          <div className="space-y-3">
            {mappings.map((mapping, index) => (
              <div key={`${mapping.excelField}-${index}`} className="grid gap-3 rounded-2xl border border-slate-100 p-3 md:grid-cols-[1fr_1.3fr_auto] md:items-center">
                <div>
                  <p className="font-semibold text-slate-800">{mapping.excelField}</p>
                  <p className="text-xs text-slate-400">Method: {mapping.confidenceScore >= 0.8 ? 'AI Handler' : 'Manual'}</p>
                </div>
                <select className="rounded-xl border-slate-200 text-sm" value={mapping.enrolmentField} onChange={event => updateMapping(index, event.target.value as EnrolmentField | 'ignored')}>
                  {mappingOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <Badge variant={mapping.confidence === 'HIGH' ? 'success' : mapping.confidence === 'MEDIUM' ? 'warning' : 'error'}>
                  {mapping.confidence === 'HIGH' ? 'AI SUGGESTED' : mapping.confidence}
                </Badge>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            Required mappings: <strong>policy number, CATEGORY, first name, last name, and gender</strong>. 
            {extractedContext.facilityName ? ' Facility name was detected in the header.' : ' Facility name is required.'}
          </div>
          <Actions onBack={() => setStep('identify')} onNext={continueToClassify} />
        </Panel>
      )}

      {!isAnalyzing && step === 'classify' && <Panel title="Classify records" description="Review the classification rules before the system matches facilities and generates a record preview."><div className="grid gap-4 md:grid-cols-2"><Rule title="CATEGORY" text="Copied from the workbook as PRINCIPAL or DEPENDANT. It is never reconstructed from the policy number." /><Rule title="SECTOR" text="Derived from policy numbers containing /C/ (formal) or /D/ (informal). Unrecognized policy formats require review." /></div><div className="mt-5 flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800"><FileSpreadsheet className="h-5 w-5" /><span>{rawRows.length.toLocaleString()} source rows will be classified for period <strong>{period}</strong>.</span></div><Actions onBack={() => setStep('map')} onNext={startMatching} nextLabel="Match facilities" /></Panel>}

      {!isAnalyzing && step === 'match' && <Panel title="Match facilities" description="The Provider Directory is authoritative. Confirm ambiguous facilities before previewing the import."><div className="space-y-3">{matches.length === 0 ? <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">No provider names were found in the mapped rows.</div> : matches.map((match, index) => <div key={`${match.excelName}-${index}`} className="rounded-2xl border border-slate-100 p-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-start gap-3"><MapPin className="mt-0.5 h-4 w-4 text-slate-400" /><div><p className="font-semibold text-slate-900">{match.excelName}</p><p className="text-xs text-slate-500">{match.matchedProviderName || 'No confident Provider Directory match'}</p></div></div><Badge variant={match.status === 'confirmed' ? 'success' : match.candidates?.length ? 'warning' : 'error'}>{match.status === 'confirmed' ? `${match.matchType} match` : match.candidates?.length ? 'Manual review' : 'Unmatched'}</Badge></div>{match.candidates && match.candidates.length > 0 && match.status !== 'confirmed' && <select className="mt-3 w-full rounded-xl border-slate-200 text-sm" value="" onChange={event => resolveMatch(index, event.target.value)}><option value="">Select the authoritative facility...</option>{match.candidates.map(candidate => <option key={candidate.id} value={candidate.id}>{candidate.name} ({candidate.code})</option>)}</select>}</div>)}</div><div className="mt-5 grid gap-3 sm:grid-cols-3"><Info label="Matched" value={String(matchSummary.matched)} /><Info label="Ambiguous" value={String(matchSummary.ambiguous)} /><Info label="Unmatched" value={String(matchSummary.unmatched)} /></div><Actions onBack={() => setStep('classify')} onNext={generatePreview} nextLabel="Generate preview" /></Panel>}

      {!isAnalyzing && step === 'preview' && <Panel title="Validate and preview" description="Only valid, matched, non-duplicate records are eligible for commit."><div className="grid gap-3 sm:grid-cols-4"><Info label="Source rows" value={String(rawRows.length)} /><Info label="Ready" value={String(readyToImport)} /><Info label="Duplicates" value={String(duplicateRecords.length)} /><Info label="Review required" value={String(recordsRequiringReview.length)} /></div>{duplicateWarning && !duplicateAcknowledged && <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><p className="font-bold">Potential duplicate dataset detected</p><p className="mt-1">An enrolment batch already exists for {period} and overlaps the selected facilities.</p><div className="mt-3 space-y-1 text-xs">{duplicateWarning.slice(0, 3).map(batch => <p key={batch.id}><span className="font-semibold">{batch.fileName}</span> · {batch.importedRows.toLocaleString()} records · uploaded {new Date(batch.uploadedAt).toLocaleDateString()}</p>)}</div><div className="mt-4 flex flex-wrap items-center gap-2"><Button variant="secondary" className="py-2" onClick={reset}>Cancel import</Button><Button className="py-2" onClick={() => { setDuplicateAcknowledged(true); setErrorMessage(''); }}>Import only new records</Button><Link className="text-sm font-semibold text-amber-900 underline" to="/financial/history">Review import history</Link></div></div>}{validationErrors.length > 0 && <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><p className="font-semibold">Resolve validation issues before commit</p><ul className="mt-2 max-h-40 list-disc space-y-1 overflow-auto pl-5">{validationErrors.slice(0, 30).map(error => <li key={error}>{error}</li>)}</ul></div>}<div className="mt-5 overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Policy number</th>
                  <th className="px-4 py-3">Beneficiary</th>
                  <th className="px-4 py-3">Age</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Sector</th>
                  <th className="px-4 py-3">Facility (Matched)</th>
                  <th className="px-4 py-3">Match</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {normalizedRecords.slice(0, 20).map(record => {
                  const match = matches.find(m => m.excelName.toLowerCase() === record.metadata?.sourceProviderName?.toLowerCase()) || matches[0];
                  const confidence = match?.confidence ? Math.round(match.confidence * 100) : 0;
                  
                  return (
                    <tr key={record.id}>
                      <td className="px-4 py-3 font-mono text-xs">{record.policyNumber || 'Missing'}</td>
                      <td className="px-4 py-3 font-semibold">{record.firstName} {record.lastName}</td>
                      <td className="px-4 py-3">{record.age || '-'}</td>
                      <td className="px-4 py-3 capitalize">{record.category}</td>
                      <td className="px-4 py-3 capitalize">{record.sector}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">{record.providerName}</span>
                          {record.providerId && <span className="text-[10px] font-mono text-slate-400">{record.providerId}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {confidence > 0 ? (
                          <span className={`font-bold ${confidence >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>{confidence}%</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={record.recordStatus === 'valid' ? 'success' : record.recordStatus === 'duplicate' ? 'warning' : 'error'}>
                          {record.recordStatus === 'valid' ? '✓ Matched' : record.recordStatus}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div><Actions onBack={() => setStep('match')} onNext={handleCommit} nextLabel={liveCommitUnavailable ? 'Secure workflow required' : createBatch.isPending ? 'Committing...' : 'Commit valid records'} disabled={liveCommitUnavailable || createBatch.isPending || readyToImport === 0 || validationErrors.length > 0 || (duplicateWarning !== null && !duplicateAcknowledged)} /></Panel>}

      {!isAnalyzing && step === 'commit' && <Panel title="Import committed" description="The normalized enrollee records are now available to the Population & Enrolment register and analytics."><div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-sm text-emerald-800"><CheckCircle2 className="inline h-5 w-5 align-text-bottom" /> {commitMessage}</div><div className="mt-5 flex flex-wrap gap-3"><Button onClick={reset}><RefreshCcw className="mr-2 h-4 w-4" /> Upload another list</Button><Button variant="secondary" onClick={() => window.location.href = '/population/enrolment'}>Open Population Overview</Button></div></Panel>}
    </div>
  );
}

function Panel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold text-slate-900">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p><div className="mt-6">{children}</div></section>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-2 break-words text-lg font-bold text-slate-900">{value}</p></div>;
}

function Rule({ title, text }: { title: string; text: string }) {
  return <div className="rounded-2xl border border-slate-100 p-5"><p className="text-xs font-bold uppercase tracking-wider text-brand-blue">{title}</p><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></div>;
}

function Actions({ onBack, onNext, nextLabel = 'Continue', disabled = false }: { onBack?: () => void; onNext: () => void; nextLabel?: string; disabled?: boolean }) {
  return <div className="mt-7 flex items-center justify-between gap-3"><Button variant="secondary" onClick={onBack} disabled={!onBack}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button><Button onClick={onNext} disabled={disabled}>{nextLabel}<ArrowRight className="ml-2 h-4 w-4" /></Button></div>;
}
