import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import useAuth from '../../hooks/useAuth';

const resetPasswordSchema = z.object({
  password: z.string().min(1, 'Password is required').min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).superRefine(({ password, confirmPassword }, ctx) => {
  if (password !== confirmPassword) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Passwords must match', path: ['confirmPassword'] });
  }
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { resetPassword, loading, error } = useAuth();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async ({ password }: ResetPasswordFormValues) => {
    const response = await resetPassword(password);
    if (!response) {
      setSuccessMessage('Your password has been updated successfully.');
      setTimeout(() => navigate('/login'), 1200);
    } else {
      setSuccessMessage(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="grid gap-12 md:grid-cols-[1.1fr_0.9fr]">
          <div className="bg-gradient-to-br from-[#0F3C91] to-[#111D42] px-10 py-12 text-white md:px-14 md:py-16">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200/80">Secure update</p>
            <h1 className="mt-8 text-4xl font-semibold leading-tight">Set a new password.</h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-200/90">Use a strong password and keep your account recovery secure. This page requires a verified recovery session.</p>
            <div className="mt-10 grid gap-4">
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6"><p className="text-sm font-semibold text-slate-100">Verified recovery session</p><p className="mt-2 text-sm text-slate-300">Reset links are exchanged by the authentication provider before a password can be changed.</p></div>
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6"><p className="text-sm font-semibold text-slate-100">Enterprise password rules</p><p className="mt-2 text-sm text-slate-300">Passwords should contain letters, numbers, and special characters for high-security environments.</p></div>
            </div>
          </div>
          <div className="px-8 py-10 md:px-12 md:py-14">
            <div className="mb-8 flex items-center justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Reset password</p><h2 className="mt-2 text-3xl font-semibold text-slate-900">Create a new password</h2></div><Link to="/login" className="text-sm font-semibold text-[#0F3C91] hover:text-[#0B2E74]">Back to sign in</Link></div>
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div><label className="text-sm font-medium text-slate-700">New password</label><input type="password" autoComplete="new-password" {...register('password')} className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0F3C91] focus:ring-2 focus:ring-sky-100" placeholder="New password" />{errors.password && <p className="mt-2 text-sm text-rose-600">{errors.password.message}</p>}</div>
              <div><label className="text-sm font-medium text-slate-700">Confirm password</label><input type="password" autoComplete="new-password" {...register('confirmPassword')} className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0F3C91] focus:ring-2 focus:ring-sky-100" placeholder="Confirm password" />{errors.confirmPassword && <p className="mt-2 text-sm text-rose-600">{errors.confirmPassword.message}</p>}</div>
              <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center rounded-3xl bg-[#0F3C91] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-[#0B2E74] disabled:pointer-events-none disabled:opacity-70">{loading ? 'Updating password…' : 'Reset password'}</button>
              {error && <p className="rounded-3xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">{error.message}</p>}
              {successMessage && <p className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">{successMessage}</p>}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
