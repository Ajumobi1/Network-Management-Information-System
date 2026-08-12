import { useState } from 'react';
import { Eye, Power, RotateCcw } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import { useUpdateProviderStatus } from '../../hooks';
import { ProviderLifecycleStatus } from '../../types';
import { isSecureContractError } from '../../../../lib/security/secureContracts';

function actionErrorMessage(error: unknown): string {
  if (isSecureContractError(error)) return error.message;
  return 'The provider lifecycle change was not completed. No status was changed.';
}

export default function ProviderQuickActions({
  providerId,
  status,
  onSelect,
}: {
  providerId: string;
  status: ProviderLifecycleStatus;
  onSelect: (providerId: string) => void;
}) {
  const updateStatus = useUpdateProviderStatus();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isActive = status === ProviderLifecycleStatus.Active;
  const isInactive = status === ProviderLifecycleStatus.Inactive;
  const canChangeLifecycle = isActive || isInactive;

  function changeStatus(nextStatus: ProviderLifecycleStatus) {
    const verb = nextStatus === ProviderLifecycleStatus.Active ? 'restore' : 'deactivate';
    if (!window.confirm(`Are you sure you want to ${verb} this provider?`)) return;
    setErrorMessage(null);
    updateStatus.mutate(
      { id: providerId, status: nextStatus },
      { onError: error => setErrorMessage(actionErrorMessage(error)) },
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-1">
        <Button variant="ghost" className="gap-1 text-xs px-2 py-1" onClick={() => onSelect(providerId)}>
          <Eye className="h-3.5 w-3.5" /> View
        </Button>
        {isActive ? (
          <Button
            variant="ghost"
            className="gap-1 text-xs px-2 py-1 text-amber-600 hover:text-amber-700"
            disabled={updateStatus.isPending}
            onClick={() => changeStatus(ProviderLifecycleStatus.Inactive)}
          >
            <Power className="h-3.5 w-3.5" /> {updateStatus.isPending ? 'Updating...' : 'Deactivate'}
          </Button>
        ) : (
          <Button
            variant="ghost"
            className="gap-1 text-xs px-2 py-1 text-emerald-600 hover:text-emerald-700"
            disabled={!canChangeLifecycle || updateStatus.isPending}
            title={!canChangeLifecycle ? 'This lifecycle transition requires a separately approved workflow.' : undefined}
            onClick={() => isInactive && changeStatus(ProviderLifecycleStatus.Active)}
          >
            <RotateCcw className="h-3.5 w-3.5" /> {updateStatus.isPending ? 'Updating...' : 'Restore'}
          </Button>
        )}
      </div>
      {errorMessage && <p role="alert" className="max-w-52 text-center text-[11px] leading-4 text-red-700">{errorMessage}</p>}
    </div>
  );
}
