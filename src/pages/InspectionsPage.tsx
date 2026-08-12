import React, { useState, useMemo } from 'react';
import { Calendar, CheckCircle2, ChevronRight, Download, Filter, Plus, Search, User, X, ClipboardCheck, AlertCircle } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import KpiCard from '../components/ui/KpiCard';
import PageHeader from '../components/ui/PageHeader';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { useInspections, useInspection, useInspectionChecklist } from '../hooks/inspections/inspectionsHooks';
import { Inspection, InspectionFilters } from '../types/inspections/inspectionsTypes';
import { LoadingState, ErrorState } from '../components/ui/FeedbackStates';
import { SectionHeader } from '../components/ui/LayoutComponents';
import ActiveFilterChips from '../components/ui/ActiveFilterChips';

export default function InspectionsPage() {
  const [filters, setFilters] = useState<InspectionFilters>({ status: 'all', type: 'all', rating: 'all', search: '' });
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { data: inspections = [], isLoading, isError, refetch } = useInspections(filters);

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
              <Button variant="secondary" className="gap-2" disabled><Download size={16} /> Export Schedule (Soon)</Button>
              <Button className="gap-2" disabled><Plus size={16} /> Schedule Inspection (Soon)</Button>
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
          <div className="flex flex-col gap-3 border-b border-brand-divider bg-brand-surface/70 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <SectionHeader title="Inspection Schedule" subtitle={`${inspections.length} records in current view.`} />
            <Badge variant="info">Live Tracking</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="nmis-table min-w-[1000px]">
              <thead>
                <tr>
                  <th>Provider / Facility</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Inspector</th>
                  <th className="text-center">Score</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="py-20 text-center"><LoadingState title="Fetching inspections..." /></td></tr>
                ) : inspections.length === 0 ? (
                  <tr><td colSpan={7} className="py-20 text-center text-brand-muted">No inspections match the current filters.</td></tr>
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
    </main>
  );
}

function InspectionDetailDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const { data: inspection, isLoading } = useInspection(id);
  const { data: checklist = [], isLoading: isChecklistLoading } = useInspectionChecklist(id);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-brand-navy/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="h-full w-full max-w-2xl bg-brand-card shadow-panel animate-in slide-in-from-right duration-300 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between border-b border-brand-divider bg-brand-surface/50 p-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-blue">Inspection Review</p>
            <h2 className="mt-1 text-xl font-black text-brand-foreground">
              {isLoading ? 'Loading...' : inspection?.providerName}
            </h2>
          </div>
          <button onClick={onClose} className="rounded-control p-2 text-brand-muted hover:bg-brand-surface hover:text-brand-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
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
                    {inspection.notes || 'No notes provided for this inspection.'}
                  </p>
                </div>
              </section>
            </>
          ) : (
            <ErrorState title="Inspection not found" />
          )}
        </div>

        <div className="border-t border-brand-divider bg-brand-surface/50 p-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Close Review</Button>
          <Button disabled={inspection?.status === 'completed'}>Mark as Completed</Button>
        </div>
      </div>
    </div>
  );
}
