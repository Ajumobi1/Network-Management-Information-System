import { useState } from 'react';
import { Calendar, User, ChevronRight, Plus, ShieldAlert } from 'lucide-react';
import Badge from '../../../../components/ui/Badge';
import Button from '../../../../components/ui/Button';
import { ProviderTabProps } from '../ProfileTabShell';
import { useInspections, useSaveInspection } from '../../../../hooks/inspections/inspectionsHooks';
import { LoadingState, EmptyState } from '../../../../components/ui/FeedbackStates';
import { isSecureContractError } from '../../../../lib/security/secureContracts';

export default function InspectionsTab({ provider }: ProviderTabProps) {
  const { data: allInspections = [], isLoading, isError, error } = useInspections(provider.id);
  const saveMutation = useSaveInspection();
  const [actionError, setActionError] = useState('');

  const handleScheduleRoutine = async () => {
    setActionError('');
    try {
      await saveMutation.mutateAsync({
        provider_id: provider.id,
        inspection_type: 'Routine Facility Quality Audit',
        scheduled_date: new Date().toISOString().split('T')[0],
        status: 'Scheduled',
      });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to schedule inspection');
    }
  };

  if (isLoading) return <LoadingState title="Loading inspections..." />;
  
  if (isError) {
    const secureUnavailable = isSecureContractError(error);
    return (
      <div className="rounded-card border border-amber-200 bg-amber-50 p-6 text-center text-amber-800">
        <ShieldAlert className="mx-auto h-8 w-8 mb-2" />
        <h4 className="font-semibold">{secureUnavailable ? 'Secure inspection contract unavailable' : 'Unable to load inspections'}</h4>
        <p className="mt-1 text-sm">{error instanceof Error ? error.message : 'An unexpected error occurred.'}</p>
      </div>
    );
  }

  const providerInspections = allInspections.filter((i: any) => (i.provider_id || i.providerId) === provider.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-brand-foreground uppercase tracking-wider">Inspection History</h3>
          <p className="text-xs text-slate-500">Scheduled audits, facility scoring, and compliance ratings.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="info">{providerInspections.length} Records</Badge>
          <Button variant="secondary" size="sm" className="gap-2" onClick={handleScheduleRoutine} disabled={saveMutation.isPending}>
            <Plus size={14} /> Schedule Inspection
          </Button>
        </div>
      </div>

      {actionError && (
        <div className="rounded-card bg-status-errorSoft p-3 text-sm text-status-error border border-status-error/20">
          {actionError}
        </div>
      )}

      {providerInspections.length === 0 ? (
        <EmptyState title="No inspections found" description="There are no inspection records for this facility." />
      ) : (
        <div className="nmis-table-wrap">
          <table className="nmis-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Date</th>
                <th>Inspector</th>
                <th className="text-center">Score</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {providerInspections.map((item: any) => (
                <tr key={item.id}>
                  <td><Badge variant="default">{item.inspection_type || item.type}</Badge></td>
                  <td>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-brand-secondary">
                      <Calendar size={12} className="text-brand-subtle" />
                      {item.scheduled_date || item.date || 'N/A'}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-brand-secondary">
                      <User size={12} className="text-brand-subtle" />
                      {item.inspector_name || item.inspector || 'Unassigned'}
                    </div>
                  </td>
                  <td className="text-center">
                    {item.score !== undefined && item.score !== null ? (
                      <span className="text-sm font-black text-brand-blue">{item.score}%</span>
                    ) : (
                      <span className="text-xs text-brand-muted italic">Pending</span>
                    )}
                  </td>
                  <td>
                    <Badge variant={item.status === 'Completed' || item.status === 'completed' ? 'success' : 'warning'}>
                      {item.status}
                    </Badge>
                  </td>
                  <td className="text-right">
                    <Button variant="ghost" size="sm" disabled><ChevronRight size={16} /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
