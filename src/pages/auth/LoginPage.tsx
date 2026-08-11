import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import useAuth from '../../hooks/useAuth';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required').min(8, 'Password must contain at least 8 characters'),
  remember: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, loading, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const fromPath = (location.state as { from?: { pathname: string } } | null)?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    const success = await signIn(values.email, values.password, values.remember ?? false);
    if (success) {
      navigate(fromPath, { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center px-4 py-8">
      <div className="grid w-full max-w-[1400px] grid-cols-1 overflow-hidden rounded-[2rem] bg-white shadow-2xl md:grid-cols-[1.2fr_0.9fr]">
        <section className="relative overflow-hidden bg-gradient-to-br from-[#0F3C91] to-[#111D42] px-10 py-12 text-white md:px-16 md:py-16">
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200/80">Enterprise NMIS</p>
            <h1 className="mt-8 text-4xl font-semibold leading-tight tracking-tight">Network Management Information System</h1>
            <p className="mt-4 max-w-sm text-sm leading-7 text-slate-200/90">
              Securely manage providers, inspections, capitation, credentialing, claims, and operations from a single intelligent command center.
            </p>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 top-0 opacity-70">
            <div className="absolute right-10 top-10 h-28 w-28 rounded-full bg-slate-200/10 blur-3xl" />
            <div className="absolute left-10 top-32 h-32 w-32 rounded-full bg-sky-300/20 blur-3xl" />
            <div className="absolute right-24 bottom-16 h-52 w-52 rounded-full bg-slate-100/10 blur-3xl" />
          </div>
          <div className="relative mt-12 flex items-end justify-between gap-6">
            <div className="max-w-[14rem] rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl shadow-slate-900/10">
              <p className="text-sm font-semibold text-slate-100">Role-based security</p>
              <p className="mt-2 text-sm text-slate-300">Grant access to Super Admin, Claims, Inspectors, and more.</p>
            </div>
            <div className="max-w-[14rem] rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl shadow-slate-900/10">
              <p className="text-sm font-semibold text-slate-100">Instant insights</p>
              <p className="mt-2 text-sm text-slate-300">View network health, provider status, and compliance at a glance.</p>
            </div>
          </div>
        </section>

        <section className="px-8 py-10 md:px-12 md:py-14">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Welcome back</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">Sign in to NMIS</h2>
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">Enterprise</div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
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

            <div>
              <label className="text-sm font-medium text-slate-700">Password</label>
              <div className="mt-3 flex items-center rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-[#0F3C91] focus-within:ring-2 focus-within:ring-sky-100">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('password')}
                  className="w-full border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(value => !value)}
                  className="text-slate-400 transition hover:text-slate-700"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password && <p className="mt-2 text-sm text-rose-600">{errors.password.message}</p>}
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <label className="inline-flex items-center gap-3 text-sm text-slate-600">
                <input type="checkbox" {...register('remember')} className="h-4 w-4 rounded border-slate-300 text-[#0F3C91] focus:ring-[#0F3C91]" />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-sm font-semibold text-[#0F3C91] hover:text-[#0B2E74]"
              >
                Forgot password?
              </button>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-3xl bg-[#0F3C91] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-[#0B2E74] disabled:pointer-events-none disabled:opacity-70"
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
              {error && <p className="mt-3 rounded-3xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">{error.message}</p>}
            </div>
          </form>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
            <p className="font-semibold text-slate-800">Enterprise-ready authentication</p>
            <p className="mt-2 leading-6">Session persistence, role-based access, and secure password flows are backed by a service layer prepared for Supabase integration.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
