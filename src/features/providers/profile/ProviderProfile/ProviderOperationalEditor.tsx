import { useState } from 'react';
import Button from '../../../../components/ui/Button';
import { useUpdateProvider } from '../../hooks';
import type { ProviderProfile } from '../../types';
import { isSecureContractError } from '../../../../lib/security/secureContracts';

type OperationalForm = {
  subcategory: string;
  lga: string;
};

function workflowMessage(error: unknown): string {
  if (isSecureContractError(error)) return error.message;
  return 'The operational update was not completed. No provider details were changed.';
}

export default function ProviderOperationalEditor({ provider }: { provider: ProviderProfile }) {
  const updateProvider = useUpdateProvider();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<OperationalForm>({
    subcategory: provider.subcategory,
    lga: provider.lga,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function reset() {
    setForm({ subcategory: provider.subcategory, lga: provider.lga });
    setErrorMessage(null);
    setIsEditing(false);
  }

  function save() {
    setErrorMessage(null);
    setSuccessMessage(null);
    updateProvider.mutate(
      { id: provider.id, payload: form },
      {
        onSuccess: () => {
          setSuccessMessage('Operational details were updated through the trusted provider workflow.');
          setIsEditing(false);
        },
        onError: error => setErrorMessage(workflowMessage(error)),
      },
    );
  }

  if (!isEditing) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>Edit operational details</Button>
        <span className="text-xs text-brand-muted">Location and subcategory only. Identity, ownership, contacts, bank data, documents, and workflow statuses remain restricted.</span>
        {successMessage && <p role="status" className="w-full text-sm text-emerald-700">{successMessage}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-brand-divider bg-brand-card-muted/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-brand-foreground">Edit approved operational fields</h3>
          <p className="mt-1 text-xs text-brand-muted">This request requires verified super-admin authority and AAL2. It does not submit browser actor data.</p>
        </div>
        <Button variant="ghost" size="sm" disabled={updateProvider.isPending} onClick={reset}>Cancel</Button>
      </div>
      {errorMessage && <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{errorMessage}</p>}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-xs font-semibold text-brand-secondary">
          Subcategory
          <input value={form.subcategory} maxLength={160} onChange={event => setForm(current => ({ ...current, subcategory: event.target.value }))} className="w-full rounded-xl border border-brand-divider bg-white px-3 py-2 text-sm text-brand-foreground outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20" />
        </label>
        <label className="space-y-1 text-xs font-semibold text-brand-secondary">
          Local government area
          <input value={form.lga} maxLength={120} onChange={event => setForm(current => ({ ...current, lga: event.target.value }))} className="w-full rounded-xl border border-brand-divider bg-white px-3 py-2 text-sm text-brand-foreground outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20" />
        </label>
      </div>
      <div className="mt-4 flex justify-end">
        <Button size="sm" disabled={updateProvider.isPending || !form.lga.trim()} onClick={save}>
          {updateProvider.isPending ? 'Saving trusted update...' : 'Save operational details'}
        </Button>
      </div>
    </div>
  );
}
