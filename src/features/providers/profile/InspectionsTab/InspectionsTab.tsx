import { useEffect, useMemo, useState } from 'react';
import { Calendar, CheckCircle2, Download, FilePenLine, Plus, ShieldAlert, User, ClipboardCheck, AlertCircle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import Badge from '../../../../components/ui/Badge';
import Button from '../../../../components/ui/Button';
import { ProviderTabProps } from '../ProfileTabShell';
import { useInspections, useSaveInspection } from '../../../../hooks/inspections/inspectionsHooks';
import { LoadingState, EmptyState } from '../../../../components/ui/FeedbackStates';
import { isSecureContractError } from '../../../../lib/security/secureContracts';
import { subscribeToTable, unsubscribe } from '../../../../lib/supabase/realtime';
import { InspectionDetailDrawer, facilityTypeCodeFromInspectionType } from '../../../../pages/InspectionsPage';

function csvCell(value: unknown) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function facilityTypeCodeFromProvider(provider: any) {
  const category = String(provider.category || '').toLowerCase();
  const ownership = String(provider.ownership || '').toLowerCase();
  if (category.includes('hospital')) return ownership.includes('government') ? 'government-hospital' : 'private-hospital';
  if (category.includes('pharmacy')) return 'pharmacy';
  if (category.includes('optical')) return 'optical-centre';
  if (category.includes('dental')) return 'dental-centre';
  if (category.includes('diagnostic')) return 'diagnostic-centre';
  return 'pharmacy';
}

export default function InspectionsTab({ provider }: ProviderTabProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: allInspections = [], isLoading, isError, error } = useInspections(provider.id);
  const saveMutation = useSaveInspection();
  const [actionError, setActionError] = useState('');
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(null);

  useEffect(() => {
    const channel = subscribeToTable('inspections', () => {
      queryClient.invalidateQueries({ queryKey: ['inspections', provider.id] });
    });
    return () => { unsubscribe(channel); };
  }, [provider.id, queryClient]);

  const providerInspections = useMemo(() => allInspections.filter((inspection: any) => (inspection.providerId || inspection.provider_id) === provider.id), [allInspections, provider.id]);
  const summary = useMemo(() => ({
    total: providerInspections.length,
    active: providerInspections.filter((item: any) => ['scheduled', 'in-progress', 'draft'].includes(String(item.status).toLowerCase())).length,
    submitted: providerInspections.filter((item: any) => ['submitted', 'completed'].includes(String(item.status).toLowerCase())).length,
    followUp: providerInspections.filter((item: any) => ['poor', 'fair'].includes(String(item.rating || '').toLowerCase())).length,
  }), [providerInspections]);

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

  const handleExportHistory = () => {
    const headers = ['Provider', 'Provider Code', 'Inspection Type', 'Date', 'Inspector', 'Overall Score', 'Credentialing', 'Accreditation', 'Rating', 'Status'];
    const rows = providerInspections.map((item: any) => [
      provider.providerName,
      provider.providerCode,
      item.type,
      item.scheduledAt,
      item.inspectorName,
      item.score ?? '',
      item.credentialingPoints !== null && item.credentialingPossible !== null ? `${item.credentialingPoints ?? 0}/${item.credentialingPossible ?? 0}` : '',
      item.accreditationPoints !== null && item.accreditationPossible !== null ? `${item.accreditationPoints ?? 0}/${item.accreditationPossible ?? 0}` : '',
      item.rating ?? '',
      item.status,
    ]);
    const csv = [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `nmis-${provider.providerCode || 'provider'}-inspection-history-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleEdit = (inspection: { id: string; type: string }) => {
    navigate(`/inspections/new?inspectionId=${encodeURIComponent(inspection.id)}&facilityType=${encodeURIComponent(facilityTypeCodeFromInspectionType(inspection.type))}`);
  };

  if (isLoading) return <LoadingState title="Loading inspections..." />;

  if (isError) {
    const secureUnavailable = isSecureContractError(error);
    return (
      <div className="rounded-card border border-amber-200 bg-amber-50 p-6 text-center text-amber-800">
        <ShieldAlert className="mx-auto mb-2 h-8 w-8" />
        <h4 className="font-semibold">{secureUnavailable ? 'Secure inspection contract unavailable' : 'Unable to load inspections'}</h4>
        <p className="mt-1 text-sm">{error instanceof Error ? error.message : 'An unexpected error occurred.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-panel border border-[#174b78] bg-[linear-gradient(120deg,#071c4b_0%,#0b3d72_56%,#0b65a1_100%)] p-5 text-white shadow-[0_22px_50px_-30px_rgba(7,28,75,0.8)] sm:p-6">
        <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full border border-white/10 bg-white/[0.04]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#ffbe6a]"><ClipboardCheck size={14} /> Quality & Compliance</div>
            <h3 className="mt-3 text-2xl font-black tracking-tight">Inspection history</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">Manage every scheduled, drafted, submitted, and completed inspection for this provider from one authoritative workspace.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white" onClick={handleExportHistory} disabled={!providerInspections.length}><Download size={15} /> Export History</Button>
            <Button variant="secondary" size="sm" className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white" onClick={() => navigate(`/inspections/new?providerId=${encodeURIComponent(provider.id)}&facilityType=${encodeURIComponent(facilityTypeCodeFromProvider(provider))}`)}><Plus size={15} /> New Inspection</Button>
            <Button size="sm" className="bg-[#f7931e] text-white hover:bg-[#ff9f2f]" onClick={handleScheduleRoutine} disabled={saveMutation.isPending}><Calendar size={15} /> {saveMutation.isPending ? 'Scheduling...' : 'Schedule Inspection'}</Button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-panel border border-[#cfe0ee] bg-gradient-to-br from-white to-[#eef6fb] p-4"><p className="nmis-kpi-label">Total rounds</p><p className="mt-2 text-2xl font-black text-[#123b5d]">{summary.total}</p><p className="mt-1 text-xs text-[#55738b]">Complete provider history</p></div>
        <div className="rounded-panel border border-[#f4d3ae] bg-gradient-to-br from-white to-[#fff8ef] p-4"><p className="nmis-kpi-label">Active work</p><p className="mt-2 text-2xl font-black text-[#b45309]">{summary.active}</p><p className="mt-1 text-xs text-[#55738b]">Draft, scheduled, or in progress</p></div>
        <div className="rounded-panel border border-[#cdebd8] bg-gradient-to-br from-white to-[#edf9f2] p-4"><p className="nmis-kpi-label">Submitted outcomes</p><p className="mt-2 text-2xl font-black text-[#15803d]">{summary.submitted}</p><p className="mt-1 text-xs text-[#55738b]">Available for review and export</p></div>
        <div className="rounded-panel border border-[#f3cccc] bg-gradient-to-br from-white to-[#fff3f1] p-4"><p className="nmis-kpi-label">Needs follow-up</p><p className="mt-2 text-2xl font-black text-[#b91c1c]">{summary.followUp}</p><p className="mt-1 text-xs text-[#55738b]">Fair or poor outcomes</p></div>
      </section>

      {actionError && <div className="rounded-card border border-status-error/20 bg-status-errorSoft p-3 text-sm text-status-error">{actionError}</div>}

      <section className="rounded-panel border border-[#d6e5f0] bg-white shadow-[0_14px_35px_-28px_rgba(11,79,130,0.55)]">
        <div className="flex flex-col gap-3 border-b border-[#cfe0ee] bg-gradient-to-r from-[#eef6fb] via-white to-[#fff8ef] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0b65a1]">Provider inspection register</p><h4 className="mt-1 text-lg font-black text-[#123b5d]">{provider.providerName}</h4><p className="mt-1 text-xs text-[#55738b]">Submitted and completed inspections can be edited, updated, and re-submitted.</p></div>
          <Badge variant="info">{providerInspections.length} Records</Badge>
        </div>

        {providerInspections.length === 0 ? <div className="p-10"><EmptyState title="No inspections found" description="There are no inspection records for this facility yet. Schedule the first inspection to begin the compliance history." /></div> : (
          <div className="nmis-table-scroll">
            <table className="nmis-table min-w-[980px]">
              <thead className="bg-[#0b4f82]"><tr className="border-0"><th className="!text-white/80">Inspection Type</th><th className="!text-white/80">Date</th><th className="!text-white/80">Inspector</th><th className="!text-white/80 text-center">Overall</th><th className="!text-white/80 text-center">Credentialing</th><th className="!text-white/80 text-center">Accreditation</th><th className="!text-white/80">Status</th><th className="!text-white/80 text-right">Actions</th></tr></thead>
              <tbody>{providerInspections.map((item: any) => {
                const normalizedStatus = String(item.status || '').toLowerCase();
                const isSubmitted = normalizedStatus === 'submitted' || normalizedStatus === 'completed';
                return <tr key={item.id} className="odd:bg-white even:bg-[#fbfdff] transition-colors hover:!bg-[#fff8ef]">
                  <td><Badge variant="info" className="border border-[#cfe0ee] bg-[#eef6fb] text-[#0b65a1]">{item.type}</Badge></td>
                  <td><div className="flex items-center gap-1.5 text-xs font-medium text-brand-secondary"><Calendar size={12} className="text-[#f7931e]" />{item.scheduledAt ? new Date(item.scheduledAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</div></td>
                  <td><div className="flex items-center gap-1.5 text-xs font-medium text-brand-secondary"><User size={12} className="text-[#0b65a1]" />{item.inspectorName || 'Inspector General'}</div></td>
                  <td className="text-center">{item.score !== null && item.score !== undefined ? <span className="inline-flex rounded-control border border-[#cfe0ee] bg-[#eef6fb] px-2.5 py-1.5 text-sm font-black tabular-nums text-[#0b4f82]">{item.score}%</span> : <span className="text-xs italic text-brand-muted">Pending</span>}</td>
                  <td className="text-center">{item.credentialingPossible ? <span className="inline-flex rounded-control border border-[#cfe0ee] bg-[#f4f9fc] px-2 py-1 text-xs font-black tabular-nums text-[#0b4f82]">{item.credentialingPoints ?? 0}/{item.credentialingPossible}</span> : <span className="text-xs text-brand-muted">—</span>}</td>
                  <td className="text-center">{item.accreditationPossible ? <span className="inline-flex rounded-control border border-[#f4d3ae] bg-[#fff8ef] px-2 py-1 text-xs font-black tabular-nums text-[#b45309]">{item.accreditationPoints ?? 0}/{item.accreditationPossible}</span> : <span className="text-xs text-brand-muted">—</span>}</td>
                  <td><Badge variant={isSubmitted ? 'success' : normalizedStatus === 'draft' ? 'warning' : 'info'}>{normalizedStatus.replace('-', ' ')}</Badge></td>
                  <td className="text-right"><div className="flex justify-end gap-2"><Button variant="ghost" size="sm" className="rounded-full bg-[#eef6fb] text-[#0b65a1] hover:bg-[#0b4f82] hover:text-white" onClick={() => setSelectedInspectionId(item.id)}><span className="hidden sm:inline">Review</span><ChevronRight size={16} /></Button>{isSubmitted ? <Button variant="secondary" size="sm" className="border-[#f4d3ae] bg-[#fff8ef] text-[#b45309] hover:bg-[#f7931e] hover:text-white" onClick={() => handleEdit(item)}><FilePenLine size={14} /><span className="hidden xl:inline">Edit</span></Button> : null}</div></td>
                </tr>;
              })}</tbody>
            </table>
          </div>
        )}
      </section>

      {selectedInspectionId ? <InspectionDetailDrawer id={selectedInspectionId} onEdit={handleEdit} onClose={() => setSelectedInspectionId(null)} /> : null}
    </div>
  );
}
