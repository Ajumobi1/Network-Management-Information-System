import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  MapPin,
  RefreshCcw,
  Upload,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import { financialDataService } from '../../services/financial-data/financialDataService';
import { FinancialDataType, ColumnMapping, FinancialRecord, ProviderMatch } from '../../types/financial-data';
import { useCheckDuplicateBatch, useCreateImportBatch } from '../../hooks/financial-data/financialDataHooks';
import { useAuth } from '../../contexts/AuthContext';

type UploadStep = 'upload' | 'inspect' | 'map' | 'match' | 'preview' | 'commit';
type RawRow = Record<string, unknown>;

type MappingOption = {
  value: keyof FinancialRecord | 'ignored';
  label: string;
};

const workflowSteps: { key: UploadStep; label: string }[] = [
  { key: 'upload', label: 'Upload' }, { key: 'inspect', label: 'Inspect' }, { key: 'map', label: 'Map' },
  { key: 'match', label: 'Match' }, { key: 'preview', label: 'Preview' }, { key: 'commit', label: 'Commit' },
];

const mappingOptions: MappingOption[] = [
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
];

export default function DataUploadCentrePage() {
  const [step, setStep] = useState<UploadStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [sourceSheet, setSourceSheet] = useState('');
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<RawRow[]>([]);
  const [dataType, setDataType] = useState<FinancialDataType>('claims');
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [matches, setMatches] = useState<ProviderMatch[]>([]);
  const [normalizedRecords, setNormalizedRecords] = useState<FinancialRecord[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const { session } = useAuth();

  const createBatch = useCreateImportBatch();
  const detectedPeriod = normalizedRecords[0]?.period || '';
  const currentStepIndex = workflowSteps.findIndex(item => item.key === step);
  const { data: duplicateBatch } = useCheckDuplicateBatch(detectedPeriod, dataType);
  const lowConfidenceMappings = mappings.filter(mapping => mapping.nmisField !== 'ignored' && mapping.confidence === 'LOW' && !mapping.isCustom);
  const matchSummary = useMemo(() => ({
    matched: matches.filter(match => Boolean(match.matchedProviderId) && match.status === 'confirmed').length,
    ambiguous: matches.filter(match => Boolean(match.matchedProviderId) && match.status !== 'confirmed').length,
    unmatched: matches.filter(match => !match.matchedProviderId).length,
  }), [matches]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    setErrorMessage('');
    setCommitMessage('');
    setFile(selectedFile);
    setIsAnalyzing(true);

    try {
      const workbook = XLSX.read(await selectedFile.arrayBuffer(), { type: 'array', cellDates: true });
      const names = workbook.SheetNames;
      const firstSheet = names[0];
      if (!firstSheet) throw new Error('The workbook does not contain a readable worksheet.');
      const sheet = workbook.Sheets[firstSheet];
      const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
      const detectedHeaders = (matrix[0] ?? []).map(value => String(value).trim()).filter(Boolean);
      const rows = XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: '', raw: false });
      if (detectedHeaders.length === 0 || rows.length === 0) throw new Error('The selected worksheet has no readable header row and data rows.');

      setSheetNames(names);
      setSourceSheet(firstSheet);
      setHeaders(detectedHeaders);
      setRawRows(rows);
      setDataType(financialDataService.detectDataType(detectedHeaders));
      setMappings(financialDataService.suggestMappings(detectedHeaders));
      setStep('inspect');
    } catch (error) {
      setFile(null);
      setErrorMessage(error instanceof Error ? error.message : 'The workbook could not be inspected.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateMapping = (index: number, value: keyof FinancialRecord | 'ignored') => {
    setMappings(current => current.map((mapping, mappingIndex) => mappingIndex === index
      ? { ...mapping, nmisField: value, confidence: 'HIGH', confidenceScore: 1, isCustom: true }
      : mapping));
  };

  const startMatching = async () => {
    setIsAnalyzing(true);
    setErrorMessage('');
    try {
      const providerField = mappings.find(mapping => mapping.nmisField === 'providerName')?.excelField;
      const codeField = mappings.find(mapping => mapping.nmisField === 'providerCode')?.excelField;
      const lgaField = mappings.find(mapping => mapping.nmisField === 'lga')?.excelField;
      const stateField = mappings.find(mapping => mapping.nmisField === 'state')?.excelField;
      if (!providerField) throw new Error('Map a provider/facility name before matching entities.');

      const uniqueProviders = new Map<string, { name: string; code?: string; lga?: string; state?: string }>();
      rawRows.forEach(row => {
        const name = String(row[providerField] ?? '').trim();
        if (!name) return;
        const key = `${name.toLowerCase()}|${String(row[codeField ?? ''] ?? '').toLowerCase()}`;
        uniqueProviders.set(key, {
          name,
          code: codeField ? String(row[codeField] ?? '').trim() || undefined : undefined,
          lga: lgaField ? String(row[lgaField] ?? '').trim() || undefined : undefined,
          state: stateField ? String(row[stateField] ?? '').trim() || undefined : undefined,
        });
      });
      const results = await Promise.all([...uniqueProviders.values()].map(provider => financialDataService.matchProvider(provider.name, provider.code, provider.lga, provider.state)));
      setMatches(results);
      setStep('match');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Provider matching could not be completed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generatePreview = () => {
    setErrorMessage('');
    const rawRecords = financialDataService.normalizeData(rawRows, mappings, dataType, 'pending-batch', file?.name || 'unknown.xlsx', sourceSheet);
    const matchByName = new Map(matches.map(match => [match.excelName.toLowerCase().trim(), match]));
    const errors: string[] = [];
    const records = rawRecords.map(record => {
      const match = matchByName.get(record.providerName?.toLowerCase().trim());
      const resolvedRecord = { ...record };
      if (match?.status === 'confirmed' && match.matchedProviderId) {
        resolvedRecord.providerId = match.matchedProviderId;
        resolvedRecord.providerName = match.matchedProviderName || resolvedRecord.providerName;
        resolvedRecord.providerCode = match.matchedProviderCode || resolvedRecord.providerCode;
      } else {
        resolvedRecord.recordStatus = 'match-review-required';
        errors.push(`Source row ${record.sourceRow ?? '?'} requires provider matching review before import.`);
      }
      if (!record.providerName?.trim()) errors.push(`Source row ${record.sourceRow ?? '?'} is missing a provider/facility name.`);
      if (dataType === 'claims' && !Number.isFinite(record.netAmountPaid ?? record.amountPaid ?? record.amountApproved ?? record.amountClaimed ?? record.amountSubmitted ?? 0)) errors.push(`Source row ${record.sourceRow ?? '?'} has no valid claims amount.`);
      return resolvedRecord;
    });
    setValidationErrors(errors);
    setNormalizedRecords(records);
    setStep('preview');
  };

  const duplicateRecordCount = new Set(normalizedRecords.map(record => record.fingerprint).filter(Boolean)).size < normalizedRecords.length ? normalizedRecords.length - new Set(normalizedRecords.map(record => record.fingerprint).filter(Boolean)).size : 0;
  const validRecords = normalizedRecords.filter(record => record.recordStatus !== 'error' && record.recordStatus !== 'match-review-required' && !record.validationErrors?.length);
  const readyToImport = Math.max(validRecords.length - duplicateRecordCount, 0);

  const handleCommit = async () => {
    if (!file || validRecords.length === 0 || validationErrors.length > 0) return;
    if (duplicateBatch) {
      setErrorMessage('This dataset appears to have already been imported. Review the existing import before committing again.');
      return;
    }

    try {
      const batch = await createBatch.mutateAsync({
        batch: {
          fileName: file.name,
          dataType,
          totalRows: rawRows.length,
          importedRows: readyToImport,
          warningRows: matchSummary.ambiguous,
          errorRows: normalizedRecords.length - validRecords.length,
          duplicateRows: duplicateRecordCount,
          unmatchedProviders: matchSummary.unmatched,
          status: 'imported',
          uploadedBy: session?.user.email || 'Super Admin',
          periodCovered: detectedPeriod,
          metadata: { sourceSheet, headers, fileSize: file.size, matchedProviders: matchSummary.matched, ambiguousProviders: matchSummary.ambiguous },
        },
        records: validRecords,
        actor: session?.user ? { id: session.user.id, email: session.user.email } : undefined,
      });
      setCommitMessage(`Import committed successfully as ${batch.id}. ${readyToImport.toLocaleString()} records are now available in the ${dataType} register.`);
      setStep('commit');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'The dataset could not be committed.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Financial management" title="Data Upload Centre" subtitle="Upload, inspect, map, validate, match, preview, and commit processed financial workbooks." />
      <div className="nmis-panel overflow-x-auto p-2"><div className="flex min-w-max items-center justify-center gap-1">{workflowSteps.map((item, index) => <React.Fragment key={item.key}><StepIndicator active={index <= currentStepIndex} current={step === item.key} number={String(index + 1)} label={item.label} />{index < workflowSteps.length - 1 && <div className="h-px w-3 shrink-0 bg-brand-border" />}</React.Fragment>)}</div></div>

      {errorMessage && <div className="flex items-start gap-3 rounded-card border border-status-error/20 bg-status-errorSoft p-4 text-sm text-status-error"><AlertCircle className="h-5 w-5 shrink-0" /><p>{errorMessage}</p></div>}
      {commitMessage && <div className="flex items-start gap-3 rounded-card border border-status-success/20 bg-status-successSoft p-4 text-sm text-status-success"><CheckCircle2 className="h-5 w-5 shrink-0" /><p>{commitMessage}</p></div>}

      {isAnalyzing && <div className="nmis-panel flex flex-col items-center justify-center py-24 text-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-brand-blue" /><h3 className="mt-6 text-lg font-semibold text-slate-900">Processing workbook...</h3><p className="mt-2 text-slate-500">Reading workbook structure and preparing the next workflow stage.</p></div>}

      {!isAnalyzing && step === 'upload' && <UploadPanel onFileUpload={handleFileUpload} />}
      {!isAnalyzing && step === 'inspect' && file && <InspectPanel file={file} sheetNames={sheetNames} sourceSheet={sourceSheet} headers={headers} rowCount={rawRows.length} dataType={dataType} onSheetChange={setSourceSheet} onDataTypeChange={value => setDataType(value)} onContinue={() => setStep('map')} />}
      {!isAnalyzing && step === 'map' && <MappingPanel mappings={mappings} lowConfidenceCount={lowConfidenceMappings.length} onUpdate={updateMapping} onBack={() => setStep('inspect')} onContinue={startMatching} />}
      {!isAnalyzing && step === 'match' && <MatchingPanel matches={matches} summary={matchSummary} onResolveMatch={async (index, candidateId) => {
        const match = matches[index];
        const candidate = match.candidates?.find(item => item.id === candidateId);
        if (candidate) {
          const resolvedMatch: ProviderMatch = { ...match, matchedProviderId: candidate.id, matchedProviderName: candidate.name, matchedProviderCode: candidate.code, confidence: 1, matchType: 'manual', status: 'confirmed' };
          setMatches(current => current.map((m, i) => i === index ? resolvedMatch : m));
          // Persist the resolution
          try {
            await financialDataService.resolveMatch(resolvedMatch);
          } catch (err) {
            console.error('Failed to persist match resolution:', err);
          }
        }
      }} onBack={() => setStep('map')} onContinue={generatePreview} />}
      {!isAnalyzing && step === 'preview' && <PreviewPanel records={normalizedRecords} rawRowCount={rawRows.length} validCount={validRecords.length} invalidCount={normalizedRecords.length - validRecords.length} duplicateCount={duplicateRecordCount} matchSummary={matchSummary} readyCount={readyToImport} duplicateBatch={duplicateBatch} validationErrors={validationErrors} onBack={() => setStep('match')} onCommit={handleCommit} isCommitting={createBatch.isPending} />}
      {!isAnalyzing && step === 'commit' && <CommitPanel onReset={() => { setStep('upload'); setFile(null); setRawRows([]); setNormalizedRecords([]); setMatches([]); setCommitMessage(''); }} />}
    </div>
  );
}

function UploadPanel({ onFileUpload }: { onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void }) {
  return <Card className="border-2 border-dashed border-brand-border p-12 text-center transition hover:border-brand-blue/50 sm:p-16"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-brand-blue"><Upload size={32} /></div><h3 className="mt-6 text-xl font-bold text-slate-900">Upload a processed financial workbook</h3><p className="mx-auto mt-2 max-w-xl text-slate-500">Supported formats: XLSX, XLS, and CSV. The first worksheet is inspected by default and can be changed during the inspection step.</p><label className="mt-8 inline-flex cursor-pointer items-center justify-center rounded-3xl bg-brand-blue px-8 py-3 text-sm font-semibold text-white hover:bg-brand-navy"><input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={onFileUpload} />Select File</label></Card>;
}

function InspectPanel({ file, sheetNames, sourceSheet, headers, rowCount, dataType, onSheetChange, onDataTypeChange, onContinue }: { file: File; sheetNames: string[]; sourceSheet: string; headers: string[]; rowCount: number; dataType: FinancialDataType; onSheetChange: (value: string) => void; onDataTypeChange: (value: FinancialDataType) => void; onContinue: () => void }) {
  return <div className="grid gap-6 lg:grid-cols-3"><div className="rounded-3xl border border-slate-200 bg-white p-8 lg:col-span-2"><h3 className="flex items-center gap-2 text-lg font-bold text-slate-900"><FileSpreadsheet className="h-5 w-5 text-emerald-600" />Workbook inspection</h3><div className="mt-8 grid gap-8 sm:grid-cols-2"><div className="space-y-4"><InfoRow label="Filename" value={file.name} /><InfoRow label="Size" value={`${(file.size / 1024).toFixed(1)} KB`} /><InfoRow label="Rows detected" value={rowCount.toLocaleString()} /><InfoRow label="Columns found" value={headers.length.toLocaleString()} /><InfoRow label="Detected headers" value={headers.join(', ')} /></div><div className="space-y-4"><label className="block text-sm font-bold text-slate-900">Worksheet<select className="mt-2 w-full rounded-xl border-slate-200 py-3 text-sm font-normal" value={sourceSheet} onChange={event => onSheetChange(event.target.value)}>{sheetNames.map(sheet => <option key={sheet}>{sheet}</option>)}</select></label><label className="block text-sm font-bold text-slate-900">Financial data type<select className="mt-2 w-full rounded-xl border-slate-200 py-3 text-sm font-normal" value={dataType} onChange={event => onDataTypeChange(event.target.value as FinancialDataType)}><option value="claims">Claims Data</option><option value="capitation">Capitation Data</option><option value="ffs">Fee-for-Service (FFS)</option><option value="enrolment">Enrolment Data</option></select></label><p className="text-xs italic text-slate-500">The suggested type is based on the detected headers and can be corrected before mapping.</p></div></div></div><div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-slate-50 p-8"><div><h4 className="font-bold text-slate-900">Next action</h4><p className="mt-2 text-sm text-slate-500">Review and adjust the suggested mappings before provider matching.</p></div><Button variant="primary" className="w-full py-4" onClick={onContinue}>Continue to mapping</Button></div></div>;
}

function MappingPanel({ mappings, lowConfidenceCount, onUpdate, onBack, onContinue }: { mappings: ColumnMapping[]; lowConfidenceCount: number; onUpdate: (index: number, value: keyof FinancialRecord | 'ignored') => void; onBack: () => void; onContinue: () => void }) {
  return <div className="space-y-6"><div className="overflow-hidden rounded-3xl border border-slate-200 bg-white"><div className="border-b border-slate-100 bg-slate-50/50 px-8 py-5"><h3 className="font-bold text-slate-900">Column mapping</h3><p className="text-sm text-slate-500">Low-confidence suggestions require a deliberate manual mapping before continuing.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left text-sm"><thead className="bg-slate-50/50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-8 py-4">Workbook header</th><th className="px-8 py-4">NMIS target field</th><th className="px-8 py-4">Confidence</th><th className="px-8 py-4">Method</th></tr></thead><tbody className="divide-y divide-slate-100">{mappings.map((mapping, index) => <tr key={`${mapping.excelField}-${index}`}><td className="px-8 py-5 font-semibold text-slate-700">{mapping.excelField}</td><td className="px-8 py-5"><select className="rounded-xl border-slate-200 text-sm" value={mapping.nmisField} onChange={event => onUpdate(index, event.target.value as keyof FinancialRecord | 'ignored')}>{mappingOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></td><td className="px-8 py-5">{mapping.nmisField !== 'ignored' && <Badge variant={mapping.confidence === 'HIGH' ? 'success' : mapping.confidence === 'MEDIUM' ? 'warning' : 'error'}>{mapping.confidence}</Badge>}</td><td className="px-8 py-5 text-xs text-slate-500">{mapping.isCustom ? 'Manual override' : `${Math.round(mapping.confidenceScore * 100)}% suggestion`}</td></tr>)}</tbody></table></div></div><div className="flex items-center justify-between gap-4"><p className="text-sm text-slate-500">{lowConfidenceCount > 0 ? `${lowConfidenceCount} low-confidence mapping(s) need review.` : 'All active mappings have been reviewed.'}</p><div className="flex gap-3"><Button variant="secondary" className="px-8" onClick={onBack}>Back</Button><Button variant="primary" className="px-10 py-4" disabled={lowConfidenceCount > 0} onClick={onContinue}>Continue to entity matching</Button></div></div></div>;
}

function MatchingPanel({ matches, summary, onResolveMatch, onBack, onContinue }: { matches: ProviderMatch[]; summary: { matched: number; ambiguous: number; unmatched: number }; onResolveMatch: (index: number, candidateId: string) => void; onBack: () => void; onContinue: () => void }) {
  return <div className="space-y-6"><div className="grid gap-4 sm:grid-cols-3"><PreviewStat label="Matched" value={summary.matched} color="text-emerald-600" /><PreviewStat label="Ambiguous" value={summary.ambiguous} color="text-amber-600" /><PreviewStat label="Unmatched" value={summary.unmatched} color="text-rose-600" /></div><div className="overflow-hidden rounded-3xl border border-slate-200 bg-white"><div className="border-b border-slate-100 bg-slate-50/50 px-8 py-5"><h3 className="font-bold text-slate-900">Provider entity matching</h3><p className="text-sm text-slate-500">Matches are linked to the existing Provider Directory. Uncertain matches remain visible for review.</p></div><div className="divide-y divide-slate-100">{matches.map((match, index) => <div key={`${match.excelName}-${index}`} className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-center gap-5"><div><p className="text-xs font-bold uppercase text-slate-400">Uploaded as</p><p className="font-bold text-slate-900">{match.excelName}</p></div><ArrowRight className="hidden h-5 w-5 text-slate-300 lg:block" />{match.matchedProviderId ? <div><p className="text-xs font-bold uppercase text-brand-blue">NMIS entity</p><p className="font-bold text-slate-900">{match.matchedProviderName}</p><p className="text-xs text-slate-500">{match.matchedProviderCode}</p></div> : <div className="rounded-xl bg-rose-50 px-4 py-2 text-rose-600"><p className="text-xs font-bold">UNMATCHED</p></div>}</div>{match.candidates && match.candidates.length > 0 && match.status !== 'confirmed' && <select aria-label={`Resolve ${match.excelName}`} className="rounded-xl border-slate-200 text-xs" value="" onChange={event => onResolveMatch(index, event.target.value)}><option value="">Select candidate</option>{match.candidates.map(candidate => <option key={candidate.id} value={candidate.id}>{candidate.name} ({candidate.code})</option>)}</select>}<Badge variant={match.status === 'confirmed' ? 'success' : match.matchedProviderId ? 'warning' : 'error'}>{match.status === 'confirmed' ? 'MATCHED' : match.matchedProviderId ? 'AMBIGUOUS' : 'UNMATCHED'}</Badge></div>)}</div></div><div className="flex justify-end gap-3"><Button variant="secondary" className="px-8" onClick={onBack}>Back</Button><Button variant="primary" className="px-10 py-4" onClick={onContinue}>Continue to preview</Button></div></div>;
}

function PreviewPanel({ records, rawRowCount, validCount, invalidCount, duplicateCount, matchSummary, readyCount, duplicateBatch, validationErrors, onBack, onCommit, isCommitting }: { records: FinancialRecord[]; rawRowCount: number; validCount: number; invalidCount: number; duplicateCount: number; matchSummary: { matched: number; ambiguous: number; unmatched: number }; readyCount: number; duplicateBatch: { id: string; fileName: string; periodCovered?: string; dataType: FinancialDataType } | null | undefined; validationErrors: string[]; onBack: () => void; onCommit: () => void; isCommitting: boolean }) {
  return <div className="space-y-6"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7"><PreviewStat label="Total rows" value={rawRowCount} /><PreviewStat label="Valid" value={validCount} color="text-emerald-600" /><PreviewStat label="Invalid" value={invalidCount} color="text-rose-600" /><PreviewStat label="Duplicates" value={duplicateCount} color="text-amber-600" /><PreviewStat label="Matched" value={matchSummary.matched} color="text-emerald-600" /><PreviewStat label="Ambiguous / unmatched" value={matchSummary.ambiguous + matchSummary.unmatched} color="text-amber-600" /><PreviewStat label="Ready to import" value={readyCount} color="text-brand-blue" /></div>{duplicateBatch && <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800"><AlertCircle className="h-5 w-5 shrink-0" /><div><p className="font-bold">This dataset appears to have already been imported.</p><p className="mt-1 text-sm">Existing batch: {duplicateBatch.fileName} ({duplicateBatch.periodCovered || 'period unavailable'}). Do not silently overwrite historical financial records.</p></div></div>}{validationErrors.length > 0 && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700"><p className="font-bold">Validation exceptions</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{validationErrors.slice(0, 8).map(error => <li key={error}>{error}</li>)}</ul></div>}<div className="overflow-hidden rounded-3xl border border-slate-200 bg-white"><div className="border-b border-slate-100 bg-slate-50/50 px-8 py-5"><h3 className="font-bold text-slate-900">Normalized record preview</h3><p className="text-sm text-slate-500">Showing the first {Math.min(records.length, 10)} normalized records with source traceability.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-6 py-4">Provider</th><th className="px-6 py-4">Period</th><th className="px-6 py-4">Category</th><th className="px-6 py-4 text-right">Claim count</th><th className="px-6 py-4 text-right">Net paid</th><th className="px-6 py-4">Source row</th></tr></thead><tbody className="divide-y divide-slate-100">{records.slice(0, 10).map(record => <tr key={record.id}><td className="px-6 py-4 font-semibold">{record.providerName || 'Unmatched provider'}</td><td className="px-6 py-4">{record.period}</td><td className="px-6 py-4">{record.claimsCategory || record.dataType}</td><td className="px-6 py-4 text-right">{record.claimCount ?? record.encounterCount ?? '-'}</td><td className="px-6 py-4 text-right font-bold">{formatNaira(record.netAmountPaid ?? record.amountPaid ?? record.amountApproved ?? record.amount ?? 0)}</td><td className="px-6 py-4 text-slate-500">{record.sourceRow ?? '-'}</td></tr>)}</tbody></table></div></div><div className="flex justify-end gap-3"><Button variant="secondary" className="px-8" onClick={onBack}>Back</Button><Button variant="primary" className="px-10 py-4" disabled={isCommitting || readyCount <= 0 || validationErrors.length > 0 || Boolean(duplicateBatch)} onClick={onCommit}>{isCommitting ? 'Committing...' : duplicateBatch ? 'Duplicate import blocked' : 'Commit approved dataset'}</Button></div></div>;
}

function CommitPanel({ onReset }: { onReset: () => void }) { return <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-12 text-center"><CheckCircle2 className="mx-auto h-16 w-16 text-emerald-600" /><h2 className="mt-5 text-2xl font-black text-emerald-900">Dataset committed</h2><p className="mx-auto mt-2 max-w-xl text-emerald-800">The normalized records are available to the relevant Financial Data register and analytics queries. The original file and import batch remain traceable.</p><Button variant="primary" className="mt-8" onClick={onReset}>Upload another dataset</Button></div>; }
function StepIndicator({ active, current, number, label }: { active: boolean; current: boolean; number: string; label: string }) { return <div className={`flex shrink-0 items-center gap-2 rounded-control px-2 py-1.5 text-xs font-bold ${current ? 'bg-brand-blue text-white shadow-sm' : active ? 'text-brand-blue' : 'text-brand-muted'}`}><span className={`flex h-7 w-7 items-center justify-center rounded-full ${current ? 'bg-white/20' : active ? 'bg-brand-blue/10' : 'bg-brand-surface'}`}>{number}</span><span>{label}</span></div>; }
function InfoRow({ label, value }: { label: string; value: string }) { return <div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 break-words text-sm font-semibold text-slate-700">{value}</p></div>; }
function PreviewStat({ label, value, color = 'text-slate-900' }: { label: string; value: number | string; color?: string }) { return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className={`mt-2 text-2xl font-black ${color}`}>{value}</p></div>; }
function formatNaira(amount: number) { return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(Number.isFinite(amount) ? amount : 0); }
