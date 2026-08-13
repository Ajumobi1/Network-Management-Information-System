import { History } from 'lucide-react';
import { ProviderTabProps } from '../ProfileTabShell';

export default function AuditLogTab({ provider: _provider }: ProviderTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">Audit Log & Event History</h3>
          <p className="text-xs text-slate-500">Immutable server-generated audit events for this provider profile.</p>
        </div>
      </div>
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-soft">
        <History className="mx-auto h-8 w-8 text-slate-400 mb-3" />
        <h4 className="font-semibold text-slate-800">No audit events recorded</h4>
        <p className="mt-1 text-xs text-slate-500">Server-side audit events and profile modification logs will appear here once recorded.</p>
      </div>
    </div>
  );
}
