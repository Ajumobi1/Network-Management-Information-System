import { FileText } from 'lucide-react';
import ProviderStatusBadge from '../../components/ProviderStatusBadge';
import { ProviderTabProps } from '../ProfileTabShell';

export default function DocumentsTab({ provider }: ProviderTabProps) {
  return (
    <div className="space-y-3">
      {provider.documents.map(document => (
        <div key={document.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{document.type}</p>
            <p className="text-xs text-slate-500">{document.version} • expires {document.expiryDate}</p>
          </div>
          <div className="flex items-center gap-2"><ProviderStatusBadge status={document.status} /><FileText className="h-4 w-4 text-slate-500" /></div>
        </div>
      ))}
    </div>
  );
}
