import ProviderStatusBadge from '../../components/ProviderStatusBadge';
import { ProviderTabProps } from '../ProfileTabShell';

export default function CapitationTab({ provider }: ProviderTabProps) {
  return <div className="rounded-3xl bg-slate-50 p-5"><p className="mb-3 text-sm text-slate-500">Capitation status</p><ProviderStatusBadge status={provider.capitationStatus} /></div>;
}
