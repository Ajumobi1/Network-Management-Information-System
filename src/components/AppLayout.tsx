import { Link, Outlet } from 'react-router-dom';
import Shell from './layout/Shell';

export default function AppLayout() {
  return (
    <Shell
      title="NMIS Enterprise Platform"
      subtitle="Secure provider network operations, inspections, and analytics in one unified workspace."
      actions={
        <>
          <Link
            to="/settings"
            className="inline-flex items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            System settings
          </Link>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-3xl bg-brand-blue px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-navy"
          >
            Support hub
          </button>
        </>
      }
    >
      <Outlet />
      <footer className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-soft">
        <p>© {new Date().getFullYear()} NMIS. All rights reserved.</p>
      </footer>
    </Shell>
  );
}
