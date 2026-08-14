import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../../components/ui/Button';
import { useUpdateProvider, useUpdateProviderStatus, useDeleteProvider } from '../../hooks';
import type { ProviderProfile } from '../../types';
import { ProviderCategory, ProviderOwnership, ProviderLifecycleStatus } from '../../types';
import { isSecureContractError } from '../../../../lib/security/secureContracts';

type OperationalForm = {
  providerName: string;
  category: ProviderCategory;
  subcategory: string;
  ownership: ProviderOwnership;
  state: string;
  lga: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
};

function workflowMessage(error: unknown): string {
  if (isSecureContractError(error)) return (error as any).message;
  if (error instanceof Error) return error.message;
  return 'The provider action was not completed. Please verify constraints.';
}

const statusOptions: { label: string; value: ProviderLifecycleStatus }[] = [
  { label: 'Active', value: ProviderLifecycleStatus.Active },
  { label: 'Pending Review', value: ProviderLifecycleStatus.Pending },
  { label: 'Suspended', value: ProviderLifecycleStatus.Suspended },
  { label: 'Inactive', value: ProviderLifecycleStatus.Inactive },
  { label: 'Expired', value: ProviderLifecycleStatus.Expired },
  { label: 'Blacklisted', value: ProviderLifecycleStatus.Blacklisted },
];

export default function ProviderOperationalEditor({ provider }: { provider: ProviderProfile }) {
  const navigate = useNavigate();
  const updateProvider = useUpdateProvider();
  const updateStatus = useUpdateProviderStatus();
  const deleteProvider = useDeleteProvider();

  const [isEditing, setIsEditing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ProviderLifecycleStatus>(provider.status);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [form, setForm] = useState<OperationalForm>({
    providerName: provider.providerName,
    category: provider.category,
    subcategory: provider.subcategory,
    ownership: provider.ownership,
    state: provider.state,
    lga: provider.lga,
    address: provider.address || '',
    contactPerson: provider.contactPerson || '',
    phone: provider.phone || '',
    email: provider.email || '',
    bankName: provider.bankName || '',
    accountName: provider.accountName || '',
    accountNumber: provider.accountNumber || '',
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function reset() {
    setForm({
      providerName: provider.providerName,
      category: provider.category,
      subcategory: provider.subcategory,
      ownership: provider.ownership,
      state: provider.state,
      lga: provider.lga,
      address: provider.address || '',
      contactPerson: provider.contactPerson || '',
      phone: provider.phone || '',
      email: provider.email || '',
      bankName: provider.bankName || '',
      accountName: provider.accountName || '',
      accountNumber: provider.accountNumber || '',
    });
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
          setSuccessMessage('Provider record was updated through the trusted workflow.');
          setIsEditing(false);
        },
        onError: error => setErrorMessage(workflowMessage(error)),
      },
    );
  }

  function handleStatusChange(newStatus: ProviderLifecycleStatus) {
    setErrorMessage(null);
    setSuccessMessage(null);
    setSelectedStatus(newStatus);
    updateStatus.mutate(
      { id: provider.id, status: newStatus },
      {
        onSuccess: () => {
          setSuccessMessage(`Provider status successfully updated to ${newStatus}. Audit event recorded.`);
        },
        onError: error => setErrorMessage(workflowMessage(error)),
      }
    );
  }

  function handleDelete() {
    setErrorMessage(null);
    deleteProvider.mutate(provider.id, {
      onSuccess: () => {
        navigate('/providers');
      },
      onError: error => {
        setShowDeleteConfirm(false);
        setErrorMessage(workflowMessage(error));
      },
    });
  }

  if (!isEditing) {
    return (
      <div className="space-y-4 rounded-2xl border border-brand-divider bg-white p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>Edit provider record</Button>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Lifecycle status:</span>
              <select
                value={selectedStatus}
                onChange={e => handleStatusChange(e.target.value as ProviderLifecycleStatus)}
                disabled={updateStatus.isPending}
                className="rounded-lg border border-brand-divider bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 focus:border-brand-blue focus:outline-none"
              >
                {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          </div>

          <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)}>Trash / Delete Provider</Button>
        </div>

        {successMessage && <p role="status" className="text-xs font-semibold text-emerald-700">{successMessage}</p>}
        {errorMessage && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">{errorMessage}</p>}

        {showDeleteConfirm && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 space-y-3">
            <p className="text-xs font-bold text-rose-900">Confirm Provider Deletion / Archive</p>
            <p className="text-xs text-rose-700">Permanent deletion checks relational dependencies (inspections, financial records, enrollees, complaints). If historical records exist, deletion will be blocked to protect network integrity.</p>
            <div className="flex items-center gap-2">
              <Button variant="danger" size="sm" disabled={deleteProvider.isPending} onClick={handleDelete}>{deleteProvider.isPending ? 'Checking dependencies...' : 'Yes, Delete Provider'}</Button>
              <Button variant="secondary" size="sm" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-brand-divider bg-brand-card-muted/40 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-brand-foreground">Complete Provider Maintenance</h3>
          <p className="mt-1 text-xs text-brand-muted">This request requires verified super-admin authority and AAL2. All changes are audited with server-side attribution.</p>
        </div>
        <Button variant="ghost" size="sm" disabled={updateProvider.isPending} onClick={reset}>Cancel</Button>
      </div>
      {errorMessage && <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{errorMessage}</p>}
      
      <div className="mt-6 space-y-6">
        <section>
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Identity & Category</h4>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <label className="space-y-1 text-xs font-semibold text-brand-secondary">
              Facility Name
              <input value={form.providerName} maxLength={160} onChange={event => setForm(current => ({ ...current, providerName: event.target.value }))} className="w-full rounded-xl border border-brand-divider bg-white px-3 py-2 text-sm text-brand-foreground outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20" />
            </label>
            <label className="space-y-1 text-xs font-semibold text-brand-secondary">
              Category
              <select value={form.category} onChange={event => setForm(current => ({ ...current, category: event.target.value as ProviderCategory }))} className="w-full rounded-xl border border-brand-divider bg-white px-3 py-2 text-sm text-brand-foreground outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20">
                {Object.values(ProviderCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </label>
            <label className="space-y-1 text-xs font-semibold text-brand-secondary">
              Subcategory
              <input value={form.subcategory} maxLength={160} onChange={event => setForm(current => ({ ...current, subcategory: event.target.value }))} className="w-full rounded-xl border border-brand-divider bg-white px-3 py-2 text-sm text-brand-foreground outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20" />
            </label>
          </div>
        </section>

        <section>
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Location & Ownership</h4>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <label className="space-y-1 text-xs font-semibold text-brand-secondary">
              Ownership
              <select value={form.ownership} onChange={event => setForm(current => ({ ...current, ownership: event.target.value as ProviderOwnership }))} className="w-full rounded-xl border border-brand-divider bg-white px-3 py-2 text-sm text-brand-foreground outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20">
                {Object.values(ProviderOwnership).map(own => <option key={own} value={own}>{own}</option>)}
              </select>
            </label>
            <label className="space-y-1 text-xs font-semibold text-brand-secondary">
              State
              <input value={form.state} maxLength={120} onChange={event => setForm(current => ({ ...current, state: event.target.value }))} className="w-full rounded-xl border border-brand-divider bg-white px-3 py-2 text-sm text-brand-foreground outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20" />
            </label>
            <label className="space-y-1 text-xs font-semibold text-brand-secondary">
              Local government area
              <input value={form.lga} maxLength={120} onChange={event => setForm(current => ({ ...current, lga: event.target.value }))} className="w-full rounded-xl border border-brand-divider bg-white px-3 py-2 text-sm text-brand-foreground outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20" />
            </label>
            <label className="space-y-1 text-xs font-semibold text-brand-secondary md:col-span-3">
              Address
              <input value={form.address} maxLength={255} onChange={event => setForm(current => ({ ...current, address: event.target.value }))} className="w-full rounded-xl border border-brand-divider bg-white px-3 py-2 text-sm text-brand-foreground outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20" />
            </label>
          </div>
        </section>

        <section>
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Contacts</h4>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <label className="space-y-1 text-xs font-semibold text-brand-secondary">
              Contact Person
              <input value={form.contactPerson} maxLength={160} onChange={event => setForm(current => ({ ...current, contactPerson: event.target.value }))} className="w-full rounded-xl border border-brand-divider bg-white px-3 py-2 text-sm text-brand-foreground outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20" />
            </label>
            <label className="space-y-1 text-xs font-semibold text-brand-secondary">
              Phone
              <input value={form.phone} maxLength={32} onChange={event => setForm(current => ({ ...current, phone: event.target.value }))} className="w-full rounded-xl border border-brand-divider bg-white px-3 py-2 text-sm text-brand-foreground outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20" />
            </label>
            <label className="space-y-1 text-xs font-semibold text-brand-secondary">
              Email
              <input value={form.email} maxLength={160} onChange={event => setForm(current => ({ ...current, email: event.target.value }))} className="w-full rounded-xl border border-brand-divider bg-white px-3 py-2 text-sm text-brand-foreground outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20" />
            </label>
          </div>
        </section>

        <section>
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-amber-600">Financial & Bank Data (Secure)</h4>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <label className="space-y-1 text-xs font-semibold text-brand-secondary">
              Bank Name
              <input value={form.bankName} maxLength={160} onChange={event => setForm(current => ({ ...current, bankName: event.target.value }))} className="w-full rounded-xl border border-brand-divider bg-white px-3 py-2 text-sm text-brand-foreground outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20" />
            </label>
            <label className="space-y-1 text-xs font-semibold text-brand-secondary">
              Account Name
              <input value={form.accountName} maxLength={160} onChange={event => setForm(current => ({ ...current, accountName: event.target.value }))} className="w-full rounded-xl border border-brand-divider bg-white px-3 py-2 text-sm text-brand-foreground outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20" />
            </label>
            <label className="space-y-1 text-xs font-semibold text-brand-secondary">
              Account Number
              <input value={form.accountNumber} maxLength={32} onChange={event => setForm(current => ({ ...current, accountNumber: event.target.value }))} className="w-full rounded-xl border border-brand-divider bg-white px-3 py-2 text-sm text-brand-foreground outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20" />
            </label>
          </div>
        </section>
      </div>

      <div className="mt-8 flex justify-end">
        <Button size="sm" disabled={updateProvider.isPending || !form.providerName.trim() || !form.lga.trim()} onClick={save}>
          {updateProvider.isPending ? 'Saving trusted update...' : 'Save all changes'}
        </Button>
      </div>
    </div>
  );
}
