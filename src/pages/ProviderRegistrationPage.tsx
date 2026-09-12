import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import PageHeader from '../components/ui/PageHeader';
import { useRegisterProvider } from '../features/providers/hooks';
import { isSecureContractError } from '../lib/security/secureContracts';
import { ProviderCategory, PROVIDER_CATEGORY_LABELS, PROVIDER_SERVICES } from '../constants/providerNetwork';

const categories = Object.values(ProviderCategory);
const ownerships = ['Government', 'Private'];
const lgas = ['Akoko North East', 'Akoko North West', 'Akoko South East', 'Akoko South West', 'Akure North', 'Akure South', 'Ese Odo', 'Idanre', 'Ifedore', 'Ilaje', 'Ile Oluji/Okeigbo', 'Irele', 'Odigbo', 'Okitipupa', 'Ondo East', 'Ondo West', 'Ose', 'Owo'];

export default function ProviderRegistrationPage() {
  const navigate = useNavigate();
  const registerProviderMutation = useRegisterProvider();

  const [form, setForm] = useState({
    providerName: '',
    category: ProviderCategory.Hospital,
    ownership: 'Government',
    lga: 'Akure South',
    address: '',
    contactPerson: '',
    phone: '',
    email: '',
    bankName: '',
    accountName: '',
    accountNumber: '',
    services: [] as string[],
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.providerName.trim()) {
      setError('Facility name is required.');
      return;
    }

    registerProviderMutation.mutate(
      { ...form, providerName: form.providerName.toUpperCase(), state: 'Ondo', subcategory: null } as any,
      {
        onSuccess: () => {
          setSuccess('Provider successfully registered and added to the alphabetical master register.');
          setTimeout(() => navigate('/providers'), 1500);
        },
        onError: (err: unknown) => {
          setError(isSecureContractError(err) ? err.message : (err instanceof Error ? err.message : 'Provider registration failed. No provider was created.'));
        },
      }
    );
  };

  return (
    <main className="nmis-page">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/providers')}
            className="gap-2 text-brand-secondary hover:text-brand-foreground"
          >
            <ArrowLeft size={16} /> Back to Provider Directory
          </Button>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-muted sm:justify-end">
            <UserPlus size={14} /> Enterprise Registration Workflow
          </div>
        </div>

        <PageHeader
          eyebrow="Provider Network"
          title="Register New Facility"
          subtitle="Add a new provider to the authoritative Ondo State Provider Master Register. System automatically generates permanent UUID and assigns alphabetical sequence position."
        />

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <p className="font-semibold">Registration Notice</p>
            <p className="mt-1">{error}</p>
          </div>
        ) : null}

        {success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <p className="font-semibold">Success</p>
            <p className="mt-1">{success}</p>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Facility Identification & Classification</h3>
              <p className="text-sm text-slate-500">Provide official facility naming, category, and governance ownership.</p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Facility / Provider Name *</label>
                <Input
                  value={form.providerName}
                  onChange={e => setForm(prev => ({ ...prev, providerName: e.target.value }))}
                  placeholder="e.g. Akure Specialist Hospital"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Facility Type / Category *</label>
                <select
                  value={form.category}
                  onChange={e => setForm(prev => ({ ...prev, category: e.target.value as ProviderCategory }))}
                  className="w-full rounded-control border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-brand-blue focus:outline-none"
                >
                  {categories.map(cat => <option key={cat} value={cat}>{PROVIDER_CATEGORY_LABELS[cat as ProviderCategory]}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Ownership *</label>
                <select
                  value={form.ownership}
                  onChange={e => setForm(prev => ({ ...prev, ownership: e.target.value }))}
                  className="w-full rounded-control border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-brand-blue focus:outline-none"
                >
                  {ownerships.map(own => <option key={own} value={own}>{own}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">State</label>
                <Input value="Ondo" disabled className="bg-slate-100 text-slate-500 cursor-not-allowed" />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-4">Services Offered (Select Multiple)</label>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {PROVIDER_SERVICES.map(service => (
                    <label key={service} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${form.services.includes(service) ? 'border-brand-blue bg-brand-soft/20 ring-1 ring-brand-blue' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
                        checked={form.services.includes(service)}
                        onChange={() => {
                          setForm(prev => ({
                            ...prev,
                            services: prev.services.includes(service)
                              ? prev.services.filter(s => s !== service)
                              : [...prev.services, service]
                          }));
                        }}
                      />
                      <span className="text-sm font-medium text-slate-700">{service}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Local Government Area (LGA) *</label>
                <select
                  value={form.lga}
                  onChange={e => setForm(prev => ({ ...prev, lga: e.target.value }))}
                  className="w-full rounded-control border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-brand-blue focus:outline-none"
                >
                  {lgas.map(lga => <option key={lga} value={lga}>{lga}</option>)}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Physical Address</label>
                <Input
                  value={form.address}
                  onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Street address or location description"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Contact & Financial Information</h3>
              <p className="text-sm text-slate-500">Designated administrative contact and banking routing particulars.</p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Contact Person</label>
                <Input
                  value={form.contactPerson}
                  onChange={e => setForm(prev => ({ ...prev, contactPerson: e.target.value }))}
                  placeholder="Medical Director or Administrator"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Phone Number</label>
                <Input
                  value={form.phone}
                  onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+234 ..."
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Email Address</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="facility@domain.ng"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Bank Name</label>
                <Input
                  value={form.bankName}
                  onChange={e => setForm(prev => ({ ...prev, bankName: e.target.value }))}
                  placeholder="e.g. First Bank of Nigeria"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Account Number</label>
                <Input
                  value={form.accountNumber}
                  onChange={e => setForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                  placeholder="10-digit NUBAN"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Account Name</label>
                <Input
                  value={form.accountName}
                  onChange={e => setForm(prev => ({ ...prev, accountName: e.target.value }))}
                  placeholder="Official registered bank account name"
                />
              </div>
            </div>
          </Card>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => navigate('/providers')} className="w-full sm:w-auto">Cancel</Button>
            <Button type="submit" className="w-full sm:w-auto">Save and Register Provider</Button>
          </div>
        </form>
      </div>
    </main>
  );
}
