import Badge from '../../../../components/ui/Badge';
import { ProviderLifecycleStatus, ProviderWorkflowStatus } from '../../types';

const statusVariant: Record<ProviderLifecycleStatus | ProviderWorkflowStatus, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  active: 'success',
  inactive: 'default',
  pending: 'warning',
  suspended: 'error',
  blacklisted: 'error',
  expired: 'error',
  complete: 'success',
  'in-review': 'info',
  'not-started': 'default',
  flagged: 'warning',
};

export function formatProviderLabel(value: string) {
  return value.replace(/-/g, ' ').replace(/\b\w/g, (letter: string) => letter.toUpperCase());
}

export default function ProviderStatusBadge({ status }: { status: ProviderLifecycleStatus | ProviderWorkflowStatus }) {
  return <Badge variant={statusVariant[status]}>{formatProviderLabel(status)}</Badge>;
}
