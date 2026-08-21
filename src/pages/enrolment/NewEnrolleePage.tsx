import { useMemo, useState } from 'react';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import PageHeader from '../../components/ui/PageHeader';
import { useCreateEnrolmentImportBatch } from '../../hooks/enrolment/enrolmentHooks';
import { useProviderDirectory } from '../../features/providers/hooks';
import { useAuth } from '../../contexts/AuthContext';
import { buildEnrolleeFingerprint } from '../../services/enrolment/enrolmentService';
import { EnrolmentCategory, EnrolmentSector, EnrolleeRecord } from '../../types/enrolment/enrolmentTypes';
import { isSecureContractError } from '../../lib/security/secureContracts';
import { ProviderDirectoryFilters } from '../../types/providers/providerTypes';

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
  service: 'all',
  page: 1,
  pageSize: 1000,
};

type FormState = {
  policyNumber: string;
  category: EnrolmentCategory;
  firstName: string;
  lastName: string;
  gender: 'male' | 'female' | 'other';
  age: string;
  providerId: string;
  reportingYear: string;
  reportingMonth: string;
};

const initialForm: FormState = {
  policyNumber: '',
  category: 'principal',
  firstName: '',
  lastName: '',
  gender: 'male',
  age: '',
  providerId: '',
  reportingYear: String(new Date().getFullYear()),
  reportingMonth: '',
};

function errorMessage(error: unknown): string {
  if (isSecureContractError(error)) return error.message;
  return error instanceof Error ? error.message : 'The enrollee could not be saved. Please try again.';
}

export default function NewEnrolleePage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [form, setForm] = useState<FormState>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const createBatch = useCreateEnrolmentImportBatch();
  const providerQuery = useProviderDirectory(providerFilters);
  const providers = providerQuery.data ?? [];
  const selectedProvider = useMemo(() => providers.find(provider => provider.id === form.providerId), [form.providerId, providers]);

  const update = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm(previous => ({ ...previous, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const policyNumber = form.policyNumber.trim().toUpperCase().replace(/\s+/g, '');
    const sector: EnrolmentSector | undefined = /\/C(?:\/|$)/.test(policyNumber)
      ? 'formal'
      : /\/D(?:\/|$)/.test(policyNumber)
        ? 'informal'
        : undefined;
    const age = Number(form.age);
    const year = Number(form.reportingYear);
    const month = Number(form.reportingMonth);

    if (!policyNumber || !sector) {
      setError('Policy number must contain /C/ for formal or /D/ for informal sector.');
      return;
    }
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('First name and last name are required.');
      return;
    }
    if (!Number.isInteger(age) || age < 0 || age > 120) {
      setError('Age is required and must be a whole number between 0 and 120.');
      return;
    }
    if (!selectedProvider) {
      setError('Select an authoritative Provider Directory facility.');
      return;
    }
    if (!Number.isInteger(year) || year < 2025 || year > 2100 || !Number.isInteger(month) || month < 1 || month > 12) {
      setError('Enter a valid reporting year and month.');
      return;
    }

    const period = `${year}-${String(month).padStart(2, '0')}`;
    const now = new Date().toISOString();
    const fingerprint = buildEnrolleeFingerprint(policyNumber, period);
    const record = {
      id: `manual-${fingerprint}`,
      policyNumber,
      category: form.category,
      sector,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      gender: form.gender,
      age,
      providerId: selectedProvider.id,
      providerCode: selectedProvider.providerCode,
      providerName: selectedProvider.providerName,
      facilityType: selectedProvider.category,
      ownership: selectedProvider.ownership,
      lga: selectedProvider.lga,
      state: 'Ondo',
      senatorialDistrict: undefined,
      reportingYear: year,
      reportingMonth: month,
      period,
      sourceFile: 'manual-enrollee-entry',
      importBatchId: 'pending',
      sourceRow: 1,
      recordStatus: 'valid',
      fingerprint,
      createdAt: now,
      updatedAt: now,
      metadata: {
        entryMode: 'manual',
        age,
        authoritativeProviderId: selectedProvider.id,
        authoritativeProviderLga: selectedProvider.lga,
        sourceCategory: form.category,
      },
      // The deployed import contract accepts a nullable date_of_birth. Age is
      // preserved in metadata until a governed date-of-birth field is approved.
      dateOfBirth: null,
    } as EnrolleeRecord & { dateOfBirth: null };

    try {
      const result = await createBatch.mutateAsync({
        batch: {
          fileName: 'manual-enrollee-entry',
          dataType: 'enrolment',
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
            providerId: selectedProvider.id,
            providerName: selectedProvider.providerName,
          },
        },
        records: [record],
        actor: session?.user.id && session.user.email ? { id: session.user.id, email: session.user.email } : undefined,
      });

      if (result.importedRows === 1) {
        setSuccess('Enrollee saved successfully. The Population Overview and Register will refresh automatically.');
        window.setTimeout(() => navigate('/population/enrolment/register'), 900);
      } else if (result.duplicateRows > 0) {
        setError('This policy number already exists for the selected reporting period. No duplicate was created.');
      } else {
        setError(`The record was not imported. ${result.errorRows || result.unmatchedProviders || 0} validation or matching issue(s) were returned.`);
      }
    } catch (submissionError) {
      setError(errorMessage(submissionError));
    }
  };

  return (
    <main className="nmis-page">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/population/enrolment">
            <Button variant="secondary" size="sm" className="gap-2"><ArrowLeft size={16} /> Back to Population Overview</Button>
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-muted sm:justify-end"><UserPlus size={14} /> Secure enrolment entry</div>
        </div>

        <PageHeader
          eyebrow="Population & Enrolment"
          title="Add New Enrollee"
          subtitle="Create one beneficiary record through the existing trusted import contract. Provider, period, sector, and duplicate rules remain authoritative."
        />

        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><p className="font-semibold">Entry could not be completed</p><p className="mt-1">{error}</p></div> : null}
        {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><p className="font-semibold">Saved</p><p className="mt-1">{success}</p></div> : null}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="space-y-6 p-6 sm:p-8">
            <div><h2 className="text-lg font-bold text-brand-foreground">Beneficiary details</h2><p className="text-sm text-brand-muted">Use the values exactly as they should appear in the enrolment register.</p></div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className="nmis-label">Policy number *</label><Input value={form.policyNumber} onChange={event => update('policyNumber', event.target.value)} placeholder="e.g. ANE/0235786/26/D/0" required /><p className="mt-1 text-xs text-brand-muted">The /C/ or /D/ segment determines Formal or Informal sector.</p></div>
              <label><span className="nmis-label">CATEGORY *</span><select className="nmis-control" value={form.category} onChange={event => update('category', event.target.value as EnrolmentCategory)}><option value="principal">Principal</option><option value="dependant">Dependant</option></select></label>
              <label><span className="nmis-label">Gender *</span><select className="nmis-control" value={form.gender} onChange={event => update('gender', event.target.value as FormState['gender'])}><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></label>
              <div><label className="nmis-label">First name *</label><Input value={form.firstName} onChange={event => update('firstName', event.target.value)} required /></div>
              <div><label className="nmis-label">Last name *</label><Input value={form.lastName} onChange={event => update('lastName', event.target.value)} required /></div>
              <div><label className="nmis-label">Age *</label><Input type="number" min="0" max="120" value={form.age} onChange={event => update('age', event.target.value)} required /></div>
            </div>
          </Card>

          <Card className="space-y-6 p-6 sm:p-8">
            <div><h2 className="text-lg font-bold text-brand-foreground">Provider and reporting period</h2><p className="text-sm text-brand-muted">The facility is selected from the authoritative Provider Directory; state remains Ondo.</p></div>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="sm:col-span-2"><span className="nmis-label">Provider Directory facility *</span><select className="nmis-control" value={form.providerId} onChange={event => update('providerId', event.target.value)} disabled={providerQuery.isLoading || providerQuery.isError} required><option value="">{providerQuery.isLoading ? 'Loading facilities...' : providerQuery.isError ? 'Provider Directory unavailable' : 'Select a facility'}</option>{providers.map(provider => <option key={provider.id} value={provider.id}>{provider.providerCode} — {provider.providerName} ({provider.lga})</option>)}</select>{providerQuery.isError ? <span className="mt-1 block text-xs text-rose-700">The secure Provider Directory contract could not be loaded.</span> : null}</label>
              <div><label className="nmis-label">Reporting year *</label><Input type="number" min="2025" max="2100" value={form.reportingYear} onChange={event => update('reportingYear', event.target.value)} required /></div>
              <label><span className="nmis-label">Reporting month *</span><select className="nmis-control" value={form.reportingMonth} onChange={event => update('reportingMonth', event.target.value)} required><option value="">Select month</option>{['January','February','March','April','May','June','July','August','September','October','November','December'].map((name, index) => <option key={name} value={index + 1}>{name}</option>)}</select></label>
              <div><label className="nmis-label">State</label><Input value="Ondo" disabled className="bg-brand-surface text-brand-muted" /></div>
              <div><label className="nmis-label">LGA</label><Input value={selectedProvider?.lga || 'Select a provider'} disabled className="bg-brand-surface text-brand-muted" /></div>
            </div>
          </Card>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Link to="/population/enrolment"><Button type="button" variant="secondary" className="w-full sm:w-auto">Cancel</Button></Link><Button type="submit" disabled={createBatch.isPending || providerQuery.isLoading} className="w-full sm:w-auto">{createBatch.isPending ? 'Saving enrollee...' : 'Save enrollee'}</Button></div>
        </form>
      </div>
    </main>
  );
}
