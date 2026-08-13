import { useState } from 'react';
import { useComplaints, useCreateComplaint, useUpdateComplaintStatus } from '../../../../hooks/complaints/complaintHooks';
import { ComplaintCategory, ComplaintPriority, ComplaintStatus, COMPLAINT_CATEGORY_LABELS, COMPLAINT_PRIORITY_LABELS, COMPLAINT_STATUS_LABELS, ComplaintRecord } from '../../../../types/complaints/complaintTypes';
import { ProviderTabProps } from '../ProfileTabShell';

export default function ComplaintsTab({ provider }: ProviderTabProps) {
  const [filters] = useState({
    search: '',
    status: 'all' as 'all' | ComplaintStatus,
    category: 'all' as 'all' | ComplaintCategory,
    priority: 'all' as 'all' | ComplaintPriority,
  });

  const { data: allComplaints = [], isLoading } = useComplaints(filters);
  const providerComplaints = allComplaints.filter(c => c.providerId === provider.id);

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintRecord | null>(null);
  const [resolutionInput, setResolutionInput] = useState('');
  const [form, setForm] = useState({
    title: '',
    category: 'payment' as ComplaintCategory,
    priority: 'medium' as ComplaintPriority,
    description: '',
    assignedTo: '',
  });

  const createMutation = useCreateComplaint();
  const updateStatusMutation = useUpdateComplaintStatus();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        providerId: provider.id,
        ...form,
      });
      setIsNewModalOpen(false);
      setForm({
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

  const handleStatusChange = async (id: string, status: ComplaintStatus) => {
    try {
      await updateStatusMutation.mutateAsync({
        id,
        status,
        resolutionNotes: status === 'resolved' ? resolutionInput : undefined,
      });
      setSelectedComplaint(null);
      setResolutionInput('');
    } catch (err: any) {
      alert(err.message || 'Failed to update complaint status');
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading complaints...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Provider Complaints & Issues</h3>
          <p className="text-sm text-slate-500">Active grievances and resolution history for this facility.</p>
        </div>
        <button
          onClick={() => setIsNewModalOpen(true)}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
        >
          Log New Complaint
        </button>
      </div>

      {providerComplaints.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-soft">
          No complaints or issues logged for this facility.
        </div>
      ) : (
        <div className="space-y-4">
          {providerComplaints.map(c => (
            <div key={c.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-900">{c.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Logged on {new Date(c.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    c.priority === 'urgent' ? 'bg-rose-100 text-rose-700' :
                    c.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {COMPLAINT_PRIORITY_LABELS[c.priority]}
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    c.status === 'resolved' || c.status === 'closed' ? 'bg-emerald-100 text-emerald-700' :
                    c.status === 'escalated' ? 'bg-rose-100 text-rose-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {COMPLAINT_STATUS_LABELS[c.status]}
                  </span>
                </div>
              </div>

              <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-2xl">{c.description}</p>

              {c.resolutionNotes && (
                <div className="text-sm text-emerald-700 bg-emerald-50 p-4 rounded-2xl">
                  <span className="font-semibold">Resolution: </span>{c.resolutionNotes}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500">Assigned: {c.assignedTo || 'Unassigned'}</span>
                <button
                  onClick={() => setSelectedComplaint(c)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Review / Update
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-slate-900">Review Complaint: {selectedComplaint.title}</h3>
            <div className="mt-4 space-y-4">
              <textarea
                placeholder="Resolution notes..."
                value={resolutionInput}
                onChange={e => setResolutionInput(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 p-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                rows={3}
              />
              <div className="flex flex-wrap gap-2 justify-end">
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleStatusChange(selectedComplaint.id, 'resolved')}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  Mark Resolved
                </button>
                <button
                  onClick={() => handleStatusChange(selectedComplaint.id, 'escalated')}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
                >
                  Escalate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Complaint Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-slate-900">Log Complaint for Facility</h3>
            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value as ComplaintCategory })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
                  >
                    {Object.entries(COMPLAINT_CATEGORY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm({ ...form, priority: e.target.value as ComplaintPriority })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
                  >
                    {Object.entries(COMPLAINT_PRIORITY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
