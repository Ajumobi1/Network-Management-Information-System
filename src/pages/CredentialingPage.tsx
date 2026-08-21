import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock, FileText, AlertCircle, Search, Eye, X, ChevronRight, Download, Plus } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import KpiCard from '../components/ui/KpiCard';
import { useCredentialingApplications, useUpdateCredentialingStatus } from '../hooks/credentialing/credentialingHooks';
import { CredentialingFilters, CredentialingStatus } from '../types/credentialing/credentialingTypes';
import { LoadingState, ErrorState } from '../components/ui/FeedbackStates';
import { SectionHeader } from '../components/ui/LayoutComponents';
import { ProviderCategory, PROVIDER_CATEGORY_LABELS } from '../constants/providerNetwork';
import { useInspections } from '../hooks/inspections/inspectionsHooks';
import { downloadCsvReport } from '../utils/reportExport';

export default function CredentialingPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<CredentialingFilters>({
    search: '',
    status: 'all',
    category: 'all',
    ownership: 'all',
    state: 'all',
  });

  const { data: applications = [], isLoading, isError, refetch } = useCredentialingApplications(filters);
  const { data: inspections = [], isLoading: inspectionsLoading } = useInspections();
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const updateStatus = useUpdateCredentialingStatus();
  const [actionComment, setActionComment] = useState('');

  const selectedApp = useMemo(() => applications.find(a => a.id === selectedAppId), [applications, selectedAppId]);

  const stats = useMemo(() => {
    const inspectionCount = inspections.filter(i => i.status === 'submitted' || i.status === 'completed').length;
    return {
      total: applications.length + inspectionCount,
      approved: applications.filter(a => a.status === 'approved').length,
      underReview: applications.filter(a => a.status === 'under-review' || a.status === 'submitted').length + inspectionCount,
      actionNeeded: applications.filter(a => a.status === 'additional-info-required').length,
    };
  }, [applications, inspections]);

  const handleExport = () => {
    const headers = ['Provider', 'Facility Type', 'Ownership', 'Location', 'Status', 'Reviewer', 'Expiry Date'];
    const rows = applications.map(app => [
      `${app.providerName} (${app.providerCode})`,
      app.category,
      app.ownership,
      `${app.state}, ${app.lga}`,
      app.status,
      app.reviewer,
      app.expiryDate
    ]);
    downloadCsvReport('nmis-credentialing-report.csv', headers, rows);
  };

  function handleStatusChange(id: string, status: CredentialingStatus) {
    if ((status === 'rejected' || status === 'additional-info-required') && !actionComment.trim()) {
      alert('Please provide a comment or reason before rejecting or requesting information.');
      return;
    }
    updateStatus.mutate(
      { id, status, comment: actionComment },
      {
        onSuccess: () => {
          alert(`Application status successfully updated to ${status}`);
          setActionComment('');
        },
        onError: (err: any) => {
          alert(`Error: ${err?.message || 'Failed to update status'}`);
        },
      }
    );
  }

  if (isError) {
    return (
      <main className="nmis-page">
        <ErrorState
          title="Credentialing data unavailable"
          action={{ label: 'Retry', onClick: () => refetch() }}
        />
      </main>
    );
  }

  return (
    <main className="nmis-page">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Provider Network"
          title="Credentialing & Accreditation"
          subtitle="Manage provider accreditation lifecycle, document verification, regulatory reviews, and renewal compliance."
          actions={
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleExport} className="gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                <Download size={16} /> Export Report
              </Button>
              <Button onClick={() => navigate('/inspections/new')} className="gap-2">
                <Plus size={16} /> New Review
              </Button>
            </div>
          }
        />

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard title="Total Applications" value={stats.total} subtitle="Active pipeline" tone="primary" icon={<FileText size={20} className="text-brand-blue" />} />
          <KpiCard title="Under Review" value={stats.underReview} subtitle="Awaiting audit" tone="warning" icon={<Clock size={20} className="text-status-warning" />} />
          <KpiCard title="Approved & Active" value={stats.approved} subtitle="Verified providers" tone="success" icon={<CheckCircle2 size={20} className="text-status-success" />} />
          <KpiCard title="Action Required" value={stats.actionNeeded} subtitle="Information requested" tone="danger" icon={<AlertCircle size={20} className="text-status-error" />} />
        </section>

        <Card>
          <SectionHeader title="Inspection score intelligence" subtitle="Credentialing and Accreditation subtotals from structured facility inspections." />
          <div className="mt-5 overflow-x-auto">
            <table className="nmis-table min-w-[760px]">
              <thead><tr><th>Provider / Facility</th><th>Facility Type</th><th className="text-center">Overall</th><th className="text-center">Credentialing</th><th className="text-center">Accreditation</th><th>Status</th></tr></thead>
              <tbody>
                {inspectionsLoading ? <tr><td colSpan={6} className="py-10 text-center text-brand-muted">Loading inspection scores...</td></tr> : inspections.filter(item => item.credentialingPossible || item.accreditationPossible).length === 0 ? <tr><td colSpan={6} className="py-10 text-center text-brand-muted">No structured inspection scores are available yet.</td></tr> : inspections.filter(item => item.credentialingPossible || item.accreditationPossible).slice(0, 12).map(item => <tr key={item.id}><td><p className="font-bold text-brand-foreground">{item.providerName}</p><p className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">{item.providerCode}</p></td><td>{item.type}</td><td className="text-center font-black text-brand-blue">{item.score ?? 0}%</td><td className="text-center font-black text-brand-blue">{item.credentialingPoints ?? 0}/{item.credentialingPossible ?? 0}</td><td className="text-center font-black text-brand-blue">{item.accreditationPoints ?? 0}/{item.accreditationPossible ?? 0}</td><td><Badge variant={item.status === 'completed' || item.status === 'submitted' ? 'success' : 'warning'}>{item.status}</Badge></td></tr>)}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Filters */}
        <div className="nmis-card p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr_1fr]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-subtle" />
              <Input
                placeholder="Search provider, code, reviewer..."
                className="pl-11"
                value={filters.search}
                onChange={e => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <Select
              value={filters.status}
              onChange={e => setFilters({ ...filters, status: e.target.value as any })}
              options={[
                { label: 'All Statuses', value: 'all' },
                { label: 'Draft', value: 'draft' },
                { label: 'Submitted', value: 'submitted' },
                { label: 'Under Review', value: 'under-review' },
                { label: 'Additional Info Required', value: 'additional-info-required' },
                { label: 'Approved', value: 'approved' },
                { label: 'Rejected', value: 'rejected' },
                { label: 'Expired', value: 'expired' },
              ]}
            />
            <Select
              value={filters.category}
              onChange={e => setFilters({ ...filters, category: e.target.value })}
              options={[
                { label: 'All Facility Types', value: 'all' },
                ...Object.values(ProviderCategory).map(category => ({ label: PROVIDER_CATEGORY_LABELS[category], value: category })),
              ]}
            />
            <Select
              value={filters.ownership}
              onChange={e => setFilters({ ...filters, ownership: e.target.value })}
              options={[
                { label: 'All Ownerships', value: 'all' },
                { label: 'Government', value: 'Government' },
                { label: 'Private', value: 'Private' },
              ]}
            />
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <LoadingState title="Fetching applications..." />
        ) : (
          <div className="nmis-table-wrap">
            <div className="nmis-table-scroll">
              <table className="nmis-table min-w-[900px]">
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>Facility Type</th>
                    <th>Ownership</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Reviewer</th>
                    <th>Expiry Date</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.length === 0 ? (
                    <tr><td colSpan={8} className="py-12 text-center text-brand-muted">No applications found matching the current criteria.</td></tr>
                  ) : (
                    applications.map(app => (
                      <tr key={app.id}>
                        <td className="font-semibold text-brand-foreground">
                          {app.providerName}
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-brand-muted mt-0.5">{app.providerCode}</span>
                        </td>
                        <td>{app.category}</td>
                        <td><Badge variant="default">{app.ownership}</Badge></td>
                        <td>{app.state}, {app.lga}</td>
                        <td>
                          <Badge
                            variant={
                              app.status === 'approved' ? 'success' :
                              ['under-review', 'submitted'].includes(app.status) ? 'warning' :
                              app.status === 'additional-info-required' ? 'info' : 'error'
                            }
                          >
                            {app.status.replace(/-/g, ' ')}
                          </Badge>
                        </td>
                        <td className="text-brand-secondary">{app.reviewer}</td>
                        <td className="text-brand-secondary">{app.expiryDate}</td>
                        <td className="text-right">
                          <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => setSelectedAppId(app.id)}>
                            <Eye size={14} /> Audit
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Review Drawer Overlay */}
        {selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/40 p-2 backdrop-blur-sm animate-in fade-in duration-200 sm:p-4">
            <div role="dialog" aria-modal="true" className="flex max-h-[calc(100dvh-1rem)] w-full max-w-3xl flex-col overflow-hidden rounded-panel border border-brand-border bg-brand-card shadow-panel sm:max-h-[90vh]">
              {/* Drawer Header */}
              <div className="flex items-start justify-between gap-3 border-b border-brand-divider bg-brand-surface/50 p-4 sm:p-6">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-blue">
                    <span>{selectedApp.providerCode}</span>
                    <ChevronRight size={10} />
                    <span>Audit Review</span>
                  </div>
                  <h2 className="mt-1 text-2xl font-black text-brand-foreground">{selectedApp.providerName}</h2>
                </div>
                <button
                  onClick={() => setSelectedAppId(null)}
                  className="rounded-control p-2 text-brand-muted hover:bg-brand-surface hover:text-brand-foreground transition"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 space-y-8 overflow-y-auto p-4 sm:p-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-control border border-brand-divider bg-brand-surface p-4">
                    <p className="nmis-label">Facility Type</p>
                    <p className="font-bold text-brand-foreground">{selectedApp.category}</p>
                  </div>
                  <div className="rounded-control border border-brand-divider bg-brand-surface p-4">
                    <p className="nmis-label">Ownership</p>
                    <p className="font-bold text-brand-foreground">{selectedApp.ownership}</p>
                  </div>
                  <div className="rounded-control border border-brand-divider bg-brand-surface p-4">
                    <p className="nmis-label">Current Status</p>
                    <Badge variant={selectedApp.status === 'approved' ? 'success' : 'warning'}>{selectedApp.status}</Badge>
                  </div>
                </div>

                <section>
                  <SectionHeader title="Verification Documents" subtitle="Review submitted regulatory and operational documents." />
                  <div className="mt-4 space-y-3">
                    {selectedApp.documents.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between rounded-control border border-brand-divider p-4 transition hover:border-brand-blue/30">
                        <div className="min-w-0">
                          <p className="font-bold text-brand-foreground truncate">{doc.name}</p>
                          <p className="nmis-helper">No: {doc.documentNumber || 'N/A'} • Expires: {doc.expiryDate}</p>
                        </div>
                        <Badge variant={doc.status === 'verified' ? 'success' : doc.status === 'expired' ? 'error' : 'warning'}>
                          {doc.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <SectionHeader title="Audit Decision" subtitle="Provide notes for the accreditation outcome." />
                  <textarea
                    className="nmis-control mt-4 min-h-32 p-4"
                    placeholder="Enter audit findings, required corrections, or approval justification..."
                    value={actionComment}
                    onChange={e => setActionComment(e.target.value)}
                  />
                </section>

                <section>
                  <SectionHeader title="History & Audit Trail" />
                  <div className="mt-4 space-y-2">
                    {selectedApp.auditTrail.map(audit => (
                      <div key={audit.id} className="rounded-control bg-brand-surface p-3 text-xs border border-brand-divider/50">
                        <div className="flex justify-between items-start">
                          <div className="min-w-0">
                            <span className="font-bold text-brand-foreground">{audit.action}</span>
                            <span className="mx-2 text-brand-subtle">by</span>
                            <span className="font-semibold text-brand-secondary">{audit.user}</span>
                            <span className="ml-2 text-brand-subtle">({audit.date})</span>
                            {audit.comment && <p className="text-brand-muted mt-1 italic">"{audit.comment}"</p>}
                          </div>
                          <Badge variant="default" className="shrink-0">{audit.newStatus}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Drawer Footer */}
              <div className="flex flex-col gap-3 border-t border-brand-divider bg-brand-surface/80 p-4 backdrop-blur-md sm:flex-row sm:flex-wrap sm:justify-end sm:p-6">
                <Button variant="secondary" className="w-full sm:w-auto" onClick={() => handleStatusChange(selectedApp.id, 'under-review')}>Set In-Review</Button>
                <Button variant="outline" className="w-full text-status-warning sm:w-auto border-status-warning/30 hover:bg-status-warningSoft" onClick={() => handleStatusChange(selectedApp.id, 'additional-info-required')}>Request Info</Button>
                <Button variant="outline" className="w-full text-status-error sm:w-auto border-status-error/30 hover:bg-status-errorSoft" onClick={() => handleStatusChange(selectedApp.id, 'rejected')}>Reject</Button>
                <Button className="w-full bg-status-success sm:w-auto hover:bg-green-700 text-white shadow-soft" onClick={() => handleStatusChange(selectedApp.id, 'approved')}>Approve Credentialing</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
