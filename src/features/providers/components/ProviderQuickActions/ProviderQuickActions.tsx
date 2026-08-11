import { Eye, Power, RotateCcw } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import { useUpdateProviderStatus, useProviderProfile } from '../../hooks';
import { ProviderLifecycleStatus } from '../../types';

export default function ProviderQuickActions({ providerId, onSelect }: { providerId: string; onSelect: (providerId: string) => void }) {
  const { data: profile } = useProviderProfile(providerId);
  const updateStatus = useUpdateProviderStatus();
  const isActive = profile?.status === ProviderLifecycleStatus.Active;

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" className="gap-1 text-xs px-2 py-1" onClick={() => onSelect(providerId)}>
        <Eye className="h-3.5 w-3.5" /> View
      </Button>
      {isActive ? (
        <Button
          variant="ghost"
          className="gap-1 text-xs px-2 py-1 text-amber-600 hover:text-amber-700"
          onClick={() => {
            if (window.confirm('Are you sure you want to deactivate this provider?')) {
              updateStatus.mutate({ id: providerId, status: ProviderLifecycleStatus.Inactive });
            }
          }}
        >
          <Power className="h-3.5 w-3.5" /> Deactivate
        </Button>
      ) : (
        <Button
          variant="ghost"
          className="gap-1 text-xs px-2 py-1 text-emerald-600 hover:text-emerald-700"
          onClick={() => {
            if (window.confirm('Are you sure you want to restore this provider to active status?')) {
              updateStatus.mutate({ id: providerId, status: ProviderLifecycleStatus.Active });
            }
          }}
        >
          <RotateCcw className="h-3.5 w-3.5" /> Restore
        </Button>
      )}
    </div>
  );
}
