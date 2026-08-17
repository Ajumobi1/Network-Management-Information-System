import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Eye, EyeOff, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import Button from '../../components/ui/Button';

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
    <div className="flex min-h-screen items-center justify-center bg-brand-background px-4 py-8">
      <div className="grid w-full max-w-[1200px] grid-cols-1 overflow-hidden rounded-panel bg-brand-card shadow-panel md:grid-cols-[1fr_1fr]">
        {/* Left Side: Branding & Value Props */}
        <section className="relative overflow-hidden bg-brand-navy px-10 py-12 text-white md:px-16 md:py-20">
          <div className="relative z-10">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-control bg-white shadow-soft p-1">
                <img src="/assets/odchc-logo.png" alt="ODCHC Logo" className="h-full w-full object-contain" />
              </div>
              <div>
                <p className="text-[0.625rem] font-bold uppercase tracking-[0.3em] text-white/40">ODCHC NMIS</p>
                <p className="text-sm font-semibold text-white">Health Enterprise Cloud</p>
              </div>
            </div>

            <h1 className="mt-12 text-4xl font-black leading-tight tracking-tight lg:text-5xl">
              Network Management Information System
            </h1>
            <p className="mt-6 max-w-sm text-base leading-relaxed text-white/70">
              A premium intelligent command center for healthcare provider networks, population protection, and financial intelligence.
            </p>
          </div>

          {/* Decorative Elements */}
          <div className="pointer-events-none absolute inset-0 opacity-20">
            <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-brand-blue blur-[100px]" />
            <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-status-info blur-[120px]" />
          </div>

          <div className="relative mt-16 grid gap-6 sm:grid-cols-2">
            <div className="rounded-panel border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <ShieldCheck className="h-6 w-6 text-brand-blue" />
              <p className="mt-4 text-sm font-bold text-white">Hardened Security</p>
              <p className="mt-2 text-xs leading-relaxed text-white/50">Role-based access control and append-only audit trails.</p>
            </div>
            <div className="rounded-panel border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <Zap className="h-6 w-6 text-status-warning" />
              <p className="mt-4 text-sm font-bold text-white">Instant Insights</p>
              <p className="mt-2 text-xs leading-relaxed text-white/50">Live PEPM analytics and provider performance monitoring.</p>
            </div>
          </div>
        </section>

        {/* Right Side: Login Form */}
        <section className="flex flex-col justify-center px-8 py-12 md:px-16 md:py-20">
          <div className="mb-10">
            <div className="mb-8 flex max-w-[280px] items-center justify-start overflow-hidden">
              <img src="/assets/odchc-logo.png" alt="Ondo State Contributory Health Commission logo" className="h-auto w-full object-contain" />
            </div>
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-brand-muted">Welcome back</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-brand-foreground">Sign in to NMIS</h2>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-1.5">
              <label className="nmis-label" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className={`nmis-control ${errors.email ? 'border-status-error focus:border-status-error' : ''}`}
                placeholder="you@company.com"
              />
              {errors.email && <p className="mt-1.5 text-xs font-medium text-status-error">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="nmis-label" htmlFor="password">Password</label>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-xs font-bold text-brand-blue hover:text-brand-hover"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('password')}
                  className={`nmis-control pr-12 ${errors.password ? 'border-status-error focus:border-status-error' : ''}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(value => !value)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-subtle transition hover:text-brand-secondary"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs font-medium text-status-error">{errors.password.message}</p>}
            </div>

            <div className="flex items-center">
              <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-brand-secondary">
                <input
                  type="checkbox"
                  {...register('remember')}
                  className="h-4 w-4 rounded border-brand-border text-brand-blue focus:ring-brand-blue"
                />
                Remember me
              </label>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full py-3 text-base font-bold"
                disabled={loading}
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </Button>
              {error && (
                <div className="mt-4 flex items-start gap-3 rounded-control border border-status-error/20 bg-status-errorSoft p-4 text-sm text-status-error">
                  <p>{error.message}</p>
                </div>
              )}
            </div>
          </form>

          <div className="mt-12 rounded-panel border border-brand-divider bg-brand-surface/50 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-foreground">Enterprise Authority</p>
            <p className="mt-2 text-xs leading-relaxed text-brand-muted">
              Access is restricted to authorized Network Management personnel. All authentication attempts and session activities are audited.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
