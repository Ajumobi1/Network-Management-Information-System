import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { useComplaints, useCreateComplaint, useUpdateComplaintStatus, useComplaintHistory, useComplaintMessages, useSendComplaintMessage } from '../hooks/complaints/complaintHooks';
import { ComplaintMessage } from '../types/complaints/complaintTypes';
import { Send } from 'lucide-react';
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
      alert(err.message || 'Failed to send message');
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

  const openCount = complaints.filter(c => c.status === 'open' || c.status === 'in-review').length;
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
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="Provider complaints & issue management"
          description="Track, assign, and resolve provider grievances with secure workflow tracking and audit trails."
          actions={[{ label: 'Register new complaint', onClick: () => setIsNewModalOpen(true) }]}
        />

        {/* KPI Cards */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <p className="text-sm text-slate-500">Active / Open issues</p>
            <p className="mt-4 text-3xl font-semibold text-slate-900">{openCount}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <p className="text-sm text-slate-500">Resolved & Closed</p>
            <p className="mt-4 text-3xl font-semibold text-slate-900">{resolvedCount}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <p className="text-sm text-slate-500">Escalated</p>
            <p className="mt-4 text-3xl font-semibold text-rose-600">{escalatedCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex flex-wrap items-center gap-4 flex-1">
            <button
              type="button"
              onClick={handleExport}
              disabled={!complaints.length}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Export CSV
            </button>
            <input
              type="text"
              placeholder="Search by title, provider, code..."
              value={filters.search}
              onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none min-w-[260px]"
            />
            <select
              value={filters.status}
              onChange={e => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              {Object.entries(COMPLAINT_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select
              value={filters.category}
              onChange={e => setFilters(prev => ({ ...prev, category: e.target.value as any }))}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">All Categories</option>
              {Object.entries(COMPLAINT_CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select
              value={filters.priority}
              onChange={e => setFilters(prev => ({ ...prev, priority: e.target.value as any }))}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">All Priorities</option>
              {Object.entries(COMPLAINT_PRIORITY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Complaints Table */}
        <div className="rounded-3xl border border-slate-200 bg-white shadow-soft overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Complaints register</h2>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading complaints...</div>
          ) : complaints.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No complaints found matching criteria.</div>
          ) : (
            <div className="nmis-table-scroll">
              <table className="w-full min-w-[900px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-3">Reference / Source</th>
                    <th className="px-6 py-3">Provider</th>
                    <th className="px-6 py-3">Title / Category</th>
                    <th className="px-6 py-3">Priority</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {complaints.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{c.referenceNumber}</p>
                        <span className={`inline-block mt-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          c.source === 'public' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {c.source}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{c.providerName}</p>
                        <p className="text-xs text-slate-500">{c.providerCode || 'Public submission'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{c.title}</p>
                        <span className="inline-block mt-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {COMPLAINT_CATEGORY_LABELS[c.category]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                          c.priority === 'urgent' ? 'bg-rose-100 text-rose-700' :
                          c.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {COMPLAINT_PRIORITY_LABELS[c.priority]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                          c.status === 'resolved' || c.status === 'closed' ? 'bg-emerald-100 text-emerald-700' :
                          c.status === 'escalated' ? 'bg-rose-100 text-rose-700' :
                          c.status === 'submitted' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {COMPLAINT_STATUS_LABELS[c.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedComplaint(c)}
                          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Complaint Review Drawer / Modal */}
        {selectedComplaint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
            <div className="max-h-[calc(100dvh-1rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:max-h-[90vh] sm:rounded-3xl sm:p-6">
              <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">{selectedComplaint.title}</h3>
                    <p className="text-sm text-slate-500">{selectedComplaint.referenceNumber} · {selectedComplaint.providerName} {selectedComplaint.providerCode ? `(${selectedComplaint.providerCode})` : ''}</p>
                  </div>
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <div className="grid gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Category</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{COMPLAINT_CATEGORY_LABELS[selectedComplaint.category]}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Priority</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{COMPLAINT_PRIORITY_LABELS[selectedComplaint.priority]}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Current Status</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{COMPLAINT_STATUS_LABELS[selectedComplaint.status]}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Assigned Officer</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{selectedComplaint.assignedTo || 'Unassigned'}</p>
                  </div>
                </div>

                {selectedComplaint.source === 'public' && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">Reported by</p>
                    <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                      <div><p className="text-xs text-amber-700/70">Name</p><p className="font-semibold text-slate-900">{selectedComplaint.complainantName || 'Not provided'}</p></div>
                      <div><p className="text-xs text-amber-700/70">Phone</p><p className="font-semibold text-slate-900">{selectedComplaint.contactPhone || 'Not provided'}</p></div>
                      <div><p className="text-xs text-amber-700/70">Email</p><p className="break-all font-semibold text-slate-900">{selectedComplaint.contactEmail || 'Not provided'}</p></div>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm font-semibold text-slate-900">Description</p>
                  <p className="mt-1 text-sm text-slate-600 bg-slate-50 p-4 rounded-2xl whitespace-pre-wrap">{selectedComplaint.description}</p>
                </div>

                <ComplaintHistory id={selectedComplaint.id} />
                <ComplaintMessages id={selectedComplaint.id} />

                <div className="rounded-2xl border border-brand-border bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">Reply to reporter</p>
                  <p className="mt-1 text-xs text-slate-500">Messages are visible to the complainant when they track this reference number.</p>
                  <div className="mt-3 flex gap-2">
                    <textarea
                      value={messageInput}
                      onChange={e => setMessageInput(e.target.value)}
                      placeholder="Write a message to the reporter..."
                      rows={2}
                      className="min-w-0 flex-1 rounded-xl border border-slate-200 p-3 text-sm text-slate-900 focus:border-brand-blue focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={sendMessageMutation.isPending || !messageInput.trim()}
                      className="self-end rounded-xl bg-brand-blue px-4 py-3 text-xs font-semibold text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4 space-y-4">
                  <p className="text-sm font-semibold text-slate-900">Update Status & Resolve</p>
                  <textarea
                    placeholder="Enter resolution notes (required if marking as resolved)..."
                    value={resolutionInput}
                    onChange={e => setResolutionInput(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 p-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                    rows={3}
                  />

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleStatusChange(selectedComplaint.id, 'in-review')}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      Set In Review
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedComplaint.id, 'escalated')}
                      className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700"
                    >
                      Escalate Issue
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedComplaint.id, 'resolved')}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      Mark Resolved
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedComplaint.id, 'closed')}
                      className="rounded-xl bg-slate-700 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
            <div className="max-h-[calc(100dvh-1rem)] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:max-h-[90vh] sm:rounded-3xl sm:p-6">
              <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
                <h3 className="text-xl font-semibold text-slate-900">Register new complaint</h3>
                <button
                  onClick={() => setIsNewModalOpen(false)}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreate} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Provider / Facility</label>
                  <select
                    required
                    value={newComplaintForm.providerId}
                    onChange={e => setNewComplaintForm({ ...newComplaintForm, providerId: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                    disabled={providersLoading}
                  >
                    <option value="">{providersLoading ? 'Loading providers...' : 'Select a provider'}</option>
                    {providers.map(provider => <option key={provider.id} value={provider.id}>{provider.providerName} · {provider.providerCode}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Complaint Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Delayed capitation disbursement"
                    value={newComplaintForm.title}
                    onChange={e => setNewComplaintForm({ ...newComplaintForm, title: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</label>
                    <select
                      value={newComplaintForm.category}
                      onChange={e => setNewComplaintForm({ ...newComplaintForm, category: e.target.value as ComplaintCategory })}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                    >
                      {Object.entries(COMPLAINT_CATEGORY_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</label>
                    <select
                      value={newComplaintForm.priority}
                      onChange={e => setNewComplaintForm({ ...newComplaintForm, priority: e.target.value as ComplaintPriority })}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                    >
                      {Object.entries(COMPLAINT_PRIORITY_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Officer</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Adebayo"
                    value={newComplaintForm.assignedTo}
                    onChange={e => setNewComplaintForm({ ...newComplaintForm, assignedTo: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Detailed description of the issue..."
                    value={newComplaintForm.description}
                    onChange={e => setNewComplaintForm({ ...newComplaintForm, description: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setIsNewModalOpen(false)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 sm:w-auto"
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

  if (isLoading) return <div className="py-3 text-center text-xs text-slate-400 italic">Loading conversation...</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">Conversation with reporter</p>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{messages.length} messages</span>
      </div>
      {messages.length === 0 ? (
        <p className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">No messages yet. Send the first reply to the reporter.</p>
      ) : (
        <div className="max-h-72 space-y-2 overflow-y-auto rounded-2xl bg-slate-50 p-3">
          {messages.map(message => <ComplaintMessageBubble key={message.id} message={message} />)}
        </div>
      )}
    </div>
  );
}

function ComplaintMessageBubble({ message }: { message: ComplaintMessage }) {
  const isStaff = message.senderType === 'staff';
  return (
    <div className={`flex ${isStaff ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${isStaff ? 'bg-brand-blue text-white' : 'bg-white text-slate-900 shadow-sm'}`}>
        <div className={`flex items-center justify-between gap-3 text-[10px] font-bold ${isStaff ? 'text-white/70' : 'text-slate-400'}`}>
          <span>{message.senderName}</span>
          <span>{new Date(message.createdAt).toLocaleString()}</span>
        </div>
        <p className="mt-1 whitespace-pre-wrap text-sm">{message.message}</p>
      </div>
    </div>
  );
}

function ComplaintHistory({ id }: { id: string }) {
  const { data: history = [], isLoading } = useComplaintHistory(id);

  if (isLoading) return <div className="py-4 text-center text-xs text-slate-400 italic">Loading history...</div>;
  if (history.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-slate-900">Activity & Resolution History</p>
      <div className="space-y-3">
        {history.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3 text-sm">
            <div className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span>{item.createdByEmail}</span>
              <span>{new Date(item.createdAt).toLocaleString()}</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 capitalize">{item.statusFrom || 'new'}</span>
              <span className="text-slate-300">→</span>
              <span className="text-xs font-black text-indigo-600 capitalize">{item.statusTo}</span>
            </div>
            {item.notes && (
              <p className="mt-2 text-slate-600 whitespace-pre-wrap italic border-l-2 border-slate-200 pl-3 py-1">
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
