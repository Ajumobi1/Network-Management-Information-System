import ProviderStatusBadge from '../../components/ProviderStatusBadge';
import { ProviderTabProps } from '../ProfileTabShell';

export default function ContractsTab({ provider }: ProviderTabProps) {
  const contractStatus = provider.contractStatus;

  return (
    <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5" aria-labelledby="provider-contract-status">
      <p id="provider-contract-status" className="mb-3 text-sm font-semibold text-slate-500">Contract status</p>
      {contractStatus ? (
        <ProviderStatusBadge status={contractStatus} />
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5">
          <p className="font-semibold text-slate-800">No contract data</p>
          <p className="mt-1 text-sm text-slate-500">
            No contract record has been registered for this provider yet.
          </p>
        </div>
      )}
    </section>
  );
}
