import { useState } from 'react';
import { 
  Database, ShieldCheck, AlertTriangle, Trash2, 
  Download, RefreshCw, FileWarning, CheckCircle2,
  HardDrive, History, FileStack, Archive
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { SectionHeader } from '../../components/ui/LayoutComponents';

export default function DataManagementPage() {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      alert('Data integrity synchronization complete.');
    }, 2000);
  };

  return (
    <main className="nmis-page">
      <PageHeader
        eyebrow="Administration"
        title="Data Lifecycle & Management"
        subtitle="Perform database maintenance, manage data archives, and ensure system-wide information integrity."
        actions={
          <Button variant="secondary" className="gap-2" onClick={handleSync} disabled={isSyncing}>
            <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} /> 
            {isSyncing ? 'Synchronizing...' : 'Sync Integrity'}
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-brand-blue/5 border-brand-blue/20">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-brand-blue/10 p-4 text-brand-blue">
              <Database size={24} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-brand-muted">DB Capacity</p>
              <p className="text-2xl font-black text-brand-foreground">1.2 GB / 50 GB</p>
            </div>
          </div>
        </Card>
        <Card className="bg-status-successSoft border-status-success/20">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-status-successSoft p-4 text-status-success">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-brand-muted">Integrity Status</p>
              <p className="text-2xl font-black text-status-success">Verified</p>
            </div>
          </div>
        </Card>
        <Card className="bg-brand-orange/5 border-brand-orange/20">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-brand-orange/10 p-4 text-brand-orange">
              <Archive size={24} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-brand-muted">Archived Records</p>
              <p className="text-2xl font-black text-brand-orange">14,205</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Maintenance Tools */}
        <div className="space-y-6">
          <SectionHeader title="Maintenance Protocols" subtitle="Core database health and optimization tools." />
          <div className="space-y-4">
            {[
              { name: 'Index Optimization', desc: 'Rebuild database indexes for faster query performance.', icon: <HardDrive size={18} /> },
              { name: 'Cache Purge', desc: 'Clear global application cache and refresh edge configurations.', icon: <RefreshCw size={18} /> },
              { name: 'Audit Log Rotation', desc: 'Archive audit logs older than 180 days to cold storage.', icon: <History size={18} /> },
            ].map(tool => (
              <Card key={tool.name} className="group hover:border-brand-blue/30 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-brand-soft text-brand-blue">{tool.icon}</div>
                    <div>
                      <p className="font-bold text-brand-foreground">{tool.name}</p>
                      <p className="text-xs text-brand-muted">{tool.desc}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">Execute</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Critical Actions */}
        <div className="space-y-6">
          <SectionHeader title="System Integrity & Backup" subtitle="Manage backups and handle data recovery scenarios." />
          <Card className="border-l-4 border-l-brand-orange">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-brand-orange/10 text-brand-orange">
                <FileStack size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-brand-foreground uppercase tracking-tight">Manual Snapshot</h3>
                <p className="mt-1 text-sm text-brand-muted leading-relaxed">
                  Create an immediate full-system backup including all provider records, financial data, and user accounts.
                </p>
                <Button className="mt-4 gap-2 bg-brand-orange hover:bg-brand-orange/90 border-none">
                  <Download size={16} /> Download Snapshot
                </Button>
              </div>
            </div>
          </Card>

          <Card className="border-l-4 border-l-status-error bg-status-errorSoft/30">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-status-errorSoft text-status-error">
                <AlertTriangle size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-status-error uppercase tracking-tight text-sm">Zone of Caution</h3>
                <p className="mt-1 text-xs text-brand-secondary leading-relaxed">
                  The actions below are destructive and cannot be reversed. Access is restricted to Level 5 Authority only.
                </p>
                <div className="mt-4 flex gap-3">
                  <Button variant="outline" className="border-status-error text-status-error hover:bg-status-error hover:text-white text-xs font-black uppercase tracking-widest">
                    Purge Drafts
                  </Button>
                  <Button variant="outline" className="border-status-error text-status-error hover:bg-status-error hover:text-white text-xs font-black uppercase tracking-widest">
                    Reset Sync
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
