import { useState, useMemo } from 'react';
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

type AuditEntry = {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  resource: string;
  status: 'success' | 'warning' | 'failure';
  details: string;
  ipAddress: string;
};

const mockAuditLogs: AuditEntry[] = [
  { id: '1', timestamp: '2026-08-21 17:45:12', user: 'Admin User', role: 'Super Admin', action: 'USER_LOCK', resource: 'Account: Aisha Quinn', status: 'success', details: 'Manual administrative lock applied to account.', ipAddress: '192.168.1.45' },
  { id: '2', timestamp: '2026-08-21 17:30:05', user: 'Daphne Harrison', role: 'Network Officer', action: 'INSPECTION_SUBMIT', resource: 'Facility: ADULOJU HOSPITAL', status: 'success', details: 'Completed QA checklist for Q3 2026.', ipAddress: '102.89.34.12' },
  { id: '3', timestamp: '2026-08-21 16:12:44', user: 'Peter Miles', role: 'Network Officer', action: 'DATA_UPLOAD', resource: 'Capitation: August 2026', status: 'warning', details: 'Upload completed with 2 non-matching aliases.', ipAddress: '105.112.9.88' },
  { id: '4', timestamp: '2026-08-21 15:05:22', user: 'System', role: 'Automated', action: 'BACKUP_SYNC', resource: 'Cloud Storage', status: 'success', details: 'Nightly database snapshot successfully verified.', ipAddress: 'Internal' },
  { id: '5', timestamp: '2026-08-21 14:22:10', user: 'Unknown', role: 'Unauthenticated', action: 'LOGIN_FAIL', resource: 'Auth Service', status: 'failure', details: 'Multiple failed login attempts from unrecognized IP.', ipAddress: '185.220.101.22' },
];

export default function AuditLogPage() {
  const [searchTerm, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'warning' | 'failure'>('all');
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert('Secure audit archive generated. The encrypted package is ready for download.');
    }, 2000);
  };

  const filteredLogs = useMemo(() => {
    return mockAuditLogs.filter(log => {
      const matchesSearch = 
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) || 
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

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
          <p className="text-xl font-black text-brand-foreground">1,284</p>
        </Card>
        <Card>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted mb-2">Failed Auth</p>
          <p className="text-xl font-black text-status-error">12</p>
        </Card>
        <Card>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted mb-2">Data Changes</p>
          <p className="text-xl font-black text-brand-orange">86</p>
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
              {filteredLogs.map(log => (
                <tr key={log.id} className="group">
                  <td>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-brand-foreground font-mono">{log.timestamp}</span>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-brand-muted uppercase tracking-tighter">
                        <Globe size={10} />
                        <span>{log.ipAddress}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-brand-soft flex items-center justify-center text-brand-blue font-black text-[10px]">
                        {log.user === 'System' ? <Database size={12} /> : log.user.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-brand-foreground">{log.user}</span>
                        <span className="text-[10px] font-medium text-brand-muted uppercase">{log.role}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-brand-blue uppercase tracking-wider">{log.action}</span>
                      <span className="text-xs font-medium text-brand-secondary mt-0.5">{log.resource}</span>
                    </div>
                  </td>
                  <td>
                    <Badge variant={log.status === 'success' ? 'success' : log.status === 'warning' ? 'warning' : 'error'} size="sm">
                      {log.status}
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
            Showing {filteredLogs.length} of {mockAuditLogs.length} recent security events
          </p>
          <div className="flex gap-4">
            <button className="text-[10px] font-black text-brand-blue uppercase tracking-widest hover:underline">Older Logs</button>
            <button className="text-[10px] font-black text-brand-blue uppercase tracking-widest hover:underline">Real-time Stream</button>
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
                <p className="text-sm font-black text-brand-secondary">{selectedEntry.resource}</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <h4 className="text-xs font-black uppercase tracking-widest text-brand-muted">Structured Data Details</h4>
              <div className="rounded-3xl bg-slate-900 p-6 text-sm text-status-success font-mono leading-relaxed whitespace-pre-wrap border border-white/10">
                {JSON.stringify({
                  timestamp: selectedEntry.timestamp,
                  actor: selectedEntry.user,
                  role: selectedEntry.role,
                  action: selectedEntry.action,
                  resource: selectedEntry.resource,
                  status: selectedEntry.status,
                  details: selectedEntry.details,
                  origin_ip: selectedEntry.ipAddress,
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
