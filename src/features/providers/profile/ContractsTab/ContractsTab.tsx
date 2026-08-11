import ProviderStatusBadge from '../../components/ProviderStatusBadge';
import { ProviderTabProps } from '../ProfileTabShell';

export default function ContractsTab({ provider }: ProviderTabProps) {
  return <div className="rounded-3xl bg-slate-50 p-5"><p className="mb-3 text-sm text-slate-500">Contract status</p><ProviderStatusBadge status={provider.contractStatus} /></div>;
}
