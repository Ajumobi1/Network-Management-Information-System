import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import useAuth from '../../hooks/useAuth';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { forgotPassword, loading, error } = useAuth();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async ({ email }: ForgotPasswordFormValues) => {
    const response = await forgotPassword(email);
    if (!response) {
      setSuccessMessage('If we found an account for that email, a password reset link has been sent.');
    } else {
      setSuccessMessage(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="grid gap-12 md:grid-cols-[1.1fr_0.9fr]">
          <div className="bg-gradient-to-br from-[#0F3C91] to-[#111D42] px-10 py-12 text-white md:px-14 md:py-16">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200/80">Security workflow</p>
            <h1 className="mt-8 text-4xl font-semibold leading-tight">Reset your password securely.</h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-200/90">
              Enter your account email and we&apos;ll send a secure reset link. This is a stubbed workflow designed for future backend integration.
            </p>
            <div className="mt-10 grid gap-4">
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
                <p className="text-sm font-semibold text-slate-100">Enterprise-ready reset</p>
                <p className="mt-2 text-sm text-slate-300">Support email-based recovery and token validation for secure account access.</p>
              </div>
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
                <p className="text-sm font-semibold text-slate-100">Session protection</p>
                <p className="mt-2 text-sm text-slate-300">Temporary reset tokens and session expiry are handled by the auth service layer.</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-10 md:px-12 md:py-14">
            <div className="mb-8 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Forgot password</p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-900">Recover your account</h2>
              </div>
              <Link to="/login" className="text-sm font-semibold text-[#0F3C91] hover:text-[#0B2E74]">
                Back to sign in
              </Link>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label className="text-sm font-medium text-slate-700">Email address</label>
                <input
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0F3C91] focus:ring-2 focus:ring-sky-100"
                  placeholder="you@company.com"
                />
                {errors.email && <p className="mt-2 text-sm text-rose-600">{errors.email.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-3xl bg-[#0F3C91] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-[#0B2E74] disabled:pointer-events-none disabled:opacity-70"
              >
                {loading ? 'Sending link…' : 'Send reset link'}
              </button>

              {error && <p className="rounded-3xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">{error.message}</p>}
              {successMessage && <p className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">{successMessage}</p>}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
