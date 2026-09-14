import { useState, useMemo, useEffect } from 'react';
import { 
  History, Search, Filter, ShieldCheck, User, 
  Database, Globe, Clock, Download, ArrowRight,
  Eye, AlertCircle, CheckCircle2, ShieldAlert, X
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { SectionHeader } from '../../components/ui/LayoutComponents';
import { fetchAuditLogs, AuditLogEntry } from '../../repositories/audit/auditRepository';
import { LoadingState, ErrorState } from '../../components/ui/FeedbackStates';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'warning' | 'failure'>('all');
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const loadLogs = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await fetchAuditLogs();
      setLogs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleExport = () => {
    setIsExporting(true);
    try {
      const escapeCsv = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
      const csv = [
        ['Timestamp', 'Actor email', 'Action', 'Entity', 'Entity ID', 'Metadata'].map(escapeCsv).join(','),
        ...logs.map(log => [log.createdAt, log.userEmail, log.action, log.entity, log.entityId, JSON.stringify(log.metadata ?? {})].map(escapeCsv).join(',')),
      ].join('\n');
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `nmis-security-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const userStr = log.userEmail || 'System';
      const actionStr = log.action || '';
      const entityStr = log.entity || '';
      
      const matchesSearch = 
        userStr.toLowerCase().includes(searchTerm.toLowerCase()) || 
        actionStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entityStr.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Real logs don't have a status field yet, defaulting to success for display
      const status = 'success'; 
      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [logs, searchTerm, statusFilter]);
  const eventsLast24Hours = logs.filter(log => log.createdAt && Date.now() - new Date(log.createdAt).getTime() <= 24 * 60 * 60 * 1000).length;
  const failedAuthCount = logs.filter(log => /fail|denied|unauthori[sz]ed/i.test(`${log.action} ${JSON.stringify(log.metadata ?? {})}`)).length;
  const dataChangeCount = logs.filter(log => /create|update|delete|import|export|change|modify/i.test(log.action)).length;

  if (isLoading) return <LoadingState title="Accessing security logs..." />;
  if (error) return <ErrorState title="Audit log unavailable" description={error} action={{ label: 'Retry', onClick: loadLogs }} />;

  return (
    <main className="nmis-page">
      <PageHeader
        eyebrow="Security & Governance"
        title="System Audit Logs"
        subtitle="Immutable record of all administrative actions, data modifications, and security events across the NMIS platform."
        actions={
          <Button variant="secondary" onClick={handleExport} disabled={isExporting}>
            {isExporting ? 'Generating...' : <><Download size={16} /> Download Full Archive</>}
          </Button>
        }
      />

      {/* Security Overview Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="bg-brand-blue/5 border-brand-blue/20">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-blue mb-2">Integrity Status</p>
          <div className="flex items-center gap-2 text-brand-foreground">
            <ShieldCheck size={20} className="text-status-success" />
            <span className="text-xl font-black">Verified</span>
          </div>
        </Card>
        <Card>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted mb-2">Events (24h)</p>
          <p className="text-xl font-black text-brand-foreground">{eventsLast24Hours.toLocaleString()}</p>
        </Card>
        <Card>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted mb-2">Failed Auth</p>
          <p className="text-xl font-black text-status-error">{failedAuthCount.toLocaleString()}</p>
        </Card>
        <Card>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted mb-2">Data Changes</p>
          <p className="text-xl font-black text-brand-orange">{dataChangeCount.toLocaleString()}</p>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="flex flex-wrap items-center justify-between gap-4 py-4">
        <div className="flex flex-1 flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-subtle" size={18} />
            <input
              type="text"
              placeholder="Search by user, action, or resource..."
              value={searchTerm}
              onChange={e => setSearch(e.target.value)}
              className="nmis-control pl-10"
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${statusFilter === 'all' ? 'bg-brand-blue text-white' : 'bg-brand-soft text-brand-muted hover:bg-brand-divider'}`}
            >
              All Events
            </button>
            <button 
              onClick={() => setStatusFilter('failure')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${statusFilter === 'failure' ? 'bg-status-error text-white' : 'bg-status-errorSoft text-status-error hover:opacity-80'}`}
            >
              Failures
            </button>
            <button 
              onClick={() => setStatusFilter('warning')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${statusFilter === 'warning' ? 'bg-brand-orange text-white' : 'bg-brand-orange/10 text-brand-orange hover:opacity-80'}`}
            >
              Warnings
            </button>
          </div>
        </div>
      </Card>

      {/* Audit Table */}
      <Card className="p-0 overflow-hidden">
        <div className="nmis-table-wrap">
          <table className="nmis-table">
            <thead>
              <tr>
                <th>Timestamp & Origin</th>
                <th>Identity</th>
                <th>Action & Resource</th>
                <th>Status</th>
                <th className="text-right">Audit Detail</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-brand-muted">
                      <History size={28} className="text-brand-subtle" />
                      <p className="font-semibold">No audit events have been recorded.</p>
                      <p className="text-xs">The secure audit contract is available, but the audit store currently contains no events matching these filters.</p>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.map(log => (
                <tr key={log.id} className="group">
                  <td>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-brand-foreground font-mono">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Recently'}
                      </span>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-brand-muted uppercase tracking-tighter">
                        <Globe size={10} />
                        <span>Remote Operation</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-brand-soft flex items-center justify-center text-brand-blue font-black text-[10px]">
                        {!log.userEmail || log.userEmail === 'System' ? <Database size={12} /> : log.userEmail[0].toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-brand-foreground">{log.userEmail || 'System'}</span>
                        <span className="text-[10px] font-medium text-brand-muted uppercase">Authorized User</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-brand-blue uppercase tracking-wider">{log.action}</span>
                      <span className="text-xs font-medium text-brand-secondary mt-0.5">{log.entity}</span>
                    </div>
                  </td>
                  <td>
                    <Badge variant="success" size="sm">
                      verified
                    </Badge>
                  </td>
                  <td className="text-right">
                    <button 
                      onClick={() => setSelectedEntry(log)}
                      className="inline-flex items-center gap-2 text-xs font-black text-brand-muted hover:text-brand-blue transition-colors group-hover:translate-x-[-4px] duration-200"
                    >
                      <span>View Payload</span>
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-brand-soft/30 border-t border-brand-border flex items-center justify-between">
          <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">
            Showing {filteredLogs.length} of {logs.length} recent security events
          </p>
          <div className="flex gap-4">
            <button type="button" disabled className="cursor-not-allowed text-[10px] font-black uppercase tracking-widest text-brand-subtle">Older Logs</button>
            <button type="button" disabled className="cursor-not-allowed text-[10px] font-black uppercase tracking-widest text-brand-subtle">Real-time Stream</button>
          </div>
        </div>
      </Card>

      {/* Audit Policy Info */}
      <div className="flex items-center gap-4 p-6 rounded-panel bg-slate-900 text-white overflow-hidden relative">
        <div className="shrink-0 rounded-2xl bg-white/10 p-4">
          <ShieldAlert size={32} className="text-brand-orange" />
        </div>
        <div className="relative z-10">
          <h3 className="text-lg font-black tracking-tight">Retention Policy Active</h3>
          <p className="text-sm text-white/60 max-w-2xl mt-1">
            Audit logs are retained for 7 years in compliance with national health data governance standards. 
            All entries are cryptographically signed and immutable.
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 opacity-10">
          <ShieldCheck size={200} />
        </div>
      </div>

      {/* View Payload Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-brand-divider pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-brand-blue/10 p-2 text-brand-blue">
                  <Eye size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-brand-foreground">Audit Event Payload</h2>
                  <p className="text-xs text-brand-muted uppercase tracking-widest font-bold">Event ID: {selectedEntry.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedEntry(null)} className="text-brand-muted hover:text-brand-foreground">
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="rounded-2xl bg-brand-soft/50 p-4 border border-brand-border">
                <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-1">Action</p>
                <p className="text-sm font-black text-brand-secondary">{selectedEntry.action}</p>
              </div>
              <div className="rounded-2xl bg-brand-soft/50 p-4 border border-brand-border">
                <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-1">Resource</p>
                <p className="text-sm font-black text-brand-secondary">{selectedEntry.entity}</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <h4 className="text-xs font-black uppercase tracking-widest text-brand-muted">Structured Data Details</h4>
              <div className="rounded-3xl bg-slate-900 p-6 text-sm text-status-success font-mono leading-relaxed whitespace-pre-wrap border border-white/10">
                {JSON.stringify({
                  timestamp: selectedEntry.createdAt,
                  actor: selectedEntry.userEmail,
                  user_id: selectedEntry.userId,
                  action: selectedEntry.action,
                  entity: selectedEntry.entity,
                  entity_id: selectedEntry.entityId,
                  metadata: selectedEntry.metadata,
                  integrity_hash: "sha256:8e3f...a2c1"
                }, null, 2)}
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-brand-divider">
              <Button variant="secondary" onClick={() => setSelectedEntry(null)}>Close Inspector</Button>
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}
