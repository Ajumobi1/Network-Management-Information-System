import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ClipboardPenLine, Search } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { useCreateImportBatch } from '../../hooks/financial-data/financialDataHooks';
import { useProviderDirectory } from '../../features/providers/hooks';
import { ProviderDirectoryFilters } from '../../types/providers/providerTypes';
import { FinancialDataType, FinancialRecord } from '../../types/financial-data';
import { financialDataService } from '../../services/financial-data/financialDataService';
import { isSecureContractError } from '../../lib/security/secureContracts';

const providerFilters: ProviderDirectoryFilters = {
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
  page: 1,
  pageSize: 1000,
};

type Workflow = 'claims-ffs' | 'capitation';
type FormState = {
  providerId: string;
  year: string;
  month: string;
  claimsCategory: string;
  claimCount: string;
  amountSubmitted: string;
  amountClaimed: string;
  amountApproved: string;
  amountRejected: string;
  amountPaid: string;
  netAmountPaid: string;
  eligibleLives: string;
  capitationRate: string;
  capitationAmount: string;
};

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const claimsCategories = ['Outpatient', 'Inpatient', 'Pharmaceuticals', 'Diagnostics', 'Dental', 'Specialist Services'];

function toNumber(value: string): number | undefined {
  const parsed = Number(value.replace(/[₦,\s]/g, ''));
  return value.trim() === '' || !Number.isFinite(parsed) ? undefined : parsed;
}

function errorMessage(error: unknown): string {
  if (isSecureContractError(error)) return error.message;
  return error instanceof Error ? error.message : 'The manual financial entry could not be saved. Please try again.';
}

export default function FinancialManualEntryPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const workflow: Workflow = searchParams.get('type') === 'capitation' ? 'capitation' : 'claims-ffs';
  const dataType: FinancialDataType = workflow === 'capitation' ? 'capitation' : 'claims';
  const [providerSearch, setProviderSearch] = useState('');
  const [form, setForm] = useState<FormState>({
    providerId: '',
    year: String(new Date().getFullYear()),
    month: '',
    claimsCategory: '',
    claimCount: '',
    amountSubmitted: '',
    amountClaimed: '',
    amountApproved: '',
    amountRejected: '',
    amountPaid: '',
    netAmountPaid: '',
    eligibleLives: '',
    capitationRate: '',
    capitationAmount: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const createBatch = useCreateImportBatch();
  const providerQuery = useProviderDirectory(providerFilters);
  const providers = providerQuery.data ?? [];
  const visibleProviders = useMemo(() => {
    const query = providerSearch.trim().toLowerCase();
    if (!query) return providers;
    return providers.filter(provider => [provider.providerCode, provider.providerName, provider.lga].filter(Boolean).join(' ').toLowerCase().includes(query));
  }, [providerSearch, providers]);
  const selectedProvider = providers.find(provider => provider.id === form.providerId);

  const update = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm(previous => ({ ...previous, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const year = Number(form.year);
    const month = Number(form.month);
    if (!selectedProvider) {
      setError('Select an authoritative Provider Directory facility.');
      return;
    }
    if (!Number.isInteger(year) || year < 2025 || year > 2100 || !Number.isInteger(month) || month < 1 || month > 12) {
      setError('Enter a valid reporting year and month.');
      return;
    }

    const claimCount = toNumber(form.claimCount);
    const amountSubmitted = toNumber(form.amountSubmitted);
    const amountClaimed = toNumber(form.amountClaimed);
    const amountApproved = toNumber(form.amountApproved);
    const amountRejected = toNumber(form.amountRejected);
    const amountPaid = toNumber(form.amountPaid);
    const netAmountPaid = toNumber(form.netAmountPaid);
    const eligibleLives = toNumber(form.eligibleLives);
    const capitationRate = toNumber(form.capitationRate);
    const capitationAmount = toNumber(form.capitationAmount);

    if (workflow === 'claims-ffs' && [amountSubmitted, amountClaimed, amountApproved, amountRejected, amountPaid, netAmountPaid].every(value => value === undefined)) {
      setError('Enter at least one Claims/FFS monetary amount.');
      return;
    }
    if (workflow === 'capitation' && capitationAmount === undefined) {
      setError('Enter the Capitation amount for this provider and reporting period.');
      return;
    }
    if (claimCount !== undefined && (!Number.isInteger(claimCount) || claimCount < 0)) {
      setError('Claim count must be a whole number of zero or greater.');
      return;
    }
    if (eligibleLives !== undefined && (!Number.isInteger(eligibleLives) || eligibleLives < 0)) {
      setError('Eligible lives must be a whole number of zero or greater.');
      return;
    }

    const period = `${year}-${String(month).padStart(2, '0')}`;
    const now = new Date().toISOString();
    const record: FinancialRecord = {
      id: `manual-${crypto.randomUUID()}`,
      providerId: selectedProvider.id,
      providerCode: selectedProvider.providerCode,
      providerName: selectedProvider.providerName,
      facilityType: selectedProvider.category,
      ownership: selectedProvider.ownership,
      state: 'Ondo',
      lga: selectedProvider.lga,
      reportingYear: year,
      reportingMonth: month,
      period,
      dataType,
      claimsCategory: workflow === 'claims-ffs' ? (form.claimsCategory || undefined) : undefined,
      claimCount,
      amountSubmitted,
      amountClaimed,
      amountApproved,
      amountRejected,
      amountPaid: workflow === 'capitation' ? capitationAmount : amountPaid,
      netAmountPaid: workflow === 'capitation' ? capitationAmount : netAmountPaid,
      eligibleLives,
      capitationRate,
      grossAmount: workflow === 'capitation' ? capitationAmount : undefined,
      amount: workflow === 'capitation' ? capitationAmount : undefined,
      sourceFile: 'manual-financial-entry',
      importBatchId: 'pending',
      sourceRow: 1,
      recordStatus: 'valid',
      createdAt: now,
      updatedAt: now,
    };
    record.fingerprint = financialDataService.generateFingerprint(record);

    try {
      const result = await createBatch.mutateAsync({
        batch: {
          fileName: 'manual-financial-entry',
          dataType,
          uploadedBy: session?.user.email || 'NMIS user',
          totalRows: 1,
          importedRows: 0,
          warningRows: 0,
          errorRows: 0,
          duplicateRows: 0,
          unmatchedProviders: 0,
          status: 'processing',
          periodCovered: period,
          metadata: {
            entryMode: 'manual',
            workflow,
            providerId: selectedProvider.id,
            providerName: selectedProvider.providerName,
          },
        },
        records: [record],
        actor: session?.user.id && session.user.email ? { id: session.user.id, email: session.user.email } : undefined,
      });

      if (result.importedRows === 1) {
        setSuccess('Manual financial record saved successfully. The register will show the record after refresh.');
        window.setTimeout(() => navigate(workflow === 'capitation' ? '/financial/capitation' : '/financial/register'), 900);
      } else if (result.duplicateRows > 0) {
        setError('This provider already has a matching financial record for the selected period. No duplicate was created.');
      } else {
        setError(`The record was not imported. ${result.errorRows || 0} validation issue(s) were returned.`);
      }
    } catch (submissionError) {
      setError(errorMessage(submissionError));
    }
  };

  return (
    <main className="nmis-page">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Link to={workflow === 'capitation' ? '/financial/capitation' : '/financial/register'}>
            <Button variant="secondary" size="sm" className="gap-2"><ArrowLeft size={16} /> Back to register</Button>
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-muted"><ClipboardPenLine size={14} /> Manual financial entry</div>
        </div>

        <PageHeader
          eyebrow="Financial Management"
          title={workflow === 'capitation' ? 'Manual Capitation Entry' : 'Manual Claims/FFS Entry'}
          subtitle={workflow === 'capitation' ? 'Enter one Capitation financial record without uploading a workbook.' : 'Enter one Claims/FFS record without uploading a workbook. Claims, FFS, and Fee-for-Service use this same workflow.'}
        />

        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><p className="font-semibold">Entry could not be completed</p><p className="mt-1">{error}</p></div> : null}
        {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><p className="font-semibold">Saved</p><p className="mt-1">{success}</p></div> : null}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="space-y-6 p-6 sm:p-8">
            <div><h2 className="text-lg font-bold text-brand-foreground">Provider and reporting period</h2><p className="text-sm text-brand-muted">Select the authoritative provider and the exact month being entered. State is fixed to Ondo.</p></div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="nmis-label">Search Provider Directory</label>
                <div className="relative"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-subtle" /><Input value={providerSearch} onChange={event => setProviderSearch(event.target.value)} placeholder="Search by provider name, code, or LGA" className="pl-10" /></div>
              </div>
              <label className="sm:col-span-2"><span className="nmis-label">Provider *</span><select className="nmis-control" value={form.providerId} onChange={event => update('providerId', event.target.value)} disabled={providerQuery.isLoading || providerQuery.isError} required><option value="">{providerQuery.isLoading ? 'Loading facilities...' : providerQuery.isError ? 'Provider Directory unavailable' : 'Select a facility'}</option>{visibleProviders.map(provider => <option key={provider.id} value={provider.id}>{provider.providerCode} — {provider.providerName} ({provider.lga})</option>)}</select>{selectedProvider ? <Badge variant="success" className="mt-2">{selectedProvider.providerName} · {selectedProvider.lga}</Badge> : null}</label>
              <div><label className="nmis-label">Reporting year *</label><Input type="number" min="2025" max="2100" value={form.year} onChange={event => update('year', event.target.value)} required /></div>
              <label><span className="nmis-label">Reporting month *</span><select className="nmis-control" value={form.month} onChange={event => update('month', event.target.value)} required><option value="">Select month</option>{months.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}</select></label>
              <div><label className="nmis-label">State</label><Input value="Ondo" disabled className="bg-brand-surface text-brand-muted" /></div>
              <div><label className="nmis-label">LGA</label><Input value={selectedProvider?.lga || 'Select a provider'} disabled className="bg-brand-surface text-brand-muted" /></div>
            </div>
          </Card>

          {workflow === 'claims-ffs' ? (
            <Card className="space-y-6 p-6 sm:p-8">
              <div><h2 className="text-lg font-bold text-brand-foreground">Claims/FFS details</h2><p className="text-sm text-brand-muted">Claims, FFS, and Fee-for-Service are entered through the same financial record. Leave fields blank when the source does not provide them.</p></div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <label><span className="nmis-label">Claims category</span><select className="nmis-control" value={form.claimsCategory} onChange={event => update('claimsCategory', event.target.value)}><option value="">Uncategorised</option>{claimsCategories.map(category => <option key={category} value={category}>{category}</option>)}</select></label>
                <div><label className="nmis-label">Claim count</label><Input type="number" min="0" step="1" value={form.claimCount} onChange={event => update('claimCount', event.target.value)} /></div>
                <div><label className="nmis-label">Amount submitted</label><Input inputMode="decimal" value={form.amountSubmitted} onChange={event => update('amountSubmitted', event.target.value)} placeholder="₦0.00" /></div>
                <div><label className="nmis-label">Amount claimed</label><Input inputMode="decimal" value={form.amountClaimed} onChange={event => update('amountClaimed', event.target.value)} placeholder="₦0.00" /></div>
                <div><label className="nmis-label">Amount approved</label><Input inputMode="decimal" value={form.amountApproved} onChange={event => update('amountApproved', event.target.value)} placeholder="₦0.00" /></div>
                <div><label className="nmis-label">Amount rejected</label><Input inputMode="decimal" value={form.amountRejected} onChange={event => update('amountRejected', event.target.value)} placeholder="₦0.00" /></div>
                <div><label className="nmis-label">Amount paid</label><Input inputMode="decimal" value={form.amountPaid} onChange={event => update('amountPaid', event.target.value)} placeholder="₦0.00" /></div>
                <div><label className="nmis-label">Net amount paid</label><Input inputMode="decimal" value={form.netAmountPaid} onChange={event => update('netAmountPaid', event.target.value)} placeholder="₦0.00" /></div>
              </div>
            </Card>
          ) : (
            <Card className="space-y-6 p-6 sm:p-8">
              <div><h2 className="text-lg font-bold text-brand-foreground">Capitation details</h2><p className="text-sm text-brand-muted">Capitation remains separate from Claims/FFS. Enter the amount exactly as approved for the provider and reporting month.</p></div>
              <div className="grid gap-5 sm:grid-cols-3">
                <div><label className="nmis-label">Eligible lives</label><Input type="number" min="0" step="1" value={form.eligibleLives} onChange={event => update('eligibleLives', event.target.value)} /></div>
                <div><label className="nmis-label">Capitation rate</label><Input inputMode="decimal" value={form.capitationRate} onChange={event => update('capitationRate', event.target.value)} placeholder="₦0.00" /></div>
                <div><label className="nmis-label">Capitation amount *</label><Input inputMode="decimal" value={form.capitationAmount} onChange={event => update('capitationAmount', event.target.value)} placeholder="₦0.00" required /></div>
              </div>
            </Card>
          )}

          <div className="flex justify-end gap-3"><Link to={workflow === 'capitation' ? '/financial/capitation' : '/financial/register'}><Button type="button" variant="secondary">Cancel</Button></Link><Button type="submit" disabled={createBatch.isPending || providerQuery.isLoading}>{createBatch.isPending ? 'Saving record...' : 'Save financial record'}</Button></div>
        </form>
      </div>
    </main>
  );
}
