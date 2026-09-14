import { AlertTriangle, LogOut, Mail } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';

export default function SuspendedPage() {
  const { signOut, session } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-background px-4">
      <div className="w-full max-w-md overflow-hidden rounded-panel bg-brand-card shadow-panel border border-status-warning/20">
        <div className="bg-status-warning/10 p-8 text-center border-b border-brand-divider">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-status-warning/20 text-status-warning">
            <AlertTriangle size={40} />
          </div>
          <h1 className="mt-6 text-2xl font-black tracking-tight text-brand-foreground">Account Suspended</h1>
          <p className="mt-2 text-sm font-medium text-brand-secondary">
            Access to the ODCHC NMIS portal is temporarily restricted.
          </p>
        </div>

        <div className="p-8 space-y-6">
          <div className="rounded-xl bg-brand-soft p-5 border border-brand-divider">
            <h2 className="text-xs font-black uppercase tracking-widest text-brand-muted mb-3">What does this mean?</h2>
            <p className="text-sm leading-relaxed text-brand-secondary">
              Your account for <span className="font-bold text-brand-foreground">{session?.user?.email}</span> has been placed under administrative suspension. 
              You can still log in to view this status, but all system operations and data access are currently disabled.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold text-brand-muted text-center uppercase tracking-tighter">Required Action</p>
            <div className="flex flex-col gap-3">
              <a 
                href="mailto:admin@odchc.on.gov.ng" 
                className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-control bg-brand-navy text-white font-bold hover:bg-brand-navy/90 transition-all shadow-sm"
              >
                <Mail size={18} />
                Contact Commission Admin
              </a>
              <Button 
                variant="secondary" 
                className="w-full py-3 font-bold flex items-center justify-center gap-2"
                onClick={() => signOut()}
              >
                <LogOut size={18} />
                Sign Out
              </Button>
            </div>
          </div>

          <p className="text-[10px] text-center text-brand-subtle font-medium italic">
            Reference ID: {session?.user?.id.substring(0, 8).toUpperCase()} • Security Protocol NMIS-S1
          </p>
        </div>
      </div>
    </div>
  );
}
