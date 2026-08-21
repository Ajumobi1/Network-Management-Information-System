import { useState } from 'react';
import { Phone, Mail, MessageSquare, Users, Calendar, Clock, AlertCircle, Plus, CheckCircle2 } from 'lucide-react';
import { ProviderTabProps } from '../ProfileTabShell';
import { useCommunications, useCreateCommunication, useCompleteFollowUp } from '../../../../hooks/communication/communicationHooks';
import { CommunicationType, CommunicationChannel, CommunicationPriority, ProviderCommunication } from '../../../../types/communication/communicationTypes';
import Button from '../../../../components/ui/Button';
import Badge from '../../../../components/ui/Badge';

const channelIcons: Record<string, React.ReactNode> = {
  Phone: <Phone size={14} />,
  Email: <Mail size={14} />,
  SMS: <MessageSquare size={14} />,
  Meeting: <Users size={14} />,
  Letter: <Clock size={14} />,
  Portal: <MessageSquare size={14} />,
  Other: <Clock size={14} />,
};

const priorityColors: Record<string, string> = {
  Low: 'bg-slate-100 text-slate-700',
  Medium: 'bg-blue-100 text-blue-700',
  High: 'bg-amber-100 text-amber-700',
  Critical: 'bg-rose-100 text-rose-700',
};

export default function CommunicationTab({ provider }: ProviderTabProps) {
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedComm, setSelectedComm] = useState<ProviderCommunication | null>(null);
  const [form, setForm] = useState({
    type: 'General' as CommunicationType,
    subject: '',
    message: '',
    channel: 'Email' as CommunicationChannel,
    priority: 'Medium' as CommunicationPriority,
    followUpDate: '',
  });

  const { data: communications = [], isLoading } = useCommunications({
    search: '',
    providerId: provider.id,
    type: 'all',
    status: 'all',
    priority: 'all',
  });

  const createMutation = useCreateCommunication();
  const completeMutation = useCompleteFollowUp();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        providerId: provider.id,
        ...form,
      });
      setIsNewModalOpen(false);
      setForm({
        type: 'General',
        subject: '',
        message: '',
        channel: 'Email',
        priority: 'Medium',
        followUpDate: '',
      });
    } catch (err: any) {
      alert(err.message || 'Failed to log communication');
    }
  };

  const handleCompleteFollowUp = async (id: string) => {
    try {
      await completeMutation.mutateAsync(id);
    } catch (err: any) {
      alert(err.message || 'Failed to update follow-up');
    }
  };

  if (isLoading) return <div className="p-12 text-center text-slate-500">Loading communication history...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Provider Communication Log</h3>
          <p className="text-sm text-slate-500">Track all correspondence, meetings, and follow-up activities for this facility.</p>
        </div>
        <Button onClick={() => setIsNewModalOpen(true)} className="gap-2">
          <Plus size={16} /> Log Communication
        </Button>
      </div>

      {communications.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
          No communication history found for this facility.
        </div>
      ) : (
        <div className="space-y-4">
          {communications.map(comm => (
            <div key={comm.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft hover:border-indigo-200 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="mt-1 p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-500">
                    {channelIcons[comm.channel]}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-slate-900">{comm.subject}</h4>
                      <Badge variant="default" className="text-[10px] uppercase tracking-wider">{comm.type}</Badge>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${priorityColors[comm.priority]}`}>
                        {comm.priority}
                      </span>
                      {comm.status === 'Resolved' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">
                          Resolved
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2">{comm.message}</p>
                    <div className="flex items-center gap-4 pt-2 text-[11px] font-medium text-slate-400 uppercase tracking-tighter">
                      <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(comm.communicationDate).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><Users size={12} /> {comm.assignedOfficer || 'Unassigned'}</span>
                      {comm.followUpDate && (
                        <span className={`flex items-center gap-1 ${comm.followUpCompleted ? 'text-emerald-500' : 'text-amber-500'}`}>
                          <Clock size={12} /> Follow-up: {new Date(comm.followUpDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!comm.followUpCompleted && comm.followUpDate && (
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="text-[10px] h-8"
                      onClick={() => handleCompleteFollowUp(comm.id)}
                    >
                      Complete Follow-up
                    </Button>
                  )}
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="text-[10px] h-8"
                    onClick={() => setSelectedComm(comm)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Communication Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-slate-900 mb-6">Log New Communication</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="nmis-label">Type</label>
                  <select 
                    className="nmis-control"
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value as CommunicationType })}
                  >
                    <option value="General">General</option>
                    <option value="Credentialing">Credentialing</option>
                    <option value="Inspection">Inspection</option>
                    <option value="Complaint">Complaint</option>
                    <option value="Financial">Financial</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
                <div>
                  <label className="nmis-label">Channel</label>
                  <select 
                    className="nmis-control"
                    value={form.channel}
                    onChange={e => setForm({ ...form, channel: e.target.value as CommunicationChannel })}
                  >
                    <option value="Phone">Phone</option>
                    <option value="Email">Email</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Letter">Letter</option>
                    <option value="SMS">SMS</option>
                    <option value="Portal">Portal</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="nmis-label">Subject</label>
                <input 
                  type="text" 
                  className="nmis-control" 
                  required
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                />
              </div>

              <div>
                <label className="nmis-label">Message / Summary</label>
                <textarea 
                  className="nmis-control h-32" 
                  required
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="nmis-label">Priority</label>
                  <select 
                    className="nmis-control"
                    value={form.priority}
                    onChange={e => setForm({ ...form, priority: e.target.value as CommunicationPriority })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="nmis-label">Follow-up Date (Optional)</label>
                  <input 
                    type="date" 
                    className="nmis-control"
                    value={form.followUpDate}
                    onChange={e => setForm({ ...form, followUpDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <Button variant="secondary" onClick={() => setIsNewModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Logging...' : 'Save Communication'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedComm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 text-slate-500">
                  {channelIcons[selectedComm.channel]}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedComm.subject}</h3>
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">{selectedComm.channel} Correspondence</p>
                </div>
              </div>
              <button onClick={() => setSelectedComm(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Type</p>
                <p className="text-sm font-bold text-slate-700">{selectedComm.type}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                <p className="text-sm font-bold text-slate-700">{selectedComm.status}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Priority</p>
                <p className="text-sm font-bold text-slate-700">{selectedComm.priority}</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <h4 className="text-xs font-black uppercase tracking-widest text-brand-muted">Message Content</h4>
              <div className="rounded-3xl bg-slate-50 p-6 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap border border-slate-100">
                {selectedComm.message}
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-100 text-xs text-slate-400 font-bold uppercase tracking-tighter">
              <div className="flex gap-6">
                <span>Logged: {new Date(selectedComm.communicationDate).toLocaleString()}</span>
                <span>By: {selectedComm.assignedOfficer || 'System'}</span>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setSelectedComm(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
