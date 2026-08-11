import React, { useState, useCallback } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Search,
  Settings2,
  Table as TableIcon,
  ChevronDown,
  Building2,
  MapPin,
  RefreshCcw,
  Check
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { financialDataService } from '../../services/financial-data/financialDataService';
import { FinancialDataType, ColumnMapping, ProviderMatch, FinancialRecord } from '../../types/financial-data';
import { useCreateImportBatch } from '../../hooks/financial-data/financialDataHooks';

type UploadStep = 'upload' | 'inspect' | 'map' | 'match' | 'preview' | 'commit';

export default function DataUploadCentrePage() {
  const [step, setStep] = useState<UploadStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [dataType, setDataType] = useState<FinancialDataType>('claims');
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [matches, setMatches] = useState<ProviderMatch[]>([]);
  const [normalizedRecords, setNormalizedRecords] = useState<FinancialRecord[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const createBatch = useCreateImportBatch();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setIsAnalyzing(true);
      
      // Simulate real-world inspection
      setTimeout(() => {
        const dummyHeaders = ['S/N', 'Provider Name', 'HCP Code', 'LGA', 'State', 'Gross Claim', 'Approved Amount', 'Payment Date'];
        const suggestedType = financialDataService.detectDataType(dummyHeaders);
        const suggestedMappings = financialDataService.suggestMappings(dummyHeaders);
        
        setDataType(suggestedType);
        setMappings(suggestedMappings);
        setIsAnalyzing(false);
        setStep('inspect');
      }, 1500);
    }
  };

  const startMatching = async () => {
    setIsAnalyzing(true);
    // In a real app, we'd extract unique provider names from the file
    const uniqueExcelProviders = ['Lagos Med', 'Abuja PHC', 'Kano Specialist', 'Enugu General'];
    
    const matchResults = await Promise.all(
      uniqueExcelProviders.map(name => financialDataService.matchProvider(name))
    );
    
    setMatches(matchResults);
    setIsAnalyzing(false);
    setStep('match');
  };

  const generatePreview = () => {
    // Simulate normalization
    const dummyRows = Array.from({ length: 10 }).map((_, i) => ({
      'Provider Name': i % 2 === 0 ? 'Lagos Med' : 'Abuja PHC',
      'Gross Claim': 150000 + (i * 1000),
      'Approved Amount': 140000 + (i * 1000),
      'Payment Date': '2026-08-15'
    }));

    const records = financialDataService.normalizeData(
      dummyRows,
      mappings,
      dataType,
      'pending-batch',
      file?.name || 'unknown.xlsx'
    );

    setNormalizedRecords(records);
    setStep('preview');
  };

  const handleCommit = async () => {
    if (!file) return;
    
    await createBatch.mutateAsync({
      fileName: file.name,
      dataType,
      totalRows: normalizedRecords.length,
      importedRows: normalizedRecords.length,
      warningRows: 0,
      errorRows: 0,
      duplicateRows: 0,
      unmatchedProviders: matches.filter(m => m.status === 'pending').length,
      status: 'imported',
      uploadedBy: 'Super Admin'
    });
    
    setStep('commit');
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Data Upload Centre</h1>
          <p className="mt-1 text-slate-500">Professional financial data ingestion and normalization pipeline.</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-slate-100 p-1">
          <StepIndicator active={step === 'upload'} label="1" />
          <div className="h-px w-3 bg-slate-300" />
          <StepIndicator active={step === 'inspect'} label="2" />
          <div className="h-px w-3 bg-slate-300" />
          <StepIndicator active={step === 'map'} label="3" />
          <div className="h-px w-3 bg-slate-300" />
          <StepIndicator active={step === 'match'} label="4" />
          <div className="h-px w-3 bg-slate-300" />
          <StepIndicator active={step === 'preview'} label="5" />
          <div className="h-px w-3 bg-slate-300" />
          <StepIndicator active={step === 'commit'} label="6" />
        </div>
      </div>

      {isAnalyzing && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-brand-blue" />
          <h3 className="mt-6 text-lg font-semibold text-slate-900">Processing...</h3>
          <p className="mt-2 text-slate-500">Analyzing structures and matching entities.</p>
        </div>
      )}

      {!isAnalyzing && step === 'upload' && (
        <div className="rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-white p-12 text-center transition hover:border-brand-blue/50">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-brand-blue">
            <Upload size={32} />
          </div>
          <h3 className="mt-6 text-xl font-bold text-slate-900">Upload Financial Workbook</h3>
          <p className="mt-2 text-slate-500">Drag and drop your Excel file here, or click to browse.</p>
          <div className="mt-8 flex justify-center">
            <label className="cursor-pointer">
              <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
              <span className="inline-flex items-center justify-center rounded-3xl px-8 py-3 text-sm font-semibold transition bg-brand-blue text-white hover:bg-brand-navy">
                Select File
              </span>
            </label>
          </div>
        </div>
      )}

      {!isAnalyzing && step === 'inspect' && file && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 lg:col-span-2">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              Workbook Inspection
            </h3>
            <div className="mt-8 grid gap-8 sm:grid-cols-2">
              <div className="space-y-4">
                <InfoRow label="Filename" value={file.name} />
                <InfoRow label="Size" value={`${(file.size / 1024).toFixed(1)} KB`} />
                <InfoRow label="Rows Detected" value="1,284" />
                <InfoRow label="Columns Found" value="12" />
              </div>
              <div className="space-y-4">
                <p className="text-sm font-bold text-slate-900">Financial Data Type</p>
                <select 
                  className="w-full rounded-xl border-slate-200 py-3 focus:ring-brand-blue"
                  value={dataType}
                  onChange={(e) => setDataType(e.target.value as FinancialDataType)}
                >
                  <option value="claims">Claims Data</option>
                  <option value="capitation">Capitation Data</option>
                  <option value="ffs">Fee-for-Service (FFS)</option>
                  <option value="enrolment">Enrolment Data</option>
                </select>
                <p className="text-xs text-slate-500 italic">Auto-detected based on column headers.</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-slate-50 p-8">
            <div>
              <h4 className="font-bold text-slate-900">Next Action</h4>
              <p className="mt-2 text-sm text-slate-500">Proceed to map the Excel columns to the NMIS internal financial model.</p>
            </div>
            <Button variant="primary" className="w-full py-4" onClick={() => setStep('map')}>
              Continue to Mapping
            </Button>
          </div>
        </div>
      )}

      {!isAnalyzing && step === 'map' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 px-8 py-5">
              <h3 className="font-bold text-slate-900">Intelligent Column Mapping</h3>
              <p className="text-sm text-slate-500">Suggesting mappings based on historical patterns and normalization rules.</p>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-8 py-4 font-bold">Excel Header</th>
                  <th className="px-8 py-4 font-bold">NMIS Target Field</th>
                  <th className="px-8 py-4 font-bold">Confidence</th>
                  <th className="px-8 py-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mappings.map((mapping, i) => (
                  <tr key={i} className="group hover:bg-slate-50/50">
                    <td className="px-8 py-5 font-semibold text-slate-700">{mapping.excelField}</td>
                    <td className="px-8 py-5">
                      <select className="rounded-xl border-slate-200 text-sm focus:ring-brand-blue">
                        <option value="ignored">Ignore this column</option>
                        <option value="providerName" selected={mapping.nmisField === 'providerName'}>Provider Name</option>
                        <option value="providerCode" selected={mapping.nmisField === 'providerCode'}>Provider Code</option>
                        <option value="amountPaid" selected={mapping.nmisField === 'amountPaid'}>Paid Amount</option>
                        <option value="amountClaimed" selected={mapping.nmisField === 'amountClaimed'}>Claimed Amount</option>
                        <option value="reportingMonth" selected={mapping.nmisField === 'reportingMonth'}>Reporting Month</option>
                      </select>
                    </td>
                    <td className="px-8 py-5">
                      {mapping.nmisField !== 'ignored' && (
                        <Badge variant={mapping.confidence === 'HIGH' ? 'success' : mapping.confidence === 'MEDIUM' ? 'warning' : 'info'}>
                          {mapping.confidence}
                        </Badge>
                      )}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <Button variant="secondary" className="py-2 px-3 text-xs">Custom Rule</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-4">
            <Button variant="secondary" className="px-8" onClick={() => setStep('inspect')}>Back</Button>
            <Button variant="primary" className="px-10 py-4" onClick={startMatching}>Continue to Entity Matching</Button>
          </div>
        </div>
      )}

      {!isAnalyzing && step === 'match' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 px-8 py-5">
              <h3 className="font-bold text-slate-900">Provider Entity Matching</h3>
              <p className="text-sm text-slate-500">Linking uploaded facility names to the master NMIS Provider Directory.</p>
            </div>
            <div className="divide-y divide-slate-100">
              {matches.map((match, i) => (
                <div key={i} className="flex items-center justify-between p-8 hover:bg-slate-50/50">
                  <div className="flex items-center gap-6">
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase text-slate-400">Uploaded As</p>
                      <p className="font-bold text-slate-900">{match.excelName}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-300" />
                    {match.matchedProviderId ? (
                      <div className="space-y-1">
                        <p className="text-xs font-bold uppercase text-brand-blue">NMIS Entity</p>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900">{match.matchedProviderName}</p>
                          <Badge variant="success" className="text-[10px]">98% Confidence</Badge>
                        </div>
                        <p className="text-xs text-slate-500">{match.matchedProviderCode}</p>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-rose-50 px-4 py-2 text-rose-600">
                        <p className="text-xs font-bold">UNMATCHED</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {match.matchedProviderId ? (
                      <Button variant="secondary" className="py-2 px-4 text-xs">Change Match</Button>
                    ) : (
                      <Button variant="primary" className="py-2 px-4 text-xs">Select Provider</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-4">
            <Button variant="secondary" className="px-8" onClick={() => setStep('map')}>Back</Button>
            <Button variant="primary" className="px-10 py-4" onClick={generatePreview}>Continue to Preview</Button>
          </div>
        </div>
      )}

      {!isAnalyzing && step === 'preview' && (
        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <PreviewStat label="Total Records" value={normalizedRecords.length.toLocaleString()} />
            <PreviewStat label="Valid" value={normalizedRecords.length.toLocaleString()} color="text-emerald-600" />
            <PreviewStat label="Ambiguous Matches" value={matches.filter(m => m.status === 'pending').length} color="text-amber-600" />
            <PreviewStat label="Duplicate Warnings" value="0" color="text-slate-400" />
          </div>
          
          <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 px-8 py-5">
              <h3 className="font-bold text-slate-900">Normalization Preview</h3>
              <p className="text-sm text-slate-500">Reviewing verticalized and cleaned financial records before commit.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-8 py-4 font-bold">Provider</th>
                    <th className="px-8 py-4 font-bold">Period</th>
                    <th className="px-8 py-4 font-bold text-right">Amount</th>
                    <th className="px-8 py-4 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {normalizedRecords.slice(0, 5).map((record, i) => (
                    <tr key={i}>
                      <td className="px-8 py-5 font-semibold text-slate-900">{record.providerName}</td>
                      <td className="px-8 py-5 text-slate-500">{record.period}</td>
                      <td className="px-8 py-5 text-right font-bold text-slate-900">
                        ₦{(record.amountPaid || record.amount || 0).toLocaleString()}
                      </td>
                      <td className="px-8 py-5">
                        <Badge variant="success">Ready</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button variant="secondary" className="px-8" onClick={() => setStep('match')}>Back</Button>
            <Button variant="primary" className="px-12 py-5 text-lg" onClick={handleCommit}>Commit Import</Button>
          </div>
        </div>
      )}

      {!isAnalyzing && step === 'commit' && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 size={48} />
          </div>
          <h3 className="mt-8 text-2xl font-bold text-slate-900">Import Successful</h3>
          <p className="mt-4 max-w-md text-slate-500">
            {normalizedRecords.length} records have been normalized and imported into the NMIS financial data store.
          </p>
          <div className="mt-12 flex gap-4">
            <Button variant="secondary" className="px-8 py-3" onClick={() => window.location.href = '/financial/history'}>
              View Import History
            </Button>
            <Button variant="primary" className="px-8 py-3" onClick={() => setStep('upload')}>
              Upload Another File
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function StepIndicator({ active, label }: { active: boolean, label: string }) {
  return (
    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
      active ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/30' : 'bg-white text-slate-400'
    }`}>
      {label}
    </div>
  );
}

function InfoRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="font-medium text-slate-500">{label}</span>
      <span className="font-bold text-slate-900">{value}</span>
    </div>
  );
}

function PreviewStat({ label, value, color = "text-slate-900" }: any) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-black ${color}`}>{value}</p>
    </div>
  );
}
