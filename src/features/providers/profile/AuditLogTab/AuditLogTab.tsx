import { ProviderTabProps } from '../ProfileTabShell';

export default function AuditLogTab({ provider }: ProviderTabProps) {
  return <div className="rounded-3xl bg-slate-50 p-5 text-sm text-slate-600">Audit trail prepared for {provider.providerCode}. Events will bind to audit log repository when Supabase tables are connected.</div>;
}
