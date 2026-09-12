import { useState } from 'react';
import Badge from '../../../../components/ui/Badge';
import Button from '../../../../components/ui/Button';
import Card from '../../../../components/ui/Card';
import { useRegisterProvider } from '../../hooks';
import { ProviderCategory, ProviderOwnership } from '../../types';
import { isSecureContractError } from '../../../../lib/security/secureContracts';
import { PROVIDER_CATEGORY_LABELS, PROVIDER_SERVICES } from '../../../../constants/providerNetwork';

const steps = ['Basic information', 'Facility and location', 'Services offered', 'Ownership', 'Review and submit'] as const;

type RegistrationFormState = {
  providerName: string;
  category: ProviderCategory;
  ownership: ProviderOwnership;
  lga: string;
  state: string;
  services: string[];
};

const initialFormState: RegistrationFormState = {
  providerName: '',
  category: ProviderCategory.Hospital,
  ownership: ProviderOwnership.Private,
  lga: '',
  state: 'Ondo',
  services: [],
};

function safeWorkflowMessage(error: unknown): string {
  if (isSecureContractError(error)) return error.message;
  return 'The trusted provider workflow could not complete the registration. No provider was created.';
}

export default function ProviderRegistrationWizard() {
  const registerProvider = useRegisterProvider();
  const [activeStep, setActiveStep] = useState(0);
  const [formState, setFormState] = useState<RegistrationFormState>(initialFormState);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const progress = Math.round(((activeStep + 1) / steps.length) * 100);

  const formComplete = Boolean(
    formState.providerName.trim()
      && formState.category
      && formState.ownership
      && formState.lga.trim(),
  );

  function updateField<K extends keyof RegistrationFormState>(field: K, value: RegistrationFormState[K]) {
    setSubmissionError(null);
    setSuccessMessage(null);
    setFormState(current => ({ ...current, [field]: value }));
  }

  function handleRegister() {
    setSubmissionError(null);
    setSuccessMessage(null);
    registerProvider.mutate(
      {
        providerName: formState.providerName,
        category: formState.category,
        subcategory: '',
        ownership: formState.ownership,
        lga: formState.lga,
        state: formState.state,
        email: '',
        contactPerson: '',
        phone: '',
        services: formState.services,
      },
      {
        onSuccess: provider => {
          setSuccessMessage(`${provider.providerName} was registered through the trusted provider workflow.`);
          setFormState(initialFormState);
          setActiveStep(0);
        },
        onError: error => setSubmissionError(safeWorkflowMessage(error)),
      },
    );
  }

  return (
    <Card>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Provider registration</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Trusted provider onboarding</h2>
          <p className="mt-2 text-sm text-slate-600">Only approved operational fields are submitted. The server verifies identity, super-admin authority, and MFA before any write.</p>
        </div>
        <Badge variant="info">{progress}% complete</Badge>
      </div>

      <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
        <strong>Current trusted scope:</strong> provider identity, category, location, and ownership. Contact details, bank data, documents, provider self-service, and browser-side drafts are intentionally unavailable.
      </div>

      {submissionError && <div role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{submissionError}</div>}
      {successMessage && <div role="status" className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{successMessage}</div>}

      <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-brand-blue transition-all" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => (
          <button
            key={step}
            type="button"
            onClick={() => setActiveStep(index)}
            className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${activeStep === index ? 'border-brand-blue bg-brand-blue text-white' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
          >
            <span className="block text-xs font-semibold opacity-75">Step {index + 1}</span>
            <span className="font-semibold">{step}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
        {activeStep === 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
              Provider name
              <input value={formState.providerName} onChange={event => updateField('providerName', event.target.value)} placeholder="Facility legal name" maxLength={160} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20" />
            </label>
          </div>
        )}

        {activeStep === 1 && (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Facility category
              <select value={formState.category} onChange={event => updateField('category', event.target.value as ProviderCategory)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20">
                {Object.values(ProviderCategory).map(category => <option key={category} value={category}>{PROVIDER_CATEGORY_LABELS[category]}</option>)}
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Local government area
              <input value={formState.lga} onChange={event => updateField('lga', event.target.value)} maxLength={120} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20" placeholder="e.g. Akure South" />
            </label>
          </div>
        )}

        {activeStep === 2 && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-slate-700">Select services offered by this facility</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {PROVIDER_SERVICES.map(service => (
                <label key={service} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${formState.services.includes(service) ? 'border-brand-blue bg-brand-soft/20 ring-1 ring-brand-blue' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
                    checked={formState.services.includes(service)}
                    onChange={() => {
                      const newServices = formState.services.includes(service)
                        ? formState.services.filter(s => s !== service)
                        : [...formState.services, service];
                      updateField('services', newServices);
                    }}
                  />
                  <span className="text-sm font-medium text-slate-700">{service}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {activeStep === 3 && (
          <label className="block max-w-md space-y-2 text-sm font-medium text-slate-700">
            Ownership
            <select value={formState.ownership} onChange={event => updateField('ownership', event.target.value as ProviderOwnership)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20">
              {Object.values(ProviderOwnership).map(ownership => <option key={ownership} value={ownership}>{ownership}</option>)}
            </select>
          </label>
        )}

        {activeStep === 4 && (
          <dl className="grid gap-4 text-sm md:grid-cols-2">
            <div className="md:col-span-2"><dt className="text-slate-500">Provider</dt><dd className="font-semibold text-slate-900">{formState.providerName || 'Not provided'}</dd></div>
            <div><dt className="text-slate-500">Category</dt><dd className="font-semibold text-slate-900">{PROVIDER_CATEGORY_LABELS[formState.category]}</dd></div>
            <div><dt className="text-slate-500">Ownership</dt><dd className="font-semibold text-slate-900">{formState.ownership}</dd></div>
            <div><dt className="text-slate-500">Location</dt><dd className="font-semibold text-slate-900">{formState.lga || 'Not provided'}</dd></div>
            <div className="md:col-span-2">
              <dt className="text-slate-500">Services Offered</dt>
              <dd className="mt-2 flex flex-wrap gap-2">
                {formState.services.length > 0 ? (
                  formState.services.map(s => <Badge key={s} variant="info">{s}</Badge>)
                ) : (
                  <span className="text-slate-400 italic">No services selected</span>
                )}
              </dd>
            </div>
          </dl>
        )}
      </div>

      <div className="mt-6 flex flex-wrap justify-between gap-3">
        <Button variant="secondary" disabled={activeStep === 0 || registerProvider.isPending} onClick={() => setActiveStep(step => Math.max(step - 1, 0))}>Previous</Button>
        {activeStep === steps.length - 1 ? (
          <Button disabled={!formComplete || registerProvider.isPending} onClick={handleRegister}>
            {registerProvider.isPending ? 'Registering facility...' : 'Register Facility Manually'}
          </Button>
        ) : (
          <Button disabled={registerProvider.isPending} onClick={() => setActiveStep(step => Math.min(step + 1, steps.length - 1))}>Next</Button>
        )}
      </div>
    </Card>
  );
}
