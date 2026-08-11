import { Bell, Search, Settings, Sparkles, UserCircle2, Moon, SunMedium } from 'lucide-react';
import { useTheme } from '../../providers/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';

export default function Topbar() {
  const { theme, toggleTheme } = useTheme();
  const { session, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-blue text-white shadow-soft">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">NMIS</p>
            <p className="text-sm font-semibold text-slate-900">Health Enterprise Cloud</p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Search providers, policies, inspections..."
              aria-label="Global search"
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50">
            <Bell className="h-5 w-5" />
          </button>
          <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50">
            <Settings className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <SunMedium className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <div className="group relative">
            <button type="button" className="inline-flex h-11 items-center gap-3 rounded-3xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50">
              <UserCircle2 className="h-5 w-5" />
              <span>{session?.user.name ?? 'Super Admin'}</span>
            </button>
            <div className="invisible absolute right-0 mt-2 w-56 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft transition group-hover:visible">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Role</p>
              <p className="mt-1 font-semibold text-slate-900">{session?.user.role.replace('-', ' ') ?? 'super-admin'}</p>
              <button
                type="button"
                onClick={signOut}
                className="mt-4 w-full rounded-3xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
