import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { useComplaints, useCreateComplaint, useUpdateComplaintStatus, useComplaintHistory, useComplaintMessages, useSendComplaintMessage } from '../hooks/complaints/complaintHooks';
import { ComplaintMessage } from '../types/complaints/complaintTypes';
import { AlertTriangle, CheckCircle2, ClipboardList, Download, MessageCircle, Search, Send, ShieldCheck } from 'lucide-react';
import KpiCard from '../components/ui/KpiCard';
import { useProviderDirectory } from '../features/providers/hooks';
import { ComplaintFilters, ComplaintRecord, ComplaintStatus, ComplaintCategory, ComplaintPriority, COMPLAINT_STATUS_LABELS, COMPLAINT_CATEGORY_LABELS, COMPLAINT_PRIORITY_LABELS } from '../types/complaints/complaintTypes';

function ComplaintsPage() {
  const [filters, setFilters] = useState<ComplaintFilters>({
    search: '',
    status: 'all',
    category: 'all',
    priority: 'all',
  });

  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintRecord | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [resolutionInput, setResolutionInput] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [messageError, setMessageError] = useState<string | null>(null);
  const [newComplaintForm, setNewComplaintForm] = useState({
    providerId: '',
    title: '',
    category: 'payment' as ComplaintCategory,
    priority: 'medium' as ComplaintPriority,
    description: '',
    assignedTo: '',
  });

  const { data: complaints = [], isLoading } = useComplaints(filters);
  const { data: providers = [], isLoading: providersLoading } = useProviderDirectory({
    search: '', status: 'all', contractStatus: 'all', credentialStatus: 'all', inspectionStatus: 'all',
    capitationStatus: 'all', lga: 'all', category: 'all', subcategory: 'all', ownership: 'all', service: 'all',
  });
  const { session } = useAuth();
  const createMutation = useCreateComplaint();
  const updateStatusMutation = useUpdateComplaintStatus();
  const sendMessageMutation = useSendComplaintMessage();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComplaintForm.providerId) {
      alert('Select the provider or facility associated with this complaint.');
      return;
    }
    try {
      await createMutation.mutateAsync(newComplaintForm);
      setIsNewModalOpen(false);
      setNewComplaintForm({
        providerId: '',
        title: '',
        category: 'payment',
        priority: 'medium',
        description: '',
        assignedTo: '',
      });
    } catch (err: any) {
      alert(err.message || 'Failed to create complaint');
    }
  };

  const handleSendMessage = async () => {
    if (!selectedComplaint || !messageInput.trim()) return;
    setMessageError(null);
    try {
      await sendMessageMutation.mutateAsync({
        complaintId: selectedComplaint.id,
        senderType: 'staff',
        senderName: session?.user.name || 'ODCHC Support',
        senderEmail: session?.user.email,
        message: messageInput.trim(),
      });
      setMessageInput('');
    } catch (err: any) {
      setMessageError(err.message || 'The support chat connection is unavailable. Please try again.');
    }
  };

  const handleStatusChange = async (id: string, status: ComplaintStatus) => {
    try {
      await updateStatusMutation.mutateAsync({
        id,
        status,
        resolutionNotes: resolutionInput.trim() || undefined,
      });
      setSelectedComplaint(null);
      setResolutionInput('');
    } catch (err: any) {
      alert(err.message || 'Failed to update complaint status');
    }
  };

  const openCount = complaints.filter(c => ['submitted', 'open', 'in-review'].includes(c.status)).length;
  const resolvedCount = complaints.filter(c => c.status === 'resolved' || c.status === 'closed').length;
  const escalatedCount = complaints.filter(c => c.status === 'escalated').length;

  const handleExport = () => {
    const headers = ['Ref Number', 'Source', 'Provider', 'Provider Code', 'Title', 'Category', 'Priority', 'Status', 'Assigned To', 'Created At', 'Updated At'];
    const rows = complaints.map(complaint => [complaint.referenceNumber, complaint.source, complaint.providerName, complaint.providerCode || '', complaint.title, complaint.category, complaint.priority, complaint.status, complaint.assignedTo || '', complaint.createdAt, complaint.updatedAt]);
    const csv = [headers, ...rows].map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `nmis-complaints-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-brand-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="Provider complaints & issue management"
          description="Track, assign, and resolve provider grievances with secure workflow tracking and audit trails."
          actions={[{ label: 'Register new complaint', onClick: () => setIsNewModalOpen(true) }]}
        />

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <KpiCard
            title="Active / Open issues"
            value={openCount}
            subtitle="Submitted, open, and in-review cases"
            icon={<ClipboardList className="h-5 w-5" />}
            tone="primary"
          />
          <KpiCard
            title="Resolved & Closed"
            value={resolvedCount}
            subtitle="Cases completed through the support workflow"
            icon={<CheckCircle2 className="h-5 w-5" />}
            tone="success"
          />
          <KpiCard
            title="Escalated"
            value={escalatedCount}
            subtitle="Cases requiring management attention"
            icon={<AlertTriangle className="h-5 w-5" />}
            tone="danger"
          />
        </div>

        {/* Filters */}
        <section className="nmis-card overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-brand-divider bg-brand-surface/80 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="nmis-kicker">Support desk controls</p>
              <p className="mt-1 text-sm text-brand-secondary">Search and filter the unified provider and public complaint register.</p>
            </div>
            <button
              type="button"
              onClick={handleExport}
              disabled={!complaints.length}
              className="inline-flex items-center justify-center gap-2 rounded-control bg-brand-blue px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3 px-5 py-4">
            <label className="relative min-w-[260px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
              <input
                type="text"
                placeholder="Search by title, provider, code..."
                value={filters.search}
                onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full rounded-control border border-brand-border bg-white py-2.5 pl-9 pr-3 text-sm text-brand-foreground placeholder:text-brand-muted focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15"
              />
            </label>
            <select
              value={filters.status}
              onChange={e => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
              className="rounded-control border border-brand-border bg-white px-3 py-2.5 text-sm text-brand-foreground focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15"
            >
              <option value="all">All Statuses</option>
              {Object.entries(COMPLAINT_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select
              value={filters.category}
              onChange={e => setFilters(prev => ({ ...prev, category: e.target.value as any }))}
              className="rounded-control border border-brand-border bg-white px-3 py-2.5 text-sm text-brand-foreground focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15"
            >
              <option value="all">All Categories</option>
              {Object.entries(COMPLAINT_CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select
              value={filters.priority}
              onChange={e => setFilters(prev => ({ ...prev, priority: e.target.value as any }))}
              className="rounded-control border border-brand-border bg-white px-3 py-2.5 text-sm text-brand-foreground focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15"
            >
              <option value="all">All Priorities</option>
              {Object.entries(COMPLAINT_PRIORITY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </section>

        {/* Complaints Table */}
        <section className="nmis-card overflow-hidden">
          <div className="flex flex-col gap-2 border-b border-brand-divider bg-brand-surface/70 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="nmis-kicker">Case register</p>
              <h2 className="mt-1 text-xl font-extrabold text-brand-navy">Complaints register</h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-pill bg-brand-soft px-3 py-1.5 text-xs font-bold text-brand-blue">
              <ShieldCheck className="h-4 w-4" />
              {complaints.length} visible {complaints.length === 1 ? 'case' : 'cases'}
            </div>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading complaints...</div>
          ) : complaints.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No complaints found matching criteria.</div>
          ) : (
            <div className="nmis-table-scroll">
              <table className="w-full min-w-[980px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-brand-divider bg-brand-surface text-[11px] font-bold uppercase tracking-[0.14em] text-brand-muted">
                    <th className="px-6 py-3">Reference / Source</th>
                    <th className="px-6 py-3">Provider</th>
                    <th className="px-6 py-3">Title / Category</th>
                    <th className="px-6 py-3">Priority</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-divider text-sm">
                  {complaints.map(c => (
                    <tr key={c.id} className="group transition-colors hover:bg-brand-soft/35">
                      <td className="px-5 py-4 align-top">
                        <p className="font-bold tracking-tight text-brand-navy">{c.referenceNumber}</p>
                        <span className={`mt-2 inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${
                          c.source === 'public' ? 'bg-status-warningSoft text-status-warning' : 'bg-brand-soft text-brand-blue'
                        }`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {c.source === 'public' ? 'Public submission' : 'Internal case'}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <p className="font-semibold text-brand-foreground">{c.providerName}</p>
                        <p className="mt-1 text-xs text-brand-muted">{c.providerCode || 'Public submission'}</p>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <p className="font-semibold text-brand-foreground">{c.title}</p>
                        <span className="mt-2 inline-flex rounded-md bg-brand-surface px-2 py-1 text-[11px] font-semibold text-brand-secondary ring-1 ring-brand-border/60">
                          {COMPLAINT_CATEGORY_LABELS[c.category]}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <span className={`inline-flex rounded-pill px-2.5 py-1 text-xs font-bold ${
                          c.priority === 'urgent' ? 'bg-status-errorSoft text-status-error' :
                          c.priority === 'high' ? 'bg-status-warningSoft text-status-warning' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {COMPLAINT_PRIORITY_LABELS[c.priority]}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <span className={`inline-flex rounded-pill px-2.5 py-1 text-xs font-bold ${
                          c.status === 'resolved' || c.status === 'closed' ? 'bg-status-successSoft text-status-success' :
                          c.status === 'escalated' ? 'bg-status-errorSoft text-status-error' :
                          c.status === 'submitted' ? 'bg-status-warningSoft text-status-warning' :
                          'bg-status-infoSoft text-status-info'
                        }`}>
                          {COMPLAINT_STATUS_LABELS[c.status]}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right align-top">
                        <button
                          onClick={() => setSelectedComplaint(c)}
                          className="inline-flex items-center gap-1.5 rounded-control border border-brand-border bg-white px-3 py-1.5 text-xs font-bold text-brand-blue transition hover:border-brand-blue hover:bg-brand-soft active:scale-[0.98]"
                        >
                          Review <MessageCircle className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Complaint Review Drawer / Modal */}
        {selectedComplaint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/75 p-2 backdrop-blur-sm sm:p-4">
            <div className="max-h-[calc(100dvh-1rem)] w-full max-w-3xl overflow-y-auto rounded-panel border border-brand-border bg-white shadow-panel sm:max-h-[90vh]">
              <div className="relative overflow-hidden border-b border-brand-blue/30 bg-gradient-to-br from-brand-navy via-brand-blue to-brand-blue px-5 py-5 text-white sm:px-6">
                <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
                <div className="relative flex items-start justify-between gap-3">
                  <div>
                    <div className="mb-2 inline-flex items-center gap-2 rounded-pill bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/75">
                      <MessageCircle className="h-3.5 w-3.5" /> Support case
                    </div>
                    <h3 className="text-xl font-extrabold tracking-tight sm:text-2xl">{selectedComplaint.title}</h3>
                    <p className="mt-1 text-sm text-white/70">{selectedComplaint.referenceNumber} · {selectedComplaint.providerName} {selectedComplaint.providerCode ? `(${selectedComplaint.providerCode})` : ''}</p>
                  </div>
                  <button
                    onClick={() => setSelectedComplaint(null)}
                    aria-label="Close complaint review"
                    className="rounded-control p-2 text-white/70 transition hover:bg-white/15 hover:text-white active:scale-95"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="space-y-5 p-4 sm:p-6">
                <div className="grid gap-3 rounded-card border border-brand-border bg-brand-surface/80 p-4 sm:grid-cols-2">
                  <div>
                    <p className="nmis-kicker">Category</p>
                    <p className="mt-1 text-sm font-bold text-brand-foreground">{COMPLAINT_CATEGORY_LABELS[selectedComplaint.category]}</p>
                  </div>
                  <div>
                    <p className="nmis-kicker">Priority</p>
                    <p className="mt-1 text-sm font-bold text-brand-foreground">{COMPLAINT_PRIORITY_LABELS[selectedComplaint.priority]}</p>
                  </div>
                  <div>
                    <p className="nmis-kicker">Current status</p>
                    <p className="mt-1 text-sm font-bold text-brand-foreground">{COMPLAINT_STATUS_LABELS[selectedComplaint.status]}</p>
                  </div>
                  <div>
                    <p className="nmis-kicker">Assigned officer</p>
                    <p className="mt-1 text-sm font-bold text-brand-foreground">{selectedComplaint.assignedTo || 'Unassigned'}</p>
                  </div>
                </div>

                {selectedComplaint.source === 'public' && (
                  <div className="rounded-card border border-status-warning/25 bg-status-warningSoft/60 p-4">
                    <div className="flex items-center gap-2 text-status-warning">
                      <ShieldCheck className="h-4 w-4" />
                      <p className="text-xs font-extrabold uppercase tracking-[0.14em]">Reporter contact profile</p>
                    </div>
                    <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                      <div><p className="nmis-kicker text-status-warning/80">Name</p><p className="mt-1 font-bold text-brand-foreground">{selectedComplaint.complainantName || 'Not provided'}</p></div>
                      <div><p className="nmis-kicker text-status-warning/80">Phone</p><p className="mt-1 font-bold text-brand-foreground">{selectedComplaint.contactPhone || 'Not provided'}</p></div>
                      <div><p className="nmis-kicker text-status-warning/80">Email</p><p className="mt-1 break-all font-bold text-brand-foreground">{selectedComplaint.contactEmail || 'Not provided'}</p></div>
                    </div>
                  </div>
                )}

                <div className="rounded-card border border-brand-border bg-white p-4">
                  <p className="nmis-kicker">Original report</p>
                  <p className="mt-2 rounded-control bg-brand-surface p-4 text-sm leading-6 text-brand-secondary whitespace-pre-wrap">{selectedComplaint.description}</p>
                </div>

                <ComplaintHistory id={selectedComplaint.id} />
                <ComplaintMessages id={selectedComplaint.id} />

                <div className="overflow-hidden rounded-panel border border-brand-blue/20 bg-brand-background shadow-sm">
                  <div className="flex items-start justify-between gap-3 border-b border-brand-blue/15 bg-brand-soft/55 px-4 py-4">
                    <div>
                      <div className="flex items-center gap-2 text-brand-blue">
                        <MessageCircle className="h-4 w-4" />
                        <p className="text-sm font-extrabold">Chat with reporter</p>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-brand-secondary">Messages sent here are delivered to the reporter's secure support conversation.</p>
                    </div>
                    <span className="shrink-0 rounded-pill bg-brand-blue px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white">Two-way support</span>
                  </div>
                  <div className="p-4">
                    {messageError && <p className="mb-3 rounded-control border border-status-error/20 bg-status-errorSoft p-3 text-xs font-semibold text-status-error">{messageError}</p>}
                    <div className="flex items-end gap-2">
                      <textarea
                        value={messageInput}
                        onChange={e => setMessageInput(e.target.value)}
                        placeholder="Write a message to the reporter..."
                        rows={2}
                        className="min-w-0 flex-1 rounded-control border border-brand-border bg-white p-3 text-sm text-brand-foreground placeholder:text-brand-muted focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15"
                      />
                      <button
                        type="button"
                        onClick={handleSendMessage}
                        disabled={sendMessageMutation.isPending || !messageInput.trim()}
                        aria-label="Send message to reporter"
                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-brand-blue text-white shadow-sm transition hover:bg-brand-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-panel border border-brand-border bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex items-center gap-2 text-brand-navy">
                    <ClipboardList className="h-4 w-4 text-brand-blue" />
                    <p className="text-sm font-extrabold">Update status & resolve</p>
                  </div>
                  <p className="mt-1 text-xs text-brand-secondary">Add a note before resolving so the reporter receives the context in the conversation.</p>
                  <textarea
                    placeholder="Enter resolution notes (required if marking as resolved)..."
                    value={resolutionInput}
                    onChange={e => setResolutionInput(e.target.value)}
                    className="mt-4 w-full rounded-control border border-brand-border bg-brand-surface p-3 text-sm text-brand-foreground placeholder:text-brand-muted focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15"
                    rows={3}
                  />

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => handleStatusChange(selectedComplaint.id, 'in-review')}
                      className="rounded-control bg-status-info px-4 py-2.5 text-xs font-bold text-white transition hover:brightness-95 active:scale-[0.98]"
                    >
                      Set In Review
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedComplaint.id, 'escalated')}
                      className="rounded-control bg-status-warning px-4 py-2.5 text-xs font-bold text-white transition hover:brightness-95 active:scale-[0.98]"
                    >
                      Escalate Issue
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedComplaint.id, 'resolved')}
                      className="rounded-control bg-status-success px-4 py-2.5 text-xs font-bold text-white transition hover:brightness-95 active:scale-[0.98]"
                    >
                      Mark Resolved
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedComplaint.id, 'closed')}
                      className="rounded-control bg-brand-navy px-4 py-2.5 text-xs font-bold text-white transition hover:bg-brand-blue active:scale-[0.98]"
                    >
                      Close Complaint
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* New Complaint Modal */}
        {isNewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/75 p-2 backdrop-blur-sm sm:p-4">
            <div className="max-h-[calc(100dvh-1rem)] w-full max-w-xl overflow-y-auto rounded-panel border border-brand-border bg-white shadow-panel sm:max-h-[90vh]">
              <div className="relative overflow-hidden border-b border-brand-blue/30 bg-gradient-to-br from-brand-navy via-brand-blue to-brand-blue px-5 py-5 text-white sm:px-6">
                <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
                <div className="relative flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">Support desk</p>
                    <h3 className="mt-1 text-xl font-extrabold">Register new complaint</h3>
                    <p className="mt-1 text-xs text-white/70">Create a traceable case for the provider support workflow.</p>
                  </div>
                  <button
                    onClick={() => setIsNewModalOpen(false)}
                    aria-label="Close new complaint form"
                    className="rounded-control p-2 text-white/70 transition hover:bg-white/15 hover:text-white active:scale-95"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreate} className="space-y-4 p-4 sm:p-6">
                <div>
                  <label className="nmis-kicker">Provider / facility</label>
                  <select
                    required
                    value={newComplaintForm.providerId}
                    onChange={e => setNewComplaintForm({ ...newComplaintForm, providerId: e.target.value })}
                    className="mt-2 w-full rounded-control border border-brand-border bg-brand-surface px-4 py-2.5 text-sm text-brand-foreground focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15"
                    disabled={providersLoading}
                  >
                    <option value="">{providersLoading ? 'Loading providers...' : 'Select a provider'}</option>
                    {providers.map(provider => <option key={provider.id} value={provider.id}>{provider.providerName} · {provider.providerCode}</option>)}
                  </select>
                </div>

                <div>
                  <label className="nmis-kicker">Complaint title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Delayed capitation disbursement"
                    value={newComplaintForm.title}
                    onChange={e => setNewComplaintForm({ ...newComplaintForm, title: e.target.value })}
                    className="mt-2 w-full rounded-control border border-brand-border bg-brand-surface px-4 py-2.5 text-sm text-brand-foreground focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="nmis-kicker">Category</label>
                    <select
                      value={newComplaintForm.category}
                      onChange={e => setNewComplaintForm({ ...newComplaintForm, category: e.target.value as ComplaintCategory })}
                      className="mt-2 w-full rounded-control border border-brand-border bg-brand-surface px-4 py-2.5 text-sm text-brand-foreground focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15"
                    >
                      {Object.entries(COMPLAINT_CATEGORY_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="nmis-kicker">Priority</label>
                    <select
                      value={newComplaintForm.priority}
                      onChange={e => setNewComplaintForm({ ...newComplaintForm, priority: e.target.value as ComplaintPriority })}
                      className="mt-2 w-full rounded-control border border-brand-border bg-brand-surface px-4 py-2.5 text-sm text-brand-foreground focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15"
                    >
                      {Object.entries(COMPLAINT_PRIORITY_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="nmis-kicker">Assigned officer</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Adebayo"
                    value={newComplaintForm.assignedTo}
                    onChange={e => setNewComplaintForm({ ...newComplaintForm, assignedTo: e.target.value })}
                    className="mt-2 w-full rounded-control border border-brand-border bg-brand-surface px-4 py-2.5 text-sm text-brand-foreground focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15"
                  />
                </div>

                <div>
                  <label className="nmis-kicker">Description</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Detailed description of the issue..."
                    value={newComplaintForm.description}
                    onChange={e => setNewComplaintForm({ ...newComplaintForm, description: e.target.value })}
                    className="mt-2 w-full rounded-control border border-brand-border bg-brand-surface px-4 py-2.5 text-sm text-brand-foreground focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15"
                  />
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-brand-divider pt-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setIsNewModalOpen(false)}
                    className="w-full rounded-control border border-brand-border px-4 py-2.5 text-xs font-bold text-brand-secondary transition hover:bg-brand-surface active:scale-[0.98] sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="w-full rounded-control bg-brand-blue px-4 py-2.5 text-xs font-bold text-white transition hover:bg-brand-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {createMutation.isPending ? 'Registering...' : 'Register Complaint'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function ComplaintMessages({ id }: { id: string }) {
  const { data: messages = [], isLoading } = useComplaintMessages(id);

  if (isLoading) return <div className="rounded-panel border border-brand-border bg-brand-surface p-4 text-center text-xs italic text-brand-muted">Loading support conversation...</div>;

  return (
    <div className="overflow-hidden rounded-panel border border-brand-border bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-brand-divider bg-brand-surface/70 px-4 py-4">
        <div>
          <div className="flex items-center gap-2 text-brand-navy">
            <MessageCircle className="h-4 w-4 text-brand-blue" />
            <p className="text-sm font-extrabold">Conversation timeline</p>
          </div>
          <p className="mt-1 text-xs text-brand-secondary">Messages exchanged between ODCHC Support and the reporter.</p>
        </div>
        <span className="rounded-pill bg-brand-soft px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-brand-blue">{messages.length} {messages.length === 1 ? 'message' : 'messages'}</span>
      </div>
      <div className="p-4">
        {messages.length === 0 ? (
          <p className="rounded-control border border-dashed border-brand-border bg-brand-surface p-4 text-xs text-brand-muted">No messages yet. Use the composer below to send the first reply.</p>
        ) : (
          <div className="max-h-72 space-y-2 overflow-y-auto rounded-panel bg-brand-background p-3">
            {messages.map(message => <ComplaintMessageBubble key={message.id} message={message} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function ComplaintMessageBubble({ message }: { message: ComplaintMessage }) {
  const isStaff = message.senderType === 'staff';
  return (
    <div className={`flex ${isStaff ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[88%] rounded-panel px-4 py-3 shadow-sm ${isStaff ? 'bg-brand-blue text-white' : 'border border-brand-border bg-white text-brand-foreground'}`}>
        <div className={`flex items-center justify-between gap-3 text-[10px] font-bold ${isStaff ? 'text-white/70' : 'text-brand-muted'}`}>
          <span>{isStaff ? 'ODCHC Support' : message.senderName}</span>
          <span>{new Date(message.createdAt).toLocaleString()}</span>
        </div>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{message.message}</p>
      </div>
    </div>
  );
}

function ComplaintHistory({ id }: { id: string }) {
  const { data: history = [], isLoading } = useComplaintHistory(id);

  if (isLoading) return <div className="rounded-panel border border-brand-border bg-brand-surface p-4 text-center text-xs italic text-brand-muted">Loading activity history...</div>;
  if (history.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-panel border border-brand-border bg-white shadow-sm">
      <div className="border-b border-brand-divider bg-brand-surface/70 px-4 py-4">
        <div className="flex items-center gap-2 text-brand-navy">
          <ClipboardList className="h-4 w-4 text-brand-blue" />
          <p className="text-sm font-extrabold">Activity & resolution history</p>
        </div>
        <p className="mt-1 text-xs text-brand-secondary">A secure audit trail of status changes and notes.</p>
      </div>
      <div className="space-y-3 p-4">
        {history.map((item) => (
          <div key={item.id} className="rounded-control border border-brand-border bg-brand-surface/60 p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wider text-brand-muted">
              <span>{item.createdByEmail}</span>
              <span>{new Date(item.createdAt).toLocaleString()}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-pill bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 capitalize">{item.statusFrom || 'new'}</span>
              <span className="text-brand-muted">→</span>
              <span className="rounded-pill bg-brand-soft px-2 py-1 text-xs font-extrabold text-brand-blue capitalize">{item.statusTo}</span>
            </div>
            {item.notes && (
              <p className="mt-3 whitespace-pre-wrap border-l-2 border-status-warning pl-3 py-1 text-sm italic leading-6 text-brand-secondary">
                {item.notes}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ComplaintsPage;
