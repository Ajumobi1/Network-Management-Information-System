import { BellIcon, Cog6ToothIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

function TopNav() {
  const { session, signOut } = useAuth();

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
      <div>
        <p className="text-sm font-medium text-slate-500">Hello, {session?.user.name ?? 'Network Manager'}</p>
        <h2 className="text-2xl font-semibold text-slate-900">Network Management Information System (NMIS)</h2>
      </div>
      <div className="flex items-center gap-3">
        <button className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100">
          <BellIcon className="h-5 w-5" />
        </button>
        <button className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100">
          <Cog6ToothIcon className="h-5 w-5" />
        </button>
        <button onClick={signOut} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
          <UserCircleIcon className="h-5 w-5" />
          Sign out
        </button>
      </div>
    </div>
  );
}

export default TopNav;
