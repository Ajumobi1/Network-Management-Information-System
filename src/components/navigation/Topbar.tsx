import { useState } from 'react';
import { Bell, ChevronDown, Menu, Moon, Search, Settings, Sparkles, SunMedium } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../providers/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';

type TopbarProps = { onMenuOpen?: () => void };

export default function Topbar({ onMenuOpen }: TopbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { session, signOut } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const user = session?.user;
  const initials = user?.name?.split(' ').map((part: string) => part[0]).slice(0, 2).join('').toUpperCase() || 'AU';
  const displayName = user?.name || 'Authorized User';
  const displayRole = user?.role?.replace('-', ' ') || 'unassigned';

  return <header className="sticky top-0 z-30 border-b border-brand-border bg-brand-card/95 backdrop-blur-xl">
    <div className="mx-auto flex h-[4.5rem] max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" onClick={onMenuOpen} className="inline-flex h-10 w-10 items-center justify-center rounded-control border border-brand-border bg-brand-card text-brand-secondary transition hover:bg-brand-surface lg:hidden" aria-label="Open navigation"><Menu className="h-5 w-5" /></button>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden">
          <img src="/assets/odchc-logo.png" alt="ODCHC Logo" className="h-full w-full object-contain" />
        </div>
        <div className="hidden min-w-0 sm:block"><p className="text-[0.625rem] font-bold uppercase tracking-[0.28em] text-brand-muted">NMIS</p><p className="truncate text-sm font-semibold text-brand-foreground">Health Enterprise Cloud</p></div>
      </div>
      <div className="hidden flex-1 items-center justify-center px-6 md:flex"><div className="relative w-full max-w-2xl"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-subtle" /><input type="search" placeholder="Search providers, policies, inspections..." aria-label="Global search" className="nmis-control bg-brand-surface pl-10 pr-4" /></div></div>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <button type="button" disabled title="Notifications are not available in this build" aria-label="Notifications unavailable" className="hidden h-10 w-10 cursor-not-allowed items-center justify-center rounded-control border border-brand-border bg-brand-card text-brand-subtle opacity-70 sm:inline-flex"><Bell className="h-4 w-4" /></button>
        <Link to="/settings" className="hidden h-10 w-10 items-center justify-center rounded-control border border-brand-border bg-brand-card text-brand-secondary transition hover:bg-brand-surface sm:inline-flex" aria-label="Open system settings"><Settings className="h-4 w-4" /></Link>
        <button type="button" onClick={toggleTheme} className="inline-flex h-10 w-10 items-center justify-center rounded-control border border-brand-border bg-brand-card text-brand-secondary transition hover:bg-brand-surface" aria-label="Toggle theme">{theme === 'dark' ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
        <div className="relative"><button type="button" onClick={() => setProfileOpen(value => !value)} aria-expanded={profileOpen} className="inline-flex min-h-10 items-center gap-2 rounded-control border border-brand-border bg-brand-card px-2.5 text-sm font-semibold text-brand-foreground transition hover:bg-brand-surface sm:px-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand-blue">{initials}</span><span className="hidden max-w-32 truncate sm:inline">{displayName}</span><ChevronDown className={`hidden h-3.5 w-3.5 text-brand-muted transition-transform sm:block ${profileOpen ? 'rotate-180' : ''}`} /></button>{profileOpen ? <div className="absolute right-0 mt-2 w-60 rounded-panel border border-brand-border bg-brand-elevated p-4 shadow-panel"><p className="text-[0.625rem] font-bold uppercase tracking-[0.2em] text-brand-muted">Signed in as</p><p className="mt-1 font-semibold text-brand-foreground">{displayName}</p><p className="mt-1 text-xs capitalize text-brand-muted">{displayRole}</p><div className="my-3 border-t border-brand-divider" /><Link to="/settings" onClick={() => setProfileOpen(false)} className="block rounded-control px-3 py-2 text-sm font-semibold text-brand-secondary hover:bg-brand-surface">System settings</Link><button type="button" onClick={() => { void signOut(); }} className="mt-1 w-full rounded-control px-3 py-2 text-left text-sm font-semibold text-status-error hover:bg-status-errorSoft">Logout</button></div> : null}</div>
      </div>
    </div>
  </header>;
}
