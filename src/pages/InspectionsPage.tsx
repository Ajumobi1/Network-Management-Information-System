import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle2, ChevronRight, Download, Filter, Plus, Search, User, X, ClipboardCheck, AlertCircle, FilePenLine, Map as MapIcon, List } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import KpiCard from '../components/ui/KpiCard';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { useInspections, useInspection, useInspectionChecklist, useSaveInspection, useUpdateInspection } from '../hooks/inspections/inspectionsHooks';
import { useStructuredInspection } from '../hooks/inspections/structuredInspectionHooks';
import { providerDocumentsRepository } from '../repositories/providers/providerDocumentsRepository';
import { useEffect } from 'react';
import { subscribeToTable, unsubscribe } from '../lib/supabase/realtime';
import { useQueryClient } from '@tanstack/react-query';
import { buildInspectionReportPdf, downloadPdf, inspectionReportFileName, pdfBytesToBlob, reportStoragePath } from '../features/inspections/inspectionReportPdf';
import { exportInspectionCsv } from '../features/inspections/inspectionReportCsv';
import { exportInspectionDocx } from '../features/inspections/inspectionReportDocx';
import { useProviderDirectory } from '../features/providers/hooks';
import { Inspection, InspectionFilters } from '../types/inspections/inspectionsTypes';
import { LoadingState, ErrorState } from '../components/ui/FeedbackStates';
import { SectionHeader } from '../components/ui/LayoutComponents';
import ActiveFilterChips from '../components/ui/ActiveFilterChips';

export function facilityTypeCodeFromInspectionType(type: string, providerCategory?: string | null, providerOwnership?: string | null, explicitFacilityTypeCode?: string | null) {
  if (explicitFacilityTypeCode) return explicitFacilityTypeCode;
  const normalized = String(type || '').toLowerCase();
  if (normalized.includes('government') && normalized.includes('hospital')) return 'government-hospital';
  if ((normalized.includes('private') || normalized.includes('primary services')) && normalized.includes('hospital')) return 'private-hospital';
  if (normalized.includes('optical')) return 'optical-centre';
  if (normalized.includes('dental')) return 'dental-centre';
  if (normalized.includes('diagnostic')) return 'diagnostic-centre';
  if (normalized.includes('pharmacy')) return 'pharmacy';
  const category = String(providerCategory || '').toLowerCase();
  const ownership = String(providerOwnership || '').toLowerCase();
  if (category.includes('hospital')) return ownership.includes('government') ? 'government-hospital' : 'private-hospital';
  if (category.includes('optical')) return 'optical-centre';
  if (category.includes('dental')) return 'dental-centre';
  if (category.includes('diagnostic')) return 'diagnostic-centre';
  if (category.includes('pharmacy')) return 'pharmacy';
  return 'pharmacy';
}

export default function InspectionsPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<InspectionFilters>({ status: 'all', type: 'all', rating: 'all', search: '' });
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ providerId: '', type: 'Clinical', scheduledDate: '', inspectorName: '' });

  const { data: allInspections = [], isLoading, isError, refetch } = useInspections();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [focusedLocation, setFocusedLocation] = useState<{ name: string; query: string } | null>(null);

  useEffect(() => {
    const channel = subscribeToTable('inspections', () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
    });
    return () => { unsubscribe(channel); };
  }, [queryClient]);

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
    const completed = inspections.filter(i => i.status === 'completed' || i.status === 'submitted').length;
    const scheduled = inspections.filter(i => i.status === 'scheduled').length;
    const drafts = inspections.filter(i => i.status === 'draft').length;
    const needsFollowUp = inspections.filter(i => i.rating === 'poor' || i.rating === 'fair').length;
    return { completed, scheduled, drafts, needsFollowUp };
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

  const handleOpenInspection = (item: any) => {
    if (item.status === 'draft') {
      navigate(`/inspections/new?draftId=${encodeURIComponent(item.id)}&facilityType=${encodeURIComponent(facilityTypeCodeFromInspectionType(item.type))}`);
      return;
    }
    handleViewDetails(item.id);
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
        <section className="relative isolate overflow-hidden rounded-panel border border-[#174b78] bg-[linear-gradient(120deg,#071c4b_0%,#0b3d72_52%,#0b65a1_100%)] px-5 py-6 text-white shadow-[0_22px_50px_-30px_rgba(7,28,75,0.8)] sm:px-7 sm:py-7">
          <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full border border-white/10 bg-white/[0.04]" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-28 right-28 h-64 w-64 rounded-full border border-[#f7931e]/20 bg-[#f7931e]/10" aria-hidden="true" />
          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#ffbe6a]"><ClipboardCheck size={14} /> Quality & Compliance</div>
              <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">Inspection Rounds</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">Monitor scheduled inspections, completed reviews, and follow-up work across the provider network.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
              <Button variant="secondary" className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white" onClick={handleExport} disabled={!inspections.length}><Download size={16} /> Export Schedule</Button>
              <Button variant="secondary" className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white" onClick={() => navigate('/inspections/new')}><Plus size={16} /> New Accreditation Inspection</Button>
              <Button className="bg-[#f7931e] text-white shadow-lg shadow-orange-950/20 hover:bg-[#ff9f2f]" onClick={() => setIsScheduleModalOpen(true)}><Plus size={16} /> Schedule Inspection</Button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard title="Due this week" value={summary.scheduled.toString()} subtitle="Scheduled field work" tone="primary" icon={<Calendar size={20} />} className="border-[#cfe0ee] bg-gradient-to-br from-white via-white to-[#eef6fb]" />
          <KpiCard title="Drafts" value={summary.drafts.toString()} subtitle="Saved inspections to resume" tone="warning" icon={<FilePenLine size={20} />} className="border-[#f4d3ae] bg-gradient-to-br from-white via-white to-[#fff8ef]" />
          <KpiCard title="Submitted" value={summary.completed.toString()} subtitle="Submitted inspection outcomes" tone="success" icon={<CheckCircle2 size={20} />} className="border-[#cdebd8] bg-gradient-to-br from-white via-white to-[#edf9f2]" />
          <KpiCard title="Needs follow-up" value={summary.needsFollowUp.toString()} subtitle="Requires management review" tone="danger" icon={<AlertCircle size={20} />} className="border-[#f3cccc] bg-gradient-to-br from-white via-white to-[#fff3f1]" />
        </section>

        {/* Filters */}
        <section className="relative overflow-hidden rounded-panel border border-[#d6e5f0] bg-gradient-to-br from-white via-white to-[#f2f8fc] p-4 shadow-[0_14px_35px_-28px_rgba(11,79,130,0.55)] sm:p-5">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#0b4f82] via-[#0b65a1] to-[#f7931e]" aria-hidden="true" />
          <div className="mb-4 flex items-center gap-2 pt-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#0b65a1]"><Filter size={14} /> Round controls</div>
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
                options={[{ label: 'All Statuses', value: 'all' }, { label: 'Drafts', value: 'draft' }, { label: 'Scheduled', value: 'scheduled' }, { label: 'In Progress', value: 'in-progress' }, { label: 'Submitted', value: 'submitted' }, { label: 'Completed', value: 'completed' }]}
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
          <div className="flex flex-col gap-3 border-b border-[#cfe0ee] bg-gradient-to-r from-[#eef6fb] via-white to-[#fff8ef] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
            <div className="flex items-start gap-3"><span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-[#0b4f82] text-white shadow-sm"><ClipboardCheck size={17} /></span><SectionHeader title="Inspection Schedule" subtitle={`${inspections.length} records in current view.`} /></div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-control border border-[#cfe0ee] bg-white p-1 shadow-sm">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 rounded-[6px] px-3 py-1.5 text-xs font-black uppercase tracking-wider transition ${viewMode === 'list' ? 'bg-[#0b4f82] text-white shadow-sm' : 'text-[#6d879c] hover:bg-slate-50'}`}
                >
                  <List size={14} /> List
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`flex items-center gap-2 rounded-[6px] px-3 py-1.5 text-xs font-black uppercase tracking-wider transition ${viewMode === 'map' ? 'bg-[#0b4f82] text-white shadow-sm' : 'text-[#6d879c] hover:bg-slate-50'}`}
                >
                  <MapIcon size={14} /> Map
                </button>
              </div>
              <Badge variant="info" className="border border-[#b9d9ef] bg-[#eaf5fc] text-[#0b65a1]"><span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#10b981]" />Live Tracking</Badge>
            </div>
          </div>

          <div className="nmis-table-scroll">
            {viewMode === 'map' ? (
              <div className="flex flex-col lg:flex-row">
                <div className="h-[600px] w-full border-r border-[#cfe0ee] bg-slate-50 lg:w-2/3">
                  <iframe
                    title="Live Inspection Tracking Map"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0 }}
                    src={`https://www.google.com/maps?q=${encodeURIComponent(focusedLocation?.query || 'Ondo State, Nigeria')}&output=embed&z=${focusedLocation ? 15 : 9}`}
                    allowFullScreen
                  />
                </div>
                <div className="h-[600px] w-full overflow-y-auto bg-white lg:w-1/3 custom-scrollbar">
                  <div className="sticky top-0 z-10 border-b border-[#cfe0ee] bg-slate-50/80 px-4 py-3 backdrop-blur-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#0b65a1]">Ongoing & Recent Activity</p>
                  </div>
                  <div className="divide-y divide-[#eef6fb]">
                    {inspections.length === 0 ? (
                      <div className="p-8 text-center text-sm text-brand-muted italic">No inspections to track.</div>
                    ) : (
                      inspections.map(item => (
                        <button
                          key={item.id}
                          onClick={() => {
                            const query = (item as any).providerLatitude && (item as any).providerLongitude 
                              ? `${(item as any).providerLatitude},${(item as any).providerLongitude}`
                              : `${item.providerName}, ${(item as any).providerAddress || ''}, Ondo State, Nigeria`;
                            setFocusedLocation({ name: item.providerName, query });
                          }}
                          className={`w-full p-4 text-left transition hover:bg-[#fff8ef] ${focusedLocation?.name === item.providerName ? 'bg-[#fff8ef] ring-1 ring-inset ring-[#f7931e]/20' : ''}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-black text-[#123b5d]">{item.providerName}</p>
                              <p className="mt-1 text-[10px] font-bold text-[#6d879c]">{item.type}</p>
                            </div>
                            <Badge variant={item.status === 'completed' || item.status === 'submitted' ? 'success' : 'warning'} size="sm">
                              {item.status}
                            </Badge>
                          </div>
                          <div className="mt-3 flex items-center gap-3">
                            <div className="flex items-center gap-1 text-[10px] font-bold text-[#0b65a1]">
                              <Calendar size={10} /> {new Date(item.scheduledAt).toLocaleDateString()}
                            </div>
                            {item.score && (
                              <div className="flex items-center gap-1 text-[10px] font-black text-[#15803d]">
                                <ClipboardCheck size={10} /> {item.score}%
                              </div>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <table className="nmis-table min-w-[1000px]">
              <thead className="bg-[#0b4f82]">
                <tr className="border-0">
                  <th className="!text-white/80">Provider / Facility</th>
                  <th className="!text-white/80">Type</th>
                  <th className="!text-white/80">Date</th>
                  <th className="!text-white/80">Inspector</th>
                  <th className="!text-white/80 text-center">Overall Score</th>
                  <th className="!text-white/80 text-center">Credentialing</th>
                  <th className="!text-white/80 text-center">Accreditation</th>
                  <th className="!text-white/80">Status</th>
                  <th className="!text-white/80 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={9} className="py-20 text-center"><LoadingState title="Fetching inspections..." /></td></tr>
                ) : inspections.length === 0 ? (
                  <tr><td colSpan={9} className="py-20 text-center text-brand-muted">No inspections match the current filters.</td></tr>
                ) : (
                  inspections.map(item => (
                    <tr key={item.id} className="odd:bg-white even:bg-[#fbfdff] transition-colors hover:!bg-[#fff8ef]">
                      <td>
                        <div className="min-w-[250px]">
                          <p className="font-black leading-5 text-[#123b5d]">{item.providerName}</p>
                          <span className="mt-1 inline-flex rounded-full border border-[#cfe0ee] bg-[#eef6fb] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#0b65a1]">{item.providerCode}</span>
                        </div>
                      </td>
                      <td><Badge variant="info" className="border border-[#cfe0ee] bg-[#eef6fb] text-[#0b65a1]">{item.type}</Badge></td>
                      <td>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-brand-secondary">
                          <Calendar size={13} className="text-[#f7931e]" />
                          {new Date(item.scheduledAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-brand-secondary">
                          <User size={13} className="text-[#0b65a1]" />
                          {item.inspectorName}
                        </div>
                      </td>
                      <td className="text-center">
                        {item.score ? (
                          <div className="inline-flex min-w-[76px] flex-col items-center rounded-control border border-[#cfe0ee] bg-[#eef6fb] px-2.5 py-1.5">
                            <span className={`text-base font-black tabular-nums ${item.score >= 90 ? 'text-[#15803d]' : item.score >= 75 ? 'text-[#0b65a1]' : 'text-[#b45309]'}`}>
                              {item.score}%
                            </span>
                            <span className="text-[9px] font-black uppercase tracking-[0.12em] text-[#6d879c]">{item.rating}</span>
                          </div>
                        ) : (
                          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">Pending</span>
                        )}
                      </td>
                      <td className="text-center">
                        {item.credentialingPossible ? <span className="inline-flex rounded-control border border-[#cfe0ee] bg-[#f4f9fc] px-2.5 py-1.5 text-xs font-black tabular-nums text-[#0b4f82]">{item.credentialingPoints ?? 0}/{item.credentialingPossible}</span> : <span className="text-xs text-brand-muted">—</span>}
                      </td>
                      <td className="text-center">
                        {item.accreditationPossible ? <span className="inline-flex rounded-control border border-[#f4d3ae] bg-[#fff8ef] px-2.5 py-1.5 text-xs font-black tabular-nums text-[#b45309]">{item.accreditationPoints ?? 0}/{item.accreditationPossible}</span> : <span className="text-xs text-brand-muted">—</span>}
                      </td>
                      <td>
                        <Badge variant={item.status === 'completed' || item.status === 'submitted' ? 'success' : item.status === 'draft' ? 'warning' : item.status === 'scheduled' ? 'warning' : 'info'}>
                          {item.status.replace('-', ' ')}
                        </Badge>
                      </td>
                      <td className="text-right">
                        <Button variant={item.status === 'draft' ? 'secondary' : 'ghost'} size="sm" className={item.status === 'draft' ? 'border-[#f4d3ae] bg-[#fff8ef] text-[#b45309] hover:bg-[#f7931e] hover:text-white' : 'rounded-full bg-[#eef6fb] text-[#0b65a1] hover:bg-[#0b4f82] hover:text-white'} onClick={() => handleOpenInspection(item)}>{item.status === 'draft' ? <><FilePenLine size={15} /> Resume</> : <><span className="hidden sm:inline">Review</span><ChevronRight size={18} /></>}</Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            )}
          </div>
        </div>
      </div>

      {/* Inspection Review Drawer */}
      {isDrawerOpen && selectedInspectionId && (
        <InspectionDetailDrawer
          id={selectedInspectionId}
          onEdit={(inspection) => navigate(`/inspections/new?inspectionId=${encodeURIComponent(inspection.id)}&facilityType=${encodeURIComponent(facilityTypeCodeFromInspectionType(inspection.type, inspection.providerCategory, inspection.providerOwnership, inspection.facilityTypeCode))}`)}
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

export function InspectionDetailDrawer({ id, onClose, onEdit }: { id: string; onClose: () => void; onEdit?: (inspection: { id: string; type: string; providerCategory?: string | null; providerOwnership?: string | null; facilityTypeCode?: string | null }) => void }) {
  const { data: inspection, isLoading } = useInspection(id);
  const { data: structuredInspection, isLoading: isStructuredLoading } = useStructuredInspection(id);
  const updateInspectionMutation = useUpdateInspection();
  const [exportingFormat, setExportingFormat] = useState<'pdf' | 'csv' | 'docx' | null>(null);

  const handleComplete = async () => {
    try {
      await updateInspectionMutation.mutateAsync({ id, payload: { status: 'Completed' } });
      onClose();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Failed to mark inspection as completed.');
    }
  };
  const { data: checklist = [], isLoading: isChecklistLoading } = useInspectionChecklist(id);

  const handleExportPdf = async () => {
    if (!inspection || !structuredInspection?.inspection) {
      window.alert('The complete inspection outcome is still loading. Please try again.');
      return;
    }

    setExportingFormat('pdf');
    try {
      const saved = structuredInspection as any;
      const savedInspection = saved.inspection;
      const savedTemplate = saved.template || {};
      const templateDefinition = savedTemplate.template || {};
      const facility = saved.facility_profile || {};
      const profile = { ...(facility.metadata || {}), ...facility };
      delete (profile as any).metadata;
      const responseMap = (saved.responses || []).reduce((result: Record<string, any>, response: any) => {
        result[response.item_code] = {
          number: response.response_number === null || response.response_number === undefined ? '' : String(response.response_number),
          manual_score: response.manual_score === null || response.manual_score === undefined ? '' : String(response.manual_score),
          boolean: response.response_boolean === null || response.response_boolean === undefined ? null : Boolean(response.response_boolean),
          remark: response.remark || '',
        };
        return result;
      }, {});
      const breakdown = saved.score_breakdown || {};
      const reportBytes = await buildInspectionReportPdf({
        inspectionId: id,
        providerName: inspection.providerName || facility.facility_name || 'Provider Facility',
        providerCode: inspection.providerCode,
        facilityType: savedTemplate.facility_type?.name || inspection.type || 'Facility',
        inspectionDate: facility.inspection_date || inspection.scheduledAt,
        templateName: templateDefinition.name || inspection.type || 'Inspection Outcome',
        passingThreshold: Number(templateDefinition.passing_threshold || 75),
        conditionalThreshold: Number(templateDefinition.conditional_threshold || 60),
        profile,
        eligibility: (saved.eligibility || []).map((criterion: any) => ({ criterion_label: criterion.criterion_label, met: Boolean(criterion.met), notes: criterion.notes || '' })),
        items: savedTemplate.items || [],
        sections: savedTemplate.sections || [],
        responses: responseMap,
        generalRemarks: profile.general_remarks || '',
        team: (saved.team || []).map((member: any) => ({ name: member.member_name || member.name || '', role: member.member_role || member.role || 'Inspector', inspection_date: member.inspection_date || '', signature_data: member.signature_data || '' })),
        score: {
          points: Number(savedInspection.total_points || savedInspection.score || 0),
          possible: Number(savedInspection.total_possible || 0),
          percentage: Number(savedInspection.overall_score ?? savedInspection.score ?? 0),
          recommendation: savedInspection.recommendation || 'Not Recommended for Accreditation',
          credentialingPoints: Number(breakdown.credentialing_points ?? savedInspection.credentialing_points ?? 0),
          credentialingPossible: Number(breakdown.credentialing_possible ?? savedInspection.credentialing_possible ?? 0),
          accreditationPoints: Number(breakdown.accreditation_points ?? savedInspection.accreditation_points ?? 0),
          accreditationPossible: Number(breakdown.accreditation_possible ?? savedInspection.accreditation_possible ?? 0),
        },
      });
      const fileName = inspectionReportFileName(inspection.providerName || facility.facility_name, facility.inspection_date || inspection.scheduledAt);
      downloadPdf(reportBytes, fileName);

      const filePath = reportStoragePath(inspection.providerId, id);
      await providerDocumentsRepository.uploadInspectionReport(filePath, pdfBytesToBlob(reportBytes));
      await providerDocumentsRepository.registerInspectionReport({ providerId: inspection.providerId, inspectionId: id, filePath, fileName });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to export the inspection PDF.');
    } finally {
      setExportingFormat(null);
    }
  };

  const handleExportCsv = () => {
    if (!inspection || !structuredInspection?.inspection) {
      window.alert('The complete inspection outcome is still loading. Please try again.');
      return;
    }

    setExportingFormat('csv');
    try {
      const saved = structuredInspection as any;
      const savedInspection = saved.inspection;
      const savedTemplate = saved.template || {};
    const templateDefinition = savedTemplate.template || {};
    const facility = saved.facility_profile || {};
    const profile = { ...(facility.metadata || {}), ...facility };
    delete (profile as any).metadata;
    const responseMap = (saved.responses || []).reduce((result: Record<string, any>, response: any) => {
      result[response.item_code] = {
        number: response.response_number === null || response.response_number === undefined ? '' : String(response.response_number),
        manual_score: response.manual_score === null || response.manual_score === undefined ? '' : String(response.manual_score),
        boolean: response.response_boolean === null || response.response_boolean === undefined ? null : Boolean(response.response_boolean),
        remark: response.remark || '',
        awarded_points: Number(response.awarded_points || 0),
        included_in_denominator: Boolean(response.included_in_denominator),
      };
      return result;
    }, {});
    const csvBreakdown = saved.score_breakdown || {};
    exportInspectionCsv({
      inspectionId: id,
      providerName: inspection.providerName || facility.facility_name || 'Provider Facility',
      providerCode: inspection.providerCode,
      facilityType: savedTemplate.facility_type?.name || inspection.type || 'Facility',
      inspectionDate: facility.inspection_date || inspection.scheduledAt,
      status: inspection.status,
      templateName: templateDefinition.name || inspection.type || 'Inspection Outcome',
      eligibility: (saved.eligibility || []).map((criterion: any) => ({ criterion_label: criterion.criterion_label, met: Boolean(criterion.met), notes: criterion.notes || '' })),
      items: savedTemplate.items || [],
      responses: responseMap,
      generalRemarks: profile.general_remarks || '',
      team: (saved.team || []).map((member: any) => ({ name: member.member_name || member.name || '', role: member.member_role || member.role || 'Inspector', inspection_date: member.inspection_date || '', signature_data: member.signature_data || '' })),
      score: {
        points: Number(savedInspection.total_points || savedInspection.score || 0),
        possible: Number(savedInspection.total_possible || 0),
        percentage: Number(savedInspection.overall_score ?? savedInspection.score ?? 0),
        recommendation: savedInspection.recommendation || 'Not Recommended for Accreditation',
        credentialingPoints: Number(csvBreakdown.credentialing_points ?? savedInspection.credentialing_points ?? 0),
        credentialingPossible: Number(csvBreakdown.credentialing_possible ?? savedInspection.credentialing_possible ?? 0),
        accreditationPoints: Number(csvBreakdown.accreditation_points ?? savedInspection.accreditation_points ?? 0),
        accreditationPossible: Number(csvBreakdown.accreditation_possible ?? savedInspection.accreditation_possible ?? 0),
        },
      });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to export the inspection CSV.');
    } finally {
      setExportingFormat(null);
    }
  };

  const handleExportDocx = async () => {
    if (!inspection || !structuredInspection?.inspection) {
      window.alert('The complete inspection outcome is still loading. Please try again.');
      return;
    }

    setExportingFormat('docx');
    try {
      const saved = structuredInspection as any;
      const savedInspection = saved.inspection;
      const savedTemplate = saved.template || {};
      const templateDefinition = savedTemplate.template || {};
      const facility = saved.facility_profile || {};
      const profile = { ...(facility.metadata || {}), ...facility };
      delete (profile as any).metadata;
      const responseMap = (saved.responses || []).reduce((result: Record<string, any>, response: any) => {
        result[response.item_code] = {
          number: response.response_number === null || response.response_number === undefined ? '' : String(response.response_number),
          manual_score: response.manual_score === null || response.manual_score === undefined ? '' : String(response.manual_score),
          boolean: response.response_boolean === null || response.response_boolean === undefined ? null : Boolean(response.response_boolean),
          remark: response.remark || '',
          awarded_points: Number(response.awarded_points || 0),
          included_in_denominator: Boolean(response.included_in_denominator),
        };
        return result;
      }, {});
      const docxBreakdown = saved.score_breakdown || {};
      await exportInspectionDocx({
        inspectionId: id,
        providerName: inspection.providerName || facility.facility_name || 'Provider Facility',
        providerCode: inspection.providerCode,
        facilityType: savedTemplate.facility_type?.name || inspection.type || 'Facility',
        inspectionDate: facility.inspection_date || inspection.scheduledAt,
        templateName: templateDefinition.name || inspection.type || 'Inspection Outcome',
        passingThreshold: Number(templateDefinition.passing_threshold || 75),
        conditionalThreshold: Number(templateDefinition.conditional_threshold || 60),
        profile,
        eligibility: (saved.eligibility || []).map((criterion: any) => ({ criterion_label: criterion.criterion_label, met: Boolean(criterion.met), notes: criterion.notes || '' })),
        items: savedTemplate.items || [],
        sections: savedTemplate.sections || [],
        responses: responseMap,
        generalRemarks: profile.general_remarks || '',
        team: (saved.team || []).map((member: any) => ({ name: member.member_name || member.name || '', role: member.member_role || member.role || 'Inspector', inspection_date: member.inspection_date || '', signature_data: member.signature_data || '' })),
        score: {
          points: Number(savedInspection.total_points || savedInspection.score || 0),
          possible: Number(savedInspection.total_possible || 0),
          percentage: Number(savedInspection.overall_score ?? savedInspection.score ?? 0),
          recommendation: savedInspection.recommendation || 'Not Recommended for Accreditation',
          credentialingPoints: Number(docxBreakdown.credentialing_points ?? savedInspection.credentialing_points ?? 0),
          credentialingPossible: Number(docxBreakdown.credentialing_possible ?? savedInspection.credentialing_possible ?? 0),
          accreditationPoints: Number(docxBreakdown.accreditation_points ?? savedInspection.accreditation_points ?? 0),
          accreditationPossible: Number(docxBreakdown.accreditation_possible ?? savedInspection.accreditation_possible ?? 0),
        },
      });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to export the inspection Word report.');
    } finally {
      setExportingFormat(null);
    }
  };

  const structured = structuredInspection as any;
  const breakdown = structured?.score_breakdown || {};
  const credentialingPoints = inspection?.credentialingPoints ?? breakdown.credentialing_points ?? 0;
  const credentialingPossible = inspection?.credentialingPossible ?? breakdown.credentialing_possible ?? 0;
  const accreditationPoints = inspection?.accreditationPoints ?? breakdown.accreditation_points ?? 0;
  const accreditationPossible = inspection?.accreditationPossible ?? breakdown.accreditation_possible ?? 0;
  const structuredItems = structured?.template?.items || [];
  const structuredResponses = structured?.responses || [];
  const generalRemarks = structured?.facility_profile?.metadata?.general_remarks || inspection?.findings || '';

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
                    <Badge variant={inspection.status === 'completed' || inspection.status === 'submitted' ? 'success' : inspection.status === 'draft' ? 'warning' : 'info'}>{inspection.status}</Badge>
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
                  <p className="mt-2 text-xl font-black text-brand-blue">{credentialingPoints} / {credentialingPossible}</p>
                  <p className="mt-1 text-xs text-brand-muted">Personnel licences and qualifications</p>
                </div>
                <div className="rounded-control border border-brand-divider bg-brand-surface p-4">
                  <p className="nmis-label">Accreditation Score</p>
                  <p className="mt-2 text-xl font-black text-brand-blue">{accreditationPoints} / {accreditationPossible}</p>
                  <p className="mt-1 text-xs text-brand-muted">Infrastructure and Essential Services</p>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-brand-blue">
                  <ClipboardCheck size={18} />
                  <h3 className="text-sm font-black uppercase tracking-wider">Inspection Checklist</h3>
                </div>

                {isChecklistLoading && isStructuredLoading ? (
                  <LoadingState title="Loading checklist..." />
                ) : structuredItems.length ? (
                  <div className="space-y-3">
                    {structuredItems.map((item: any) => {
                      const response = structuredResponses.find((entry: any) => entry.item_code === item.item_code);
                      const answered = response?.response_boolean !== null && response?.response_boolean !== undefined || response?.response_number !== null && response?.response_number !== undefined || response?.manual_score !== null && response?.manual_score !== undefined;
                      const answer = item.response_type === 'boolean' ? (response?.response_boolean === null || response?.response_boolean === undefined ? 'Not answered' : response.response_boolean ? 'YES' : 'NO') : item.manual_score_allowed || item.scoring_method === 'manual_only' ? (response?.manual_score === null || response?.manual_score === undefined ? 'Not scored' : `${response.manual_score} / ${item.max_points}`) : (response?.response_number === null || response?.response_number === undefined ? 'Not answered' : String(response.response_number));
                      return <div key={item.item_code} className="flex items-start gap-4 rounded-control border border-brand-divider bg-brand-surface p-4"><div className={`mt-0.5 rounded-full p-1 ${answered ? 'bg-status-successSoft text-status-success' : 'bg-brand-soft text-brand-muted'}`}><CheckCircle2 size={16} /></div><div className="flex-1"><p className="text-sm font-bold text-brand-foreground">{item.item_label}</p><p className="mt-1 text-xs font-black text-brand-blue">{answer} · {response?.awarded_points ?? 0}/{item.max_points} points</p>{response?.remark && <p className="mt-1 text-xs text-brand-muted italic">"{response.remark}"</p>}</div></div>;
                    })}
                  </div>
                ) : (
                  <div className="space-y-3">{checklist.map(item => <div key={item.id} className="flex items-start gap-4 rounded-control border border-brand-divider bg-brand-surface p-4"><div className={`mt-0.5 rounded-full p-1 ${item.completed ? 'bg-status-successSoft text-status-success' : 'bg-brand-soft text-brand-muted'}`}><CheckCircle2 size={16} /></div><div className="flex-1"><p className={`text-sm font-bold ${item.completed ? 'text-brand-foreground' : 'text-brand-secondary'}`}>{item.item}</p>{item.comments && <p className="mt-1 text-xs text-brand-muted italic">"{item.comments}"</p>}</div></div>)}</div>
                )}
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-brand-blue">
                  <ClipboardCheck size={18} />
                  <h3 className="text-sm font-black uppercase tracking-wider">Inspector Notes</h3>
                </div>
                <div className="rounded-control border border-brand-divider bg-brand-surface p-4">
                  <p className="text-sm leading-relaxed text-brand-secondary">
                    {generalRemarks || 'No notes provided for this inspection.'}
                  </p>
                </div>
              </section>
            </>
          ) : (
            <ErrorState title="Inspection not found" />
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-brand-divider bg-brand-surface/50 p-4 sm:flex-row sm:justify-end sm:p-6">
          <Button variant="secondary" className="w-full gap-2 sm:w-auto" onClick={handleExportPdf} disabled={!inspection || !structuredInspection || isStructuredLoading || exportingFormat !== null}>{exportingFormat === 'pdf' ? 'Preparing PDF...' : 'Export PDF'}</Button>
          <Button variant="secondary" className="w-full gap-2 sm:w-auto" onClick={handleExportCsv} disabled={!inspection || !structuredInspection || isStructuredLoading || exportingFormat !== null}>{exportingFormat === 'csv' ? 'Preparing CSV...' : 'Export CSV'}</Button>
          <Button variant="secondary" className="w-full gap-2 sm:w-auto" onClick={handleExportDocx} disabled={!inspection || !structuredInspection || isStructuredLoading || exportingFormat !== null}>{exportingFormat === 'docx' ? 'Preparing Word...' : 'Export Word'}</Button>
          {inspection && (inspection.status === 'submitted' || inspection.status === 'completed') && onEdit ? <Button variant="secondary" className="w-full border-[#f4d3ae] bg-[#fff8ef] text-[#b45309] hover:bg-[#f7931e] hover:text-white sm:w-auto" onClick={() => onEdit({ id: inspection.id, type: inspection.type, providerCategory: inspection.providerCategory, providerOwnership: inspection.providerOwnership, facilityTypeCode: inspection.facilityTypeCode })}><FilePenLine size={15} /> Edit & Re-submit</Button> : null}
          <Button variant="secondary" className="w-full sm:w-auto" onClick={onClose}>Close Review</Button>
          <Button className="w-full sm:w-auto" onClick={handleComplete} disabled={!inspection || inspection.status === 'completed' || updateInspectionMutation.isPending}>{updateInspectionMutation.isPending ? 'Saving...' : 'Mark as Completed'}</Button>
        </div>
      </div>
    </div>
  );
}
