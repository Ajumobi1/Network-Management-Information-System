import { Link } from 'react-router-dom';

export default function AuthLandingPage() {
  return (
    <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="grid gap-12 md:grid-cols-[1.1fr_0.9fr]">
          <div className="bg-gradient-to-br from-[#0F3C91] to-[#111D42] px-10 py-12 text-white md:px-14 md:py-16">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200/80">Access control</p>
            <h1 className="mt-8 text-4xl font-semibold leading-tight">Secure authentication and session control.</h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-200/90">
              Choose an established user flow for sign in, password recovery, and reset operations.
            </p>
            <div className="mt-10 grid gap-4">
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
                <p className="text-sm font-semibold text-slate-100">Single sign-on ready</p>
                <p className="mt-2 text-sm text-slate-300">The auth stack is prepared for next-phase SSO or identity provider integration.</p>
              </div>
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
                <p className="text-sm font-semibold text-slate-100">Protected application routes</p>
                <p className="mt-2 text-sm text-slate-300">Authenticated pages require a valid session and redirect automatically.</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-10 md:px-12 md:py-14">
            <div className="mb-8">
              <h2 className="text-3xl font-semibold text-slate-900">Authentication routes</h2>
              <p className="mt-3 text-sm text-slate-500">Use the login interface to access the NMIS portal and reset password flows as needed.</p>
            </div>

            <div className="grid gap-4">
              <Link
                to="/login"
                className="block rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-center text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Sign in
              </Link>
              <Link
                to="/forgot-password"
                className="block rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-center text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Forgot password
              </Link>
              <Link
                to="/reset-password?token=reset-token"
                className="block rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-center text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Reset password (demo token)
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
