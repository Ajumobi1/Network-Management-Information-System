import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AtSymbolIcon, CheckCircleIcon, EyeIcon, EyeSlashIcon, GlobeAltIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { authService } from '../services/auth/authService';

function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const result = await authService.signIn(email, password, true);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4 py-6 sm:px-6 sm:py-10">
      <div className="relative grid w-full max-w-[1550px] grid-cols-1 overflow-hidden rounded-[2rem] bg-white text-slate-900 shadow-soft lg:grid-cols-[1.1fr_0.9fr]">
        <aside className="relative hidden overflow-hidden bg-[#0D184C] px-12 py-14 text-white lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_25%)]" />
          <div className="absolute inset-x-0 bottom-0 top-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent_50%)]" />

          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold tracking-[0.18em] text-slate-100 shadow-sm">
              <ShieldCheckIcon className="h-5 w-5 text-white" />
              ODCHC NMIS
            </div>

            <div className="mt-10">
              <h1 className="text-4xl font-semibold tracking-tight text-white">Network Management Information System (NMIS)</h1>
              <p className="mt-5 max-w-lg text-sm leading-7 text-slate-200/90">
                The official Network Management Information System for the Ondo State Contributory Health Commission.
              </p>
            </div>

            <div className="mt-12 space-y-4">
              {[
                'Provider Management',
                'Capitation Management',
                'Facility Inspection',
                'Performance Monitoring',
                'Reports & Analytics',
              ].map(item => (
                <div key={item} className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-300/35">
                    <CheckCircleIcon className="h-5 w-5" />
                  </span>
                  <span className="text-sm text-slate-100">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-14 h-[320px] w-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-inner">
              <div className="h-full bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent)] p-6">
                <div className="h-full rounded-[1.5rem] bg-gradient-to-br from-slate-900 via-[#10224D] to-[#0D184C] p-6">
                  <div className="relative h-full rounded-[1.5rem] bg-[#0B3D91] p-5">
                    <div className="absolute inset-x-6 top-6 h-24 rounded-[1.6rem] bg-[#0D184C] shadow-[0_20px_40px_rgba(0,0,0,0.18)]" />
                    <div className="absolute left-10 top-24 h-20 w-14 rounded-xl bg-slate-100/10" />
                    <div className="absolute left-32 top-20 h-16 w-16 rounded-2xl bg-white/10" />
                    <div className="absolute bottom-8 right-8 h-12 w-24 rounded-xl bg-white/10" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="relative bg-slate-50 px-4 py-8 sm:px-8 sm:py-10 lg:px-14 lg:py-14">
          <div className="absolute right-8 top-8 hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm shadow-slate-300/20 lg:flex">
            <GlobeAltIcon className="h-4 w-4 text-slate-500" />
            English
          </div>

          <div className="mx-auto max-w-md">
            <div className="mb-8">
              <h2 className="text-3xl font-semibold text-slate-900">Welcome Back! 👋</h2>
              <p className="mt-3 text-sm text-slate-500">Sign in to continue to your account</p>
            </div>

            <div className="rounded-[2rem] bg-white p-5 shadow-soft sm:p-8">
              {error && (
                <div className="mb-6 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-600 border border-red-100">
                  {error}
                </div>
              )}
              <form
                className="space-y-6"
                onSubmit={handleSignIn}
              >
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Email Address</span>
                  <div className="mt-2 flex items-center gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm focus-within:border-[#0D184C] focus-within:ring-2 focus-within:ring-[#0D184C]/20">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm">
                      <AtSymbolIcon className="h-5 w-5" />
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                      placeholder="Enter your email"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Password</span>
                  <div className="mt-2 flex items-center gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm focus-within:border-[#0D184C] focus-within:ring-2 focus-within:ring-[#0D184C]/20">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm">
                      <ShieldCheckIcon className="h-5 w-5" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                      placeholder="Enter your password"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 transition hover:text-slate-700"
                    >
                      <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                      {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                </label>

              <div className="flex flex-col items-start gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-[#16A34A] focus:ring-[#16A34A]" />
                  Remember me
                </label>
                <button 
                  type="button" 
                  onClick={async () => {
                    if (!email) {
                      setError('Please enter your email address first.');
                      return;
                    }
                    setIsLoading(true);
                    const res = await authService.forgotPassword(email);
                    setIsLoading(false);
                    if (res.success) {
                      alert('Password reset link sent to your email.');
                    } else {
                      setError(res.error.message);
                    }
                  }}
                  className="font-medium text-[#0D184C] hover:text-[#10224D]"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-2xl bg-[#16A34A] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600 disabled:opacity-50"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 flex items-center gap-3 text-sm text-slate-500">
              <div className="h-px flex-1 bg-slate-200" />
              or sign in with
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">G</span>
                Google
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">M</span>
                Microsoft
              </button>
            </div>

            <p className="mt-8 text-sm text-slate-500">
              Don’t have an account? <button type="button" className="font-semibold text-[#0D184C]">Contact administrator</button>
            </p>
          </div>
        </div>
      </main>
    </div>
  </div>
  );
}

export default LoginPage;
