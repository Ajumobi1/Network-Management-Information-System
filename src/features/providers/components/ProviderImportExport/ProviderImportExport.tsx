import { ChangeEvent, useRef, useState } from 'react';
import { Download, FileSpreadsheet, Loader2, Upload, XCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import Button from '../../../../components/ui/Button';
import { fetchProviderDirectory } from '../../../../services/providers/providersService';
import { useRegisterProvider } from '../../hooks';
import { ProviderDirectoryFilters, ProviderDirectoryItem } from '../../types';
import { ProviderCategory, ProviderOwnership, PROVIDER_CATEGORY_LABELS } from '../../../../constants/providerNetwork';

type ProviderImportExportProps = {
  filters?: ProviderDirectoryFilters;
};

type ImportSummary = {
  fileName: string;
  total: number;
  registered: number;
  skipped: number;
  errors: string[];
};

type ImportRow = Record<string, unknown>;

const normalizeKey = (value: unknown) => String(value ?? '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
const normalizeName = (value: unknown) => normalizeKey(value);
const textValue = (value: unknown) => String(value ?? '').trim();

const fieldAliases: Record<string, string[]> = {
  providerName: ['providername', 'facilityname', 'facility', 'provider', 'name'],
  providerCode: ['providercode', 'code', 'providerid'],
  category: ['providercategory', 'category', 'facilitytype', 'facilitycategory', 'type'],
  ownership: ['ownership', 'sector'],
  lga: ['lga', 'localgovernmentarea', 'localgovernment', 'localgovernmentauthority'],
  address: ['address', 'facilityaddress', 'physicaladdress'],
  contactPerson: ['contactperson', 'contact', 'officer', 'contactofficer'],
  phone: ['phone', 'phonenumber', 'telephone', 'contactphone'],
  email: ['email', 'emailaddress'],
  services: ['services', 'servicesoffered'],
};

function findValue(row: ImportRow, field: string): unknown {
  const aliases = fieldAliases[field] ?? [];
  const entry = Object.entries(row).find(([key]) => aliases.includes(normalizeKey(key)));
  return entry?.[1];
}

function normalizeCategory(value: unknown): ProviderCategory | null {
  const normalized = normalizeKey(value);
  const match: Record<string, ProviderCategory> = {
    hospital: ProviderCategory.Hospital,
    clinic: ProviderCategory.Hospital,
    primaryhealthcentrephc: ProviderCategory.Hospital,
    diagnosticcentre: ProviderCategory.DiagnosticCentre,
    diagnostic: ProviderCategory.DiagnosticCentre,
    laboratory: ProviderCategory.DiagnosticCentre,
    diagnosticimagingcentre: ProviderCategory.DiagnosticCentre,
    pharmacy: ProviderCategory.Pharmacy,
    opticalcentre: ProviderCategory.OpticalCentre,
    optical: ProviderCategory.OpticalCentre,
    dentalcentre: ProviderCategory.DentalCentre,
    dental: ProviderCategory.DentalCentre,
  };
  return match[normalized] ?? (Object.values(ProviderCategory).includes(String(value).toUpperCase() as ProviderCategory) ? String(value).toUpperCase() as ProviderCategory : null);
}

function normalizeOwnership(value: unknown): ProviderOwnership | null {
  const normalized = normalizeKey(value);
  if (normalized === 'government' || normalized === 'public') return ProviderOwnership.Government;
  if (normalized === 'private') return ProviderOwnership.Private;
  return null;
}

function parseServices(value: unknown): string[] {
  return textValue(value).split(/[,;|]/).map(item => item.trim()).filter(Boolean);
}

function csvCell(value: unknown) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadCsv(fileName: string, headers: string[], rows: unknown[][]) {
  const csv = [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function buildProviderPayload(row: ImportRow, rowNumber: number) {
  const providerName = textValue(findValue(row, 'providerName'));
  const category = normalizeCategory(findValue(row, 'category'));
  const ownership = normalizeOwnership(findValue(row, 'ownership'));
  const lga = textValue(findValue(row, 'lga'));

  if (!providerName) throw new Error(`Row ${rowNumber}: Provider Name is required.`);
  if (!category) throw new Error(`Row ${rowNumber}: Provider Category is missing or invalid.`);
  if (!ownership) throw new Error(`Row ${rowNumber}: Ownership must be Government or Private.`);
  if (!lga) throw new Error(`Row ${rowNumber}: LGA is required.`);

  return {
    providerName: providerName.toUpperCase(),
    category,
    subcategory: '',
    ownership,
    lga,
    state: 'Ondo',
    address: textValue(findValue(row, 'address')) || null,
    contactPerson: textValue(findValue(row, 'contactPerson')) || null,
    phone: textValue(findValue(row, 'phone')) || null,
    email: textValue(findValue(row, 'email')) || null,
    services: parseServices(findValue(row, 'services')),
  };
}

export default function ProviderImportExport({ filters }: ProviderImportExportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const directoryInputRef = useRef<HTMLInputElement>(null);
  const registerProvider = useRegisterProvider();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setSummary(null);
    try {
      const providers = await fetchProviderDirectory({
        ...(filters ?? {}),
        page: 1,
        pageSize: -1,
      } as ProviderDirectoryFilters);
      const headers = [
        'Provider Code',
        'Provider Name',
        'Provider Category',
        'Ownership',
        'LGA',
        'State',
        'Contact Person',
        'Phone',
        'Email',
        'Status',
        'Contract Status',
        'Credential Status',
        'Inspection Status',
        'Capitation Status',
        'Inspection Rating',
        'Last Inspection Date',
        'Services',
      ];
      const rows = providers.map(provider => [
        provider.providerCode,
        provider.providerName,
        PROVIDER_CATEGORY_LABELS[provider.category] ?? provider.category,
        provider.ownership,
        provider.lga,
        provider.state,
        provider.contactPerson,
        provider.phone,
        provider.email,
        provider.status,
        provider.contractStatus,
        provider.credentialStatus,
        provider.inspectionStatus,
        provider.capitationStatus,
        provider.inspectionRating,
        provider.lastInspectionDate,
        provider.services.join('; '),
      ]);
      downloadCsv(`odchc-provider-directory-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    } catch (error) {
      setSummary({ fileName: 'Export', total: 0, registered: 0, skipped: 0, errors: [error instanceof Error ? error.message : 'Provider directory export failed.'] });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;

    setIsImporting(true);
    setSummary(null);
    const errors: string[] = [];
    let total = 0;
    let registered = 0;
    let skipped = 0;

    try {
      const existing = await fetchProviderDirectory({
        search: '',
        status: 'all',
        contractStatus: 'all',
        credentialStatus: 'all',
        inspectionStatus: 'all',
        capitationStatus: 'all',
        lga: 'all',
        category: 'all',
        subcategory: 'all',
        ownership: 'all',
        service: 'all',
        page: 1,
        pageSize: -1,
      });
      const existingNames = new Set(existing.map(provider => normalizeName(provider.providerName)));
      const existingCodes = new Set(existing.map(provider => normalizeKey(provider.providerCode)));

      for (const file of files) {
        try {
          const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          if (!sheetName) {
            errors.push(`${file.name}: workbook has no worksheet.`);
            continue;
          }
          const rows = XLSX.utils.sheet_to_json<ImportRow>(workbook.Sheets[sheetName], { defval: '' });
          total += rows.length;
          for (let index = 0; index < rows.length; index += 1) {
            const rowNumber = index + 2;
            try {
              const payload = buildProviderPayload(rows[index], rowNumber);
              const sourceCode = normalizeKey(findValue(rows[index], 'providerCode'));
              const nameKey = normalizeName(payload.providerName);
              if (existingNames.has(nameKey) || (sourceCode && existingCodes.has(sourceCode))) {
                skipped += 1;
                continue;
              }
              await registerProvider.mutateAsync(payload as any);
              existingNames.add(nameKey);
              if (sourceCode) existingCodes.add(sourceCode);
              registered += 1;
            } catch (error) {
              errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Row could not be imported.'}`);
            }
          }
        } catch (error) {
          errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Workbook could not be read.'}`);
        }
      }

      setSummary({ fileName: files.length === 1 ? files[0].name : `${files.length} files`, total, registered, skipped, errors });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" multiple className="hidden" onChange={handleImport} />
      <input ref={directoryInputRef} type="file" accept=".xlsx,.xls,.csv" multiple className="hidden" {...({ webkitdirectory: '', directory: '' } as any)} onChange={handleImport} />
      <Button variant="secondary" className="gap-2" onClick={handleExport} disabled={isExporting || isImporting}>
        {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {isExporting ? 'Exporting…' : 'Export Directory'}
      </Button>
      <Button variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()} disabled={isImporting || isExporting}>
        {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {isImporting ? 'Importing…' : 'Import Files'}
      </Button>
      <Button variant="ghost" className="gap-2" onClick={() => directoryInputRef.current?.click()} disabled={isImporting || isExporting}>
        <FileSpreadsheet className="h-4 w-4" /> Import Folder
      </Button>
      {summary ? (
        <div className={`basis-full rounded-control border px-3 py-2 text-xs ${summary.errors.length > 0 ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
          <div className="flex items-center gap-2 font-semibold">
            {summary.errors.length > 0 ? <XCircle className="h-4 w-4" /> : <FileSpreadsheet className="h-4 w-4" />}
            {summary.fileName}: {summary.registered} registered, {summary.skipped} skipped as existing, {summary.errors.length} errors.
          </div>
          {summary.total > 0 ? <p className="mt-1">Rows scanned: {summary.total}.</p> : null}
          {summary.errors.length > 0 ? <p className="mt-1 max-w-3xl truncate">First issue: {summary.errors[0]}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
