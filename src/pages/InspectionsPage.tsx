import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle2, ChevronRight, Download, Filter, Plus, Search, User, X, ClipboardCheck, AlertCircle } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import KpiCard from '../components/ui/KpiCard';
import PageHeader from '../components/ui/PageHeader';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { useInspections, useInspection, useInspectionChecklist, useSaveInspection, useUpdateInspection } from '../hooks/inspections/inspectionsHooks';
import { useProviderDirectory } from '../features/providers/hooks';
import { Inspection, InspectionFilters } from '../types/inspections/inspectionsTypes';
import { LoadingState, ErrorState } from '../components/ui/FeedbackStates';
import { SectionHeader } from '../components/ui/LayoutComponents';
import ActiveFilterChips from '../components/ui/ActiveFilterChips';

export default function InspectionsPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<InspectionFilters>({ status: 'all', type: 'all', rating: 'all', search: '' });
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ providerId: '', type: 'Clinical', scheduledDate: '', inspectorName: '' });

  const { data: allInspections = [], isLoading, isError, refetch } = useInspections();
  const { data: providers = [] } = useProviderDirectory({
    search: '', status: 'all', contractStatus: 'all', credentialStatus: 'all', inspectionStatus: 'all',
    capitationStatus: 'all', lga: 'all', category: 'all', subcategory: 'all', ownership: 'all', service: 'all',
  });
  const saveInspectionMutation = useSaveInspection();
  const inspections = useMemo(() => {
    return allInspections.filter(item => {
      if (filters.status && filters.status !== 'all' && item.status !== filters.status) return false;
      if (filters.type && filters.type !== 'all' && item.type !== filters.type) return false;
      if (filters.rating && filters.rating !== 'all' && item.rating !== filters.rating) return false;
      if (filters.search) {
        const query = filters.search.toLowerCase();
        return (
          item.providerName.toLowerCase().includes(query) ||
          item.providerCode.toLowerCase().includes(query) ||
          item.inspectorName.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [allInspections, filters]);

  const summary = useMemo(() => {
    const completed = inspections.filter(i => i.status === 'completed').length;
    const scheduled = inspections.filter(i => i.status === 'scheduled').length;
    const needsFollowUp = inspections.filter(i => i.rating === 'poor' || i.rating === 'fair').length;
    return { completed, scheduled, needsFollowUp };
  }, [inspections]);

  const activeFilterChips = [
    filters.search ? { id: 'search', label: 'Search', value: filters.search } : null,
    filters.status !== 'all' ? { id: 'status', label: 'Status', value: filters.status! } : null,
    filters.type !== 'all' ? { id: 'type', label: 'Type', value: filters.type! } : null,
    filters.rating !== 'all' ? { id: 'rating', label: 'Rating', value: filters.rating! } : null,
  ].filter((chip): chip is { id: string; label: string; value: string } => Boolean(chip));

  const removeFilter = (id: string) => {
    setFilters(prev => ({ ...prev, [id]: id === 'search' ? '' : 'all' }));
  };

  const handleViewDetails = (id: string) => {
    setSelectedInspectionId(id);
    setIsDrawerOpen(true);
  };

  const handleExport = () => {
    const headers = ['Provider', 'Provider Code', 'Type', 'Scheduled Date', 'Inspector', 'Score', 'Rating', 'Status'];
    const rows = inspections.map(item => [item.providerName, item.providerCode, item.type, item.scheduledAt, item.inspectorName, item.score ?? '', item.rating ?? '', item.status]);
    const csv = [headers, ...rows].map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `nmis-inspection-schedule-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleSchedule = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!scheduleForm.providerId || !scheduleForm.scheduledDate) {
      window.alert('Select a provider and inspection date before scheduling.');
      return;
    }
    try {
      await saveInspectionMutation.mutateAsync({
        provider_id: scheduleForm.providerId,
        inspection_type: scheduleForm.type,
        scheduled_date: scheduleForm.scheduledDate,
        inspector_name: scheduleForm.inspectorName || null,
        status: 'Scheduled',
      });
      setIsScheduleModalOpen(false);
      setScheduleForm({ providerId: '', type: 'Clinical', scheduledDate: '', inspectorName: '' });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Failed to schedule inspection.');
    }
  };

  if (isError) return <main className="nmis-page"><ErrorState title="Inspections data unavailable" action={{ label: 'Retry', onClick: () => refetch() }} /></main>;

  return (
    <main className="nmis-page">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Quality & Compliance"
          title="Inspection Rounds"
          subtitle="Monitor scheduled inspections, completed reviews, and follow-up work across the provider network."
          actions={
            <div className="flex gap-2">
              <Button variant="secondary" className="gap-2" onClick={handleExport} disabled={!inspections.length}><Download size={16} /> Export Schedule</Button>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => navigate('/inspections/new')}><Plus size={16} /> New Accreditation Inspection</Button>
                <Button className="gap-2" onClick={() => setIsScheduleModalOpen(true)}><Plus size={16} /> Schedule Inspection</Button>
              </div>
            </div>
          }
        />

        <section className="grid gap-4 md:grid-cols-3">
          <KpiCard title="Due this week" value={summary.scheduled.toString()} subtitle="Scheduled field work" tone="primary" icon={<Calendar size={20} />} />
          <KpiCard title="Completed" value={summary.completed.toString()} subtitle="Completed inspections" tone="success" icon={<CheckCircle2 size={20} />} />
          <KpiCard title="Needs follow-up" value={summary.needsFollowUp.toString()} subtitle="Requires management review" tone="warning" icon={<AlertCircle size={20} />} />
        </section>

        {/* Filters */}
        <section className="nmis-card p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-subtle" />
              <Input
                placeholder="Search provider, code, or inspector..."
                className="pl-10"
                value={filters.search}
                onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select
                label="Status"
                value={filters.status}
                onChange={e => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                options={[{ label: 'All Statuses', value: 'all' }, { label: 'Scheduled', value: 'scheduled' }, { label: 'In Progress', value: 'in-progress' }, { label: 'Completed', value: 'completed' }]}
                className="w-40"
              />
              <Select
                label="Type"
                value={filters.type}
                onChange={e => setFilters(prev => ({ ...prev, type: e.target.value }))}
                options={[{ label: 'All Types', value: 'all' }, { label: 'Clinical', value: 'Clinical' }, { label: 'Compliance', value: 'Compliance' }, { label: 'Safety', value: 'Safety' }, { label: 'Licensing', value: 'Licensing' }]}
                className="w-40"
              />
              <Button variant="secondary" className="h-[2.625rem]" onClick={() => setFilters({ status: 'all', type: 'all', rating: 'all', search: '' })}>Reset</Button>
            </div>
          </div>
          <ActiveFilterChips chips={activeFilterChips} onRemove={removeFilter} onClear={() => setFilters({ status: 'all', type: 'all', rating: 'all', search: '' })} />
        </section>

        <div className="nmis-table-wrap">
          <div className="flex flex-col gap-3 border-b border-brand-divider bg-brand-surface/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
            <SectionHeader title="Inspection Schedule" subtitle={`${inspections.length} records in current view.`} />
            <Badge variant="info">Live Tracking</Badge>
          </div>

          <div className="nmis-table-scroll">
            <table className="nmis-table min-w-[1000px]">
              <thead>
                <tr>
                  <th>Provider / Facility</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Inspector</th>
                  <th className="text-center">Overall Score</th>
                  <th className="text-center">Credentialing</th>
                  <th className="text-center">Accreditation</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={9} className="py-20 text-center"><LoadingState title="Fetching inspections..." /></td></tr>
                ) : inspections.length === 0 ? (
                  <tr><td colSpan={9} className="py-20 text-center text-brand-muted">No inspections match the current filters.</td></tr>
                ) : (
                  inspections.map(item => (
                    <tr key={item.id} className="hover:bg-brand-surface/50 transition-colors">
                      <td>
                        <div>
                          <p className="font-bold text-brand-foreground">{item.providerName}</p>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">{item.providerCode}</p>
                        </div>
                      </td>
                      <td><Badge variant="default">{item.type}</Badge></td>
                      <td>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-brand-secondary">
                          <Calendar size={12} className="text-brand-subtle" />
                          {new Date(item.scheduledAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
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
                          <div className="inline-flex flex-col items-center">
                            <span className={`text-sm font-black ${item.score >= 90 ? 'text-status-success' : item.score >= 75 ? 'text-brand-blue' : 'text-status-warning'}`}>
                              {item.score}%
                            </span>
                            <span className="text-[9px] font-bold uppercase text-brand-muted">{item.rating}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-brand-muted italic">Pending</span>
                        )}
                      </td>
                      <td className="text-center">
                        {item.credentialingPossible ? <span className="text-xs font-black text-brand-blue">{item.credentialingPoints ?? 0}/{item.credentialingPossible}</span> : <span className="text-xs text-brand-muted">—</span>}
                      </td>
                      <td className="text-center">
                        {item.accreditationPossible ? <span className="text-xs font-black text-brand-blue">{item.accreditationPoints ?? 0}/{item.accreditationPossible}</span> : <span className="text-xs text-brand-muted">—</span>}
                      </td>
                      <td>
                        <Badge variant={item.status === 'completed' ? 'success' : item.status === 'scheduled' ? 'warning' : 'info'}>
                          {item.status.replace('-', ' ')}
                        </Badge>
                      </td>
                      <td className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(item.id)}><ChevronRight size={18} /></Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Inspection Review Drawer */}
      {isDrawerOpen && selectedInspectionId && (
        <InspectionDetailDrawer
          id={selectedInspectionId}
          onClose={() => {
            setIsDrawerOpen(false);
            setSelectedInspectionId(null);
          }}
        />
      )}

      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/40 p-4 backdrop-blur-sm">
          <form onSubmit={handleSchedule} className="w-full max-w-xl rounded-2xl border border-brand-divider bg-brand-card p-5 shadow-panel sm:p-6">
            <div className="flex items-start justify-between gap-3 border-b border-brand-divider pb-4">
              <div><p className="text-[10px] font-bold uppercase tracking-widest text-brand-blue">Quality & Compliance</p><h2 className="mt-1 text-xl font-black text-brand-foreground">Schedule inspection</h2></div>
              <button type="button" onClick={() => setIsScheduleModalOpen(false)} className="rounded-control p-2 text-brand-muted hover:bg-brand-surface"><X size={18} /></button>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2"><span className="nmis-label">Provider / Facility *</span><select className="nmis-control" value={scheduleForm.providerId} onChange={event => setScheduleForm(previous => ({ ...previous, providerId: event.target.value }))} required><option value="">Select a provider</option>{providers.map(provider => <option key={provider.id} value={provider.id}>{provider.providerName} · {provider.providerCode}</option>)}</select></label>
              <label><span className="nmis-label">Inspection type *</span><select className="nmis-control" value={scheduleForm.type} onChange={event => setScheduleForm(previous => ({ ...previous, type: event.target.value }))}><option value="Clinical">Clinical</option><option value="Compliance">Compliance</option><option value="Safety">Safety</option><option value="Licensing">Licensing</option><option value="Operational">Operational</option></select></label>
              <label><span className="nmis-label">Scheduled date *</span><input type="date" className="nmis-control" value={scheduleForm.scheduledDate} onChange={event => setScheduleForm(previous => ({ ...previous, scheduledDate: event.target.value }))} required /></label>
              <label className="sm:col-span-2"><span className="nmis-label">Inspector / officer</span><input className="nmis-control" placeholder="Assign an inspector" value={scheduleForm.inspectorName} onChange={event => setScheduleForm(previous => ({ ...previous, inspectorName: event.target.value }))} /></label>
            </div>
            <div className="mt-6 flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setIsScheduleModalOpen(false)}>Cancel</Button><Button type="submit" disabled={saveInspectionMutation.isPending}>{saveInspectionMutation.isPending ? 'Scheduling...' : 'Schedule inspection'}</Button></div>
          </form>
        </div>
      )}
    </main>
  );
}

function InspectionDetailDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const { data: inspection, isLoading } = useInspection(id);
  const updateInspectionMutation = useUpdateInspection();

  const handleComplete = async () => {
    try {
      await updateInspectionMutation.mutateAsync({ id, payload: { status: 'Completed' } });
      onClose();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Failed to mark inspection as completed.');
    }
  };
  const { data: checklist = [], isLoading: isChecklistLoading } = useInspectionChecklist(id);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end bg-brand-navy/40 backdrop-blur-sm animate-in fade-in duration-200 sm:items-stretch">
      <div className="flex max-h-[92dvh] h-full w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-brand-card shadow-panel animate-in slide-in-from-right duration-300 sm:max-h-none sm:rounded-none">
        <div className="flex items-start justify-between gap-3 border-b border-brand-divider bg-brand-surface/50 p-4 sm:p-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-blue">Inspection Review</p>
            <h2 className="mt-1 text-xl font-black text-brand-foreground">
              {isLoading ? 'Loading...' : (inspection?.providerName || 'Provider Facility')}
            </h2>
          </div>
          <button onClick={onClose} className="rounded-control p-2 text-brand-muted hover:bg-brand-surface hover:text-brand-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto p-4 sm:p-6">
          {isLoading ? (
            <LoadingState title="Loading details..." />
          ) : inspection ? (
            <>
              <section className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-control border border-brand-divider bg-brand-surface p-4">
                  <p className="nmis-label">Status & Rating</p>
                  <div className="mt-2 flex items-center gap-3">
                    <Badge variant={inspection.status === 'completed' ? 'success' : 'warning'}>{inspection.status}</Badge>
                    {inspection.score && <span className="text-lg font-black text-brand-foreground">{inspection.score}%</span>}
                    {inspection.rating && <Badge variant="info" className="uppercase">{inspection.rating}</Badge>}
                  </div>
                </div>
                <div className="rounded-control border border-brand-divider bg-brand-surface p-4">
                  <p className="nmis-label">Scheduled Date</p>
                  <p className="mt-2 font-bold text-brand-foreground">
                    {new Date(inspection.scheduledAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              </section>

              <section className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-control border border-brand-divider bg-brand-soft p-4">
                  <p className="nmis-label">Overall Score</p>
                  <p className="mt-2 text-2xl font-black text-brand-blue">{inspection.score ?? 0}%</p>
                </div>
                <div className="rounded-control border border-brand-divider bg-brand-surface p-4">
                  <p className="nmis-label">Credentialing Score</p>
                  <p className="mt-2 text-xl font-black text-brand-blue">{inspection.credentialingPoints ?? 0} / {inspection.credentialingPossible ?? 0}</p>
                  <p className="mt-1 text-xs text-brand-muted">Personnel licences and qualifications</p>
                </div>
                <div className="rounded-control border border-brand-divider bg-brand-surface p-4">
                  <p className="nmis-label">Accreditation Score</p>
                  <p className="mt-2 text-xl font-black text-brand-blue">{inspection.accreditationPoints ?? 0} / {inspection.accreditationPossible ?? 0}</p>
                  <p className="mt-1 text-xs text-brand-muted">Infrastructure and Essential Services</p>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-brand-blue">
                  <ClipboardCheck size={18} />
                  <h3 className="text-sm font-black uppercase tracking-wider">Inspection Checklist</h3>
                </div>

                {isChecklistLoading ? (
                  <LoadingState title="Loading checklist..." />
                ) : (
                  <div className="space-y-3">
                    {checklist.map(item => (
                      <div key={item.id} className="flex items-start gap-4 rounded-control border border-brand-divider bg-brand-surface p-4">
                        <div className={`mt-0.5 rounded-full p-1 ${item.completed ? 'bg-status-successSoft text-status-success' : 'bg-brand-soft text-brand-muted'}`}>
                          <CheckCircle2 size={16} />
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-bold ${item.completed ? 'text-brand-foreground' : 'text-brand-secondary'}`}>{item.item}</p>
                          {item.comments && <p className="mt-1 text-xs text-brand-muted italic">"{item.comments}"</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-brand-blue">
                  <ClipboardCheck size={18} />
                  <h3 className="text-sm font-black uppercase tracking-wider">Inspector Notes</h3>
                </div>
                <div className="rounded-control border border-brand-divider bg-brand-surface p-4">
                  <p className="text-sm leading-relaxed text-brand-secondary">
                    {inspection.findings || 'No notes provided for this inspection.'}
                  </p>
                </div>
              </section>
            </>
          ) : (
            <ErrorState title="Inspection not found" />
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-brand-divider bg-brand-surface/50 p-4 sm:flex-row sm:justify-end sm:p-6">
          <Button variant="secondary" className="w-full sm:w-auto" onClick={onClose}>Close Review</Button>
          <Button className="w-full sm:w-auto" onClick={handleComplete} disabled={!inspection || inspection.status === 'completed' || updateInspectionMutation.isPending}>{updateInspectionMutation.isPending ? 'Saving...' : 'Mark as Completed'}</Button>
        </div>
      </div>
    </div>
  );
}
