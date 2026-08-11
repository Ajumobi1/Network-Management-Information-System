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
  ChevronDown
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { financialDataService } from '../../services/financial-data/financialDataService';
import { FinancialDataType, ColumnMapping } from '../../types/financial-data';

type UploadStep = 'upload' | 'inspect' | 'map' | 'validate' | 'preview';

export default function DataUploadCentrePage() {
  const [step, setStep] = useState<UploadStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [dataType, setDataType] = useState<FinancialDataType>('claims');
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setIsAnalyzing(true);
      
      // Simulate workbook inspection
      setTimeout(() => {
        const dummyHeaders = ['S/N', 'PROVIDER', 'CATEGORY', 'CLAIMS AMOUNT', 'PAID AMOUNT', 'DATE PAID'];
        const suggestedType = financialDataService.detectDataType(dummyHeaders);
        const suggestedMappings = financialDataService.suggestMappings(dummyHeaders);
        
        setDataType(suggestedType);
        setMappings(suggestedMappings);
        setIsAnalyzing(false);
        setStep('inspect');
      }, 1500);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Data Upload Centre</h1>
          <p className="mt-1 text-slate-500">Ingest financial and claims data from Excel workbooks.</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-slate-100 p-1">
          <StepIndicator active={step === 'upload'} label="1" />
          <div className="h-px w-4 bg-slate-300" />
          <StepIndicator active={step === 'inspect'} label="2" />
          <div className="h-px w-4 bg-slate-300" />
          <StepIndicator active={step === 'map'} label="3" />
          <div className="h-px w-4 bg-slate-300" />
          <StepIndicator active={step === 'preview'} label="4" />
        </div>
      </div>

      {step === 'upload' && (
        <div className="rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-white p-12 text-center transition hover:border-brand-blue/50">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-brand-blue">
            <Upload size={32} />
          </div>
          <h3 className="mt-6 text-xl font-bold text-slate-900">Upload Financial Workbook</h3>
          <p className="mt-2 text-slate-500">Drag and drop your Excel file here, or click to browse.</p>
          <p className="mt-1 text-xs text-slate-400">Supported formats: .xlsx, .xls, .csv</p>
          
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

      {isAnalyzing && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-brand-blue" />
          <h3 className="mt-6 text-lg font-semibold text-slate-900">Analyzing Workbook...</h3>
          <p className="mt-2 text-slate-500">Inspecting sheets, headers, and data structures.</p>
        </div>
      )}

      {step === 'inspect' && file && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 lg:col-span-2">
              <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                Workbook Information
              </h3>
              <div className="mt-6 space-y-4">
                <InfoRow label="Filename" value={file.name} />
                <InfoRow label="File Size" value={`${(file.size / 1024).toFixed(1)} KB`} />
                <InfoRow label="Detected Sheets" value="July 2025, August 2025, Summary" />
                <div className="pt-4">
                  <p className="text-sm font-medium text-slate-500">Data Source Type</p>
                  <select 
                    className="mt-2 w-full rounded-xl border-slate-200 focus:ring-brand-blue"
                    value={dataType}
                    onChange={(e) => setDataType(e.target.value as FinancialDataType)}
                  >
                    <option value="claims">Claims Data</option>
                    <option value="capitation">Capitation Data</option>
                    <option value="ffs">Fee-for-Service (FFS)</option>
                    <option value="enrolment">Enrolment Data</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-blue-50/50 p-6">
              <h3 className="font-semibold text-slate-900">Analysis Summary</h3>
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Total Rows</span>
                  <span className="font-bold text-slate-900">1,284</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Headers Found</span>
                  <span className="font-bold text-slate-900">12</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Auto-Mapped</span>
                  <span className="font-bold text-emerald-600">8/12</span>
                </div>
              </div>
              <Button 
                variant="primary" 
                className="mt-8 w-full py-3"
                onClick={() => setStep('map')}
              >
                Continue to Mapping
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === 'map' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <h3 className="font-semibold text-slate-900">Intelligent Column Mapping</h3>
              <p className="text-xs text-slate-500">Map Excel headers to NMIS financial fields. Confidence scores based on header analysis.</p>
            </div>
            <div className="p-0">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Excel Header</th>
                    <th className="px-6 py-3 font-semibold">NMIS Field</th>
                    <th className="px-6 py-3 font-semibold">Confidence</th>
                    <th className="px-6 py-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mappings.map((mapping, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4 font-medium text-slate-700">{mapping.excelField}</td>
                      <td className="px-6 py-4">
                        <select 
                          className="rounded-lg border-slate-200 text-xs focus:ring-brand-blue"
                          value={mapping.nmisField}
                        >
                          <option value="ignored">Ignore this column</option>
                          <option value="providerName">Provider Name</option>
                          <option value="providerCode">Provider Code</option>
                          <option value="amountPaid">Paid Amount</option>
                          <option value="amountClaimed">Claimed Amount</option>
                          <option value="claimsCategory">Category</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        {mapping.nmisField !== 'ignored' && (
                          <Badge variant={mapping.confidence > 0.8 ? 'success' : 'warning'}>
                            {Math.round(mapping.confidence * 100)}% Match
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="secondary" className="py-2 px-3 text-xs">Adjust</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setStep('inspect')}>Back</Button>
            <Button variant="primary" onClick={() => setStep('preview')}>Review & Import</Button>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <PreviewStat label="Total Records" value="1,284" />
            <PreviewStat label="Valid" value="1,267" color="text-emerald-600" />
            <PreviewStat label="Warnings" value="14" color="text-amber-600" />
            <PreviewStat label="Errors" value="3" color="text-rose-600" />
          </div>
          
          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Import Preview</h3>
              <div className="flex gap-2">
                <Badge variant="warning">11 Duplicates Detected</Badge>
                <Badge variant="error">5 Unmatched Providers</Badge>
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-12 text-center text-slate-500">
              <TableIcon className="mx-auto mb-4 h-10 w-10 text-slate-300" />
              <p>Table preview showing normalized records will appear here.</p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setStep('map')}>Back</Button>
            <Button variant="primary" className="px-10 py-4">Confirm Import</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function StepIndicator({ active, label }: { active: boolean, label: string }) {
  return (
    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
      active ? 'bg-brand-blue text-white' : 'bg-white text-slate-400'
    }`}>
      {label}
    </div>
  );
}

function InfoRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function PreviewStat({ label, value, color = "text-slate-900" }: any) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
