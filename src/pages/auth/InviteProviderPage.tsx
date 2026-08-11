import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const invitationSchema = z.object({
  providerName: z.string().min(1, 'Provider name is required'),
  providerCompany: z.string().min(1, 'Provider organization is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  role: z.enum(['provider']),
});

type InvitationFormValues = z.infer<typeof invitationSchema>;

export default function InviteProviderPage() {
  const [sentMessage, setSentMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InvitationFormValues>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      providerName: '',
      providerCompany: '',
      email: '',
      role: 'provider',
    },
  });

  const onSubmit = async (values: InvitationFormValues) => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 700));
    setIsSubmitting(false);
    setSentMessage(`Invitation created for ${values.providerName}. A secure invite token will be sent to ${values.email}.`);
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Provider invitation</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">Invite a provider</h1>
        <p className="mt-2 text-sm text-slate-500">Register provider details and generate an invitation token for onboarding.</p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="text-sm font-medium text-slate-700">Provider name</label>
          <input
            type="text"
            {...register('providerName')}
            className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0F3C91] focus:ring-2 focus:ring-sky-100"
            placeholder="e.g. NorthStar Primary Care"
          />
          {errors.providerName && <p className="mt-2 text-sm text-rose-600">{errors.providerName.message}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Provider organization</label>
          <input
            type="text"
            {...register('providerCompany')}
            className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0F3C91] focus:ring-2 focus:ring-sky-100"
            placeholder="e.g. Horizon Health Network"
          />
          {errors.providerCompany && <p className="mt-2 text-sm text-rose-600">{errors.providerCompany.message}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Email address</label>
          <input
            type="email"
            autoComplete="email"
            {...register('email')}
            className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0F3C91] focus:ring-2 focus:ring-sky-100"
            placeholder="provider@example.com"
          />
          {errors.email && <p className="mt-2 text-sm text-rose-600">{errors.email.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center rounded-3xl bg-[#0F3C91] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-[#0B2E74] disabled:pointer-events-none disabled:opacity-70"
        >
          {isSubmitting ? 'Creating invitation…' : 'Create invitation'}
        </button>
      </form>

      {sentMessage && <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">{sentMessage}</div>}
    </div>
  );
}
