import { useMemo, useState } from 'react';
import { CheckCircle2, Clock, FileText, AlertCircle, Search, Eye } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { useCredentialingApplications, useUpdateCredentialingStatus } from '../hooks/credentialing/credentialingHooks';
import { CredentialingFilters, CredentialingStatus } from '../types/credentialing/credentialingTypes';

export default function CredentialingPage() {
  const [filters, setFilters] = useState<CredentialingFilters>({
    search: '',
    status: 'all',
    category: 'all',
    ownership: 'all',
    state: 'all',
  });

  const { data: applications = [], isLoading } = useCredentialingApplications(filters);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const updateStatus = useUpdateCredentialingStatus();
  const [actionComment, setActionComment] = useState('');

  const selectedApp = useMemo(() => applications.find(a => a.id === selectedAppId), [applications, selectedAppId]);

  const stats = useMemo(() => {
    return {
      total: applications.length,
      approved: applications.filter(a => a.status === 'approved').length,
      underReview: applications.filter(a => a.status === 'under-review' || a.status === 'submitted').length,
      actionNeeded: applications.filter(a => a.status === 'additional-info-required').length,
    };
  }, [applications]);

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

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="Provider Credentialing & Accreditation"
          description="Manage provider accreditation lifecycle, document verification, regulatory reviews, and renewal compliance."
          actions={[{ label: 'Export report', variant: 'secondary' }, { label: 'New credentialing review' }]}
        />

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-blue-50 p-3 text-brand-blue"><FileText className="h-6 w-6" /></div>
              <div>
                <p className="text-sm text-slate-500">Total Applications</p>
                <p className="mt-1 text-3xl font-semibold text-slate-900">{stats.total}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-50 p-3 text-amber-600"><Clock className="h-6 w-6" /></div>
              <div>
                <p className="text-sm text-slate-500">Under Review / Submitted</p>
                <p className="mt-1 text-3xl font-semibold text-slate-900">{stats.underReview}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600"><CheckCircle2 className="h-6 w-6" /></div>
              <div>
                <p className="text-sm text-slate-500">Approved & Active</p>
                <p className="mt-1 text-3xl font-semibold text-slate-900">{stats.approved}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-rose-50 p-3 text-rose-600"><AlertCircle className="h-6 w-6" /></div>
              <div>
                <p className="text-sm text-slate-500">Action Required</p>
                <p className="mt-1 text-3xl font-semibold text-slate-900">{stats.actionNeeded}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr_1fr]">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search provider name, code, reviewer..."
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-3 text-sm text-slate-900"
                value={filters.search}
                onChange={e => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <select
              className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900"
              value={filters.status}
              onChange={e => setFilters({ ...filters, status: e.target.value as any })}
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="under-review">Under Review</option>
              <option value="additional-info-required">Additional Info Required</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
            </select>
            <select
              className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900"
              value={filters.category}
              onChange={e => setFilters({ ...filters, category: e.target.value })}
            >
              <option value="all">All facility types</option>
              <option value="Hospital">Hospital</option>
              <option value="Primary Health Centre (PHC)">Primary Health Centre</option>
              <option value="Pharmacy">Pharmacy</option>
              <option value="Laboratory">Laboratory</option>
              <option value="Specialist Centre">Specialist Centre</option>
            </select>
            <select
              className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900"
              value={filters.ownership}
              onChange={e => setFilters({ ...filters, ownership: e.target.value })}
            >
              <option value="all">All ownerships</option>
              <option value="Private">Private</option>
              <option value="Public">Public</option>
              <option value="Corporate">Corporate</option>
              <option value="Faith-Based">Faith-Based</option>
            </select>
          </div>
        </Card>

        {/* Directory Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">Facility Type</th>
                  <th className="px-4 py-3">Ownership</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Credentialing Status</th>
                  <th className="px-4 py-3">Reviewer</th>
                  <th className="px-4 py-3">Expiry Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center">Loading credentialing applications...</td></tr>
                ) : applications.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center">No credentialing applications found.</td></tr>
                ) : (
                  applications.map(app => (
                    <tr key={app.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-4 font-semibold text-slate-900">
                        {app.providerName}
                        <span className="block text-xs font-normal text-slate-400">{app.providerCode}</span>
                      </td>
                      <td className="px-4 py-4">{app.category}</td>
                      <td className="px-4 py-4"><Badge variant="default">{app.ownership}</Badge></td>
                      <td className="px-4 py-4">{app.state}, {app.lga}</td>
                      <td className="px-4 py-4">
                        <Badge
                          variant={
                            app.status === 'approved' ? 'success' :
                            app.status === 'under-review' || app.status === 'submitted' ? 'warning' :
                            app.status === 'additional-info-required' ? 'info' : 'error'
                          }
                        >
                          {app.status.replace(/-/g, ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-slate-700">{app.reviewer}</td>
                      <td className="px-4 py-4 text-slate-700">{app.expiryDate}</td>
                      <td className="px-4 py-4 text-right">
                        <Button variant="ghost" className="gap-1 text-xs px-3 py-1.5" onClick={() => setSelectedAppId(app.id)}>
                          <Eye className="h-3.5 w-3.5" /> Review
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Review Modal Drawer */}
        {selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <span className="text-xs font-semibold text-brand-blue uppercase tracking-wider">{selectedApp.providerCode}</span>
                  <h2 className="text-2xl font-semibold text-slate-900">{selectedApp.providerName}</h2>
                </div>
                <Button variant="ghost" onClick={() => setSelectedAppId(null)}>Close</Button>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-400 font-semibold">Facility Type</p>
                  <p className="mt-1 font-semibold text-slate-900">{selectedApp.category}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-400 font-semibold">Ownership</p>
                  <p className="mt-1 font-semibold text-slate-900">{selectedApp.ownership}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-400 font-semibold">Current Status</p>
                  <p className="mt-1 font-semibold text-slate-900 uppercase">{selectedApp.status}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Submitted Documents & Verification</h3>
                <div className="space-y-3">
                  {selectedApp.documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                      <div>
                        <p className="font-semibold text-slate-900">{doc.name}</p>
                        <p className="text-xs text-slate-500">Document No: {doc.documentNumber || 'N/A'} • Expires: {doc.expiryDate}</p>
                      </div>
                      <Badge variant={doc.status === 'verified' ? 'success' : doc.status === 'expired' ? 'error' : 'warning'}>
                        {doc.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Review Notes & Comment</h3>
                <textarea
                  className="w-full rounded-2xl border border-slate-200 p-4 text-sm text-slate-900 focus:border-brand-blue focus:outline-none"
                  rows={3}
                  placeholder="Enter audit comment, rejection reason, or additional information required..."
                  value={actionComment}
                  onChange={e => setActionComment(e.target.value)}
                />
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Audit Trail & History</h3>
                <div className="space-y-2">
                  {selectedApp.auditTrail.map(audit => (
                    <div key={audit.id} className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-slate-900">{audit.action}</span> by {audit.user} ({audit.date})
                        {audit.comment && <p className="text-slate-500 mt-0.5">"{audit.comment}"</p>}
                      </div>
                      <Badge variant="default">{audit.newStatus}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 justify-end border-t pt-4">
                <Button variant="secondary" onClick={() => handleStatusChange(selectedApp.id, 'under-review')}>Set Under Review</Button>
                <Button variant="outline" className="text-amber-600 border-amber-300" onClick={() => handleStatusChange(selectedApp.id, 'additional-info-required')}>Request Info</Button>
                <Button variant="outline" className="text-rose-600 border-rose-300" onClick={() => handleStatusChange(selectedApp.id, 'rejected')}>Reject</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleStatusChange(selectedApp.id, 'approved')}>Approve Credentialing</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
