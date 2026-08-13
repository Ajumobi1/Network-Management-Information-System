import { useState } from 'react';
import { MessageSquare, Phone, Mail, Users, Calendar, Clock, Search, Filter, AlertCircle, CheckCircle2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useCommunications, useCompleteFollowUp } from '../hooks/communication/communicationHooks';
import { CommunicationFilters, CommunicationType, CommunicationStatus, CommunicationPriority } from '../types/communication/communicationTypes';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';

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

export default function CommunicationPage() {
  const [filters, setFilters] = useState<CommunicationFilters>({
    search: '',
    type: 'all',
    status: 'all',
    priority: 'all',
  });

  const { data: communications = [], isLoading } = useCommunications(filters);
  const completeMutation = useCompleteFollowUp();

  const handleCompleteFollowUp = async (id: string) => {
    try {
      await completeMutation.mutateAsync(id);
    } catch (err: any) {
      alert(err.message || 'Failed to update follow-up');
    }
  };

  const openCount = communications.filter(c => c.status !== 'Resolved' && c.status !== 'Closed').length;
  const overdueCount = communications.filter(c => c.followUpDate && new Date(c.followUpDate) < new Date() && !c.followUpCompleted).length;
  const urgentCount = communications.filter(c => c.priority === 'Critical').length;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="Communication Hub"
          description="Manage provider correspondence, track meeting minutes, and monitor follow-up activities across the network."
          actions={[{ label: 'Export Activity Log', onClick: () => alert('Exporting communication logs...') }]}
        />

        {/* KPI Cards */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <p className="text-sm text-slate-500">Active Threads</p>
            <p className="mt-4 text-3xl font-semibold text-slate-900">{openCount}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <p className="text-sm text-slate-500">Overdue Follow-ups</p>
            <p className="mt-4 text-3xl font-semibold text-rose-600">{overdueCount}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <p className="text-sm text-slate-500">Critical Priority</p>
            <p className="mt-4 text-3xl font-semibold text-amber-600">{urgentCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex flex-wrap items-center gap-4 flex-1">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search by subject, provider, or message..."
                value={filters.search}
                onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <select
              value={filters.type}
              onChange={e => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="General">General</option>
              <option value="Credentialing">Credentialing</option>
              <option value="Inspection">Inspection</option>
              <option value="Complaint">Complaint</option>
              <option value="Financial">Financial</option>
            </select>
            <select
              value={filters.status}
              onChange={e => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Communications Table */}
        <div className="rounded-3xl border border-slate-200 bg-white shadow-soft overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Communication Register</h2>
          </div>
          {isLoading ? (
            <div className="p-12 text-center text-slate-500">Loading communications...</div>
          ) : communications.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No communication records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-3">Provider</th>
                    <th className="px-6 py-3">Subject / Type</th>
                    <th className="px-6 py-3">Channel</th>
                    <th className="px-6 py-3">Priority</th>
                    <th className="px-6 py-3">Follow-up</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {communications.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{c.providerName}</p>
                        <p className="text-xs text-slate-500">{c.providerCode}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{c.subject}</p>
                        <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          {c.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          {channelIcons[c.channel]}
                          <span>{c.channel}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${priorityColors[c.priority]}`}>
                          {c.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {c.followUpDate ? (
                          <div className={`flex flex-col ${c.followUpCompleted ? 'text-emerald-600' : new Date(c.followUpDate) < new Date() ? 'text-rose-600' : 'text-amber-600'}`}>
                            <span className="font-medium">{new Date(c.followUpDate).toLocaleDateString()}</span>
                            <span className="text-[10px] uppercase font-bold tracking-tighter">
                              {c.followUpCompleted ? 'Completed' : new Date(c.followUpDate) < new Date() ? 'Overdue' : 'Pending'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {!c.followUpCompleted && c.followUpDate && (
                            <button
                              onClick={() => handleCompleteFollowUp(c.id)}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50"
                              title="Mark Follow-up Complete"
                            >
                              <CheckCircle2 size={18} />
                            </button>
                          )}
                          <button
                            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
