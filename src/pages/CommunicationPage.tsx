import { useState, useMemo } from 'react';
import { 
  MessageSquare, Phone, Mail, Users, Calendar, Clock, Search, 
  Filter, AlertCircle, CheckCircle2, Megaphone, Send, 
  FileText, ArrowRight, UserPlus, ShieldCheck, BellRing
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { useCommunications, useCompleteFollowUp } from '../hooks/communication/communicationHooks';
import { CommunicationFilters } from '../types/communication/communicationTypes';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { SectionHeader } from '../components/ui/LayoutComponents';

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
  const [activeTab, setActiveTab] = useState<'register' | 'announcements' | 'broadcast'>('register');
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

  const stats = useMemo(() => {
    return {
      open: communications.filter(c => c.status !== 'Resolved' && c.status !== 'Closed').length,
      overdue: communications.filter(c => c.followUpDate && new Date(c.followUpDate) < new Date() && !c.followUpCompleted).length,
      urgent: communications.filter(c => c.priority === 'Critical').length,
    };
  }, [communications]);

  return (
    <main className="nmis-page">
      <PageHeader
        eyebrow="Communication Centre"
        title="Network Correspondence Hub"
        subtitle="Manage official provider communications, broadcast system-wide announcements, and monitor engagement across the ODCHC network."
        actions={[
          { label: 'New Communication', icon: <Send size={16} />, onClick: () => alert('Opening dispatch composer...') },
          { label: 'Export Logs', variant: 'secondary', onClick: () => alert('Preparing communication audit export...') }
        ]}
      />

      {/* Professional KPI Dashboard */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="relative overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-brand-blue/10 p-4 text-brand-blue">
              <MessageSquare size={24} />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-brand-muted">Active Threads</p>
              <p className="text-3xl font-black text-brand-foreground">{stats.open}</p>
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 opacity-5 text-brand-blue">
            <MessageSquare size={80} />
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-status-errorSoft p-4 text-status-error">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-brand-muted">Overdue Follow-ups</p>
              <p className="text-3xl font-black text-status-error">{stats.overdue}</p>
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 opacity-5 text-status-error">
            <Clock size={80} />
          </div>
        </Card>

        <Card className="relative overflow-hidden border-brand-orange/20 bg-brand-orange/5">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-brand-orange/20 p-4 text-brand-orange">
              <BellRing size={24} />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-brand-muted">Critical Priority</p>
              <p className="text-3xl font-black text-brand-orange">{stats.urgent}</p>
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 opacity-5 text-brand-orange">
            <BellRing size={80} />
          </div>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-brand-border">
        <button
          onClick={() => setActiveTab('register')}
          className={`px-6 py-4 text-sm font-bold transition-all ${activeTab === 'register' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-brand-muted hover:text-brand-foreground'}`}
        >
          Communication Register
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          className={`px-6 py-4 text-sm font-bold transition-all ${activeTab === 'announcements' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-brand-muted hover:text-brand-foreground'}`}
        >
          System Announcements
        </button>
        <button
          onClick={() => setActiveTab('broadcast')}
          className={`px-6 py-4 text-sm font-bold transition-all ${activeTab === 'broadcast' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-brand-muted hover:text-brand-foreground'}`}
        >
          Mass Broadcast
        </button>
      </div>

      {activeTab === 'register' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Enhanced Filters */}
          <Card className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div className="flex flex-1 flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-subtle" size={18} />
                <input
                  type="text"
                  placeholder="Search by subject, provider, or reference ID..."
                  value={filters.search}
                  onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="nmis-control pl-10"
                />
              </div>
              <select
                value={filters.type}
                onChange={e => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
                className="nmis-control w-auto"
              >
                <option value="all">All Categories</option>
                <option value="General">General Correspondence</option>
                <option value="Credentialing">Credentialing Support</option>
                <option value="Inspection">Inspection Feedback</option>
                <option value="Complaint">Complaint Resolution</option>
                <option value="Financial">Financial Queries</option>
              </select>
              <select
                value={filters.status}
                onChange={e => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                className="nmis-control w-auto"
              >
                <option value="all">All Statuses</option>
                <option value="Open">Open Threads</option>
                <option value="In Progress">Under Review</option>
                <option value="Resolved">Resolved Cases</option>
                <option value="Closed">Archived</option>
              </select>
            </div>
          </Card>

          {/* Data Table */}
          <Card className="p-0 overflow-hidden">
            <div className="nmis-table-wrap">
              <table className="nmis-table">
                <thead>
                  <tr>
                    <th>Provider / Entity</th>
                    <th>Subject & Reference</th>
                    <th>Channel</th>
                    <th>Priority</th>
                    <th>Follow-up</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={6} className="py-20 text-center text-brand-muted">Synchronizing correspondence data...</td></tr>
                  ) : communications.length === 0 ? (
                    <tr><td colSpan={6} className="py-20 text-center text-brand-muted">No active communication threads found.</td></tr>
                  ) : (
                    communications.map(c => (
                      <tr key={c.id}>
                        <td>
                          <p className="font-bold text-brand-foreground">{c.providerName}</p>
                          <p className="text-xs font-medium text-brand-muted">{c.providerCode}</p>
                        </td>
                        <td>
                          <p className="font-semibold text-brand-foreground">{c.subject}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-brand-blue bg-brand-blue/10 px-2 py-0.5 rounded">
                              {c.type}
                            </span>
                            <span className="text-[10px] font-bold text-brand-muted">REF: COMM-{c.id.slice(0, 5).toUpperCase()}</span>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2 text-brand-secondary font-medium">
                            <span className="rounded-lg bg-brand-soft p-1.5 text-brand-blue">
                              {channelIcons[c.channel]}
                            </span>
                            <span>{c.channel}</span>
                          </div>
                        </td>
                        <td>
                          <Badge 
                            variant={c.priority === 'Critical' ? 'error' : c.priority === 'High' ? 'warning' : 'default'}
                            className="font-bold"
                          >
                            {c.priority}
                          </Badge>
                        </td>
                        <td>
                          {c.followUpDate ? (
                            <div className={`flex flex-col ${c.followUpCompleted ? 'text-status-success' : new Date(c.followUpDate) < new Date() ? 'text-status-error' : 'text-brand-orange'}`}>
                              <span className="text-xs font-black tracking-tight">{new Date(c.followUpDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                              <span className="text-[10px] uppercase font-black tracking-tighter">
                                {c.followUpCompleted ? '✓ Completed' : new Date(c.followUpDate) < new Date() ? '!! Overdue' : '○ Pending'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-brand-subtle font-bold">—</span>
                          )}
                        </td>
                        <td className="text-right">
                          <div className="flex justify-end gap-2">
                            {!c.followUpCompleted && c.followUpDate && (
                              <button
                                onClick={() => handleCompleteFollowUp(c.id)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-status-success hover:bg-status-successSoft transition-colors"
                                title="Mark as Completed"
                              >
                                <CheckCircle2 size={18} />
                              </button>
                            )}
                            <Button variant="secondary" size="sm" className="h-8">Details</Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'announcements' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <SectionHeader title="System Announcements" subtitle="Official notices visible to all providers on their portal dashboards." />
          <div className="grid gap-6 lg:grid-cols-2">
            {[
              { title: 'Q3 2026 Capitation Schedule', date: 'Aug 15, 2026', type: 'Financial', content: 'The capitation disbursement schedule for the upcoming quarter has been finalized. Please review the updated payment windows.', active: true },
              { title: 'Updated Credentialing Guidelines', date: 'Aug 10, 2026', type: 'Regulatory', content: 'New requirements for Physician-in-Charge certifications are now in effect. All providers must update their records by Sep 30.', active: true },
              { title: 'Portal Maintenance Notice', date: 'Aug 05, 2026', type: 'System', content: 'Scheduled maintenance will occur on Aug 25 between 02:00 and 04:00 UTC. The portal may be temporarily unavailable.', active: false },
            ].map((ann, idx) => (
              <Card key={idx} className="relative border-l-4 border-brand-blue">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-black text-brand-foreground">{ann.title}</h3>
                    <p className="text-xs font-bold text-brand-muted uppercase tracking-widest mt-1">{ann.date} • {ann.type}</p>
                  </div>
                  <Badge variant={ann.active ? 'success' : 'default'}>{ann.active ? 'Active' : 'Archived'}</Badge>
                </div>
                <p className="text-sm leading-relaxed text-brand-secondary mb-6">{ann.content}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary">Edit Notice</Button>
                  <Button size="sm" variant="ghost" className="text-status-error">Deactivate</Button>
                </div>
              </Card>
            ))}
            <button className="flex flex-col items-center justify-center rounded-panel border-2 border-dashed border-brand-divider p-10 text-brand-muted hover:border-brand-blue hover:text-brand-blue transition-all group">
              <Megaphone size={40} className="mb-4 opacity-40 group-hover:opacity-100 transition-opacity" />
              <p className="font-black uppercase tracking-widest text-sm">Post New Announcement</p>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'broadcast' && (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <SectionHeader title="Mass Broadcast Composer" subtitle="Send direct SMS or Email notifications to specific provider groups." />
          <Card>
            <div className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-brand-muted">Target Audience</label>
                  <select className="nmis-control">
                    <option>All Accredited Providers</option>
                    <option>Government Hospitals Only</option>
                    <option>Private Facilities Only</option>
                    <option>Pharmacies Only</option>
                    <option>Providers with Pending Audits</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-brand-muted">Delivery Channel</label>
                  <select className="nmis-control">
                    <option>Email & Portal Notification</option>
                    <option>SMS Only</option>
                    <option>Email Only</option>
                    <option>Portal Dashboard Only</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-brand-muted">Broadcast Subject</label>
                <Input placeholder="Enter message headline..." />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-brand-muted">Message Content</label>
                <textarea 
                  className="nmis-control min-h-[200px] resize-none" 
                  placeholder="Compose your message here. Use {provider_name} for personalization..."
                />
              </div>
              <div className="pt-4 flex items-center justify-between border-t border-brand-divider">
                <div className="flex items-center gap-2 text-xs font-bold text-brand-muted">
                  <ShieldCheck size={14} />
                  <span>Approved for 108 recipient(s)</span>
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary">Save Draft</Button>
                  <Button className="gap-2"><Send size={16} /> Dispatch Broadcast</Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}
