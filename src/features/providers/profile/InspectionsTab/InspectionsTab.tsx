import React from 'react';
import { Calendar, CheckCircle2, ChevronRight, User } from 'lucide-react';
import Badge from '../../../../components/ui/Badge';
import Button from '../../../../components/ui/Button';
import { ProviderTabProps } from '../ProfileTabShell';
import { useInspections } from '../../../../hooks/inspections/inspectionsHooks';
import { LoadingState, EmptyState } from '../../../../components/ui/FeedbackStates';

export default function InspectionsTab({ provider }: ProviderTabProps) {
  const { data: allInspections = [], isLoading } = useInspections();

  const providerInspections = allInspections.filter(i => i.providerId === provider.id);

  if (isLoading) return <LoadingState title="Loading inspections..." />;
  if (providerInspections.length === 0) return <EmptyState title="No inspections found" description="There are no inspection records for this facility." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-brand-foreground uppercase tracking-wider">Inspection History</h3>
        <Badge variant="info">{providerInspections.length} Records</Badge>
      </div>

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
            {providerInspections.map(item => (
              <tr key={item.id}>
                <td><Badge variant="default">{item.type}</Badge></td>
                <td>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-brand-secondary">
                    <Calendar size={12} className="text-brand-subtle" />
                    {new Date(item.scheduledAt).toLocaleDateString()}
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-brand-secondary">
                    <User size={12} className="text-brand-subtle" />
                    {item.inspectorName}
                  </div>
                </td>
                <td className="text-center">
                  {item.score ? (
                    <span className="text-sm font-black text-brand-blue">{item.score}%</span>
                  ) : (
                    <span className="text-xs text-brand-muted italic">Pending</span>
                  )}
                </td>
                <td>
                  <Badge variant={item.status === 'completed' ? 'success' : 'warning'}>
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
    </div>
  );
}
