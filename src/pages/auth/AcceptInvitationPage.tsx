import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';

const acceptInvitationSchema = z.object({
  password: z.string().min(1, 'Password is required').min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).superRefine(({ password, confirmPassword }, ctx) => {
  if (password !== confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Passwords must match',
      path: ['confirmPassword'],
    });
  }
});

type AcceptInvitationFormValues = z.infer<typeof acceptInvitationSchema>;

export default function AcceptInvitationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [confirmation, setConfirmation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = searchParams.get('token') || '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptInvitationFormValues>({
    resolver: zodResolver(acceptInvitationSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async ({ password }: AcceptInvitationFormValues) => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 700));
    setIsSubmitting(false);
    setConfirmation('Your password has been set successfully. You may now sign in.');
    setTimeout(() => navigate('/login'), 1200);
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="grid gap-12 md:grid-cols-[1.1fr_0.9fr]">
          <div className="bg-gradient-to-br from-[#0F3C91] to-[#111D42] px-10 py-12 text-white md:px-14 md:py-16">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200/80">Invitation onboarding</p>
            <h1 className="mt-8 text-4xl font-semibold leading-tight">Accept your provider invitation.</h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-200/90">
              Use the secure invite token from your email to create a password and activate your provider account.
            </p>
            <div className="mt-10 grid gap-4">
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
                <p className="text-sm font-semibold text-slate-100">Invitation token</p>
                <p className="mt-2 text-sm text-slate-300">The token is only valid for a limited time and is required to complete onboarding.</p>
              </div>
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
                <p className="text-sm font-semibold text-slate-100">Provider activation</p>
                <p className="mt-2 text-sm text-slate-300">Once accepted, provider accounts can access the network portal immediately.</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-10 md:px-12 md:py-14">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Accept invitation</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">Set your password</h2>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label className="text-sm font-medium text-slate-700">Invitation token</label>
                <input
                  type="text"
                  readOnly
                  value={token}
                  className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">New password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  {...register('password')}
                  className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0F3C91] focus:ring-2 focus:ring-sky-100"
                  placeholder="Create a strong password"
                />
                {errors.password && <p className="mt-2 text-sm text-rose-600">{errors.password.message}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Confirm password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                  className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0F3C91] focus:ring-2 focus:ring-sky-100"
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && <p className="mt-2 text-sm text-rose-600">{errors.confirmPassword.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-3xl bg-[#0F3C91] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-[#0B2E74] disabled:pointer-events-none disabled:opacity-70"
              >
                {isSubmitting ? 'Accepting invitation…' : 'Accept invitation'}
              </button>

              {confirmation && <p className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">{confirmation}</p>}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
