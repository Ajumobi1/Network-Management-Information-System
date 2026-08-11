import { useQuery } from '@tanstack/react-query';
import Badge from '../../../../components/ui/Badge';
import Card from '../../../../components/ui/Card';
import { ProviderTabProps } from '../ProfileTabShell';
import { fetchCredentialingApplications } from '../../../../services/credentialing/credentialingService';

export default function CredentialingTab({ provider }: ProviderTabProps) {
  const { data: applications = [] } = useQuery({
    queryKey: ['credentialing', 'applications', 'profile', provider.id],
    queryFn: () => fetchCredentialingApplications({ search: provider.providerCode, status: 'all', category: 'all', ownership: 'all', state: 'all' }),
  });

  const credentialingApp = applications.find(a => a.providerId === provider.id || a.providerCode === provider.providerCode) || applications[0];

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Accreditation Status</p>
            <h3 className="mt-1 text-xl font-semibold text-slate-900">{credentialingApp ? credentialingApp.providerName : provider.providerName}</h3>
          </div>
          <Badge variant={credentialingApp?.status === 'approved' ? 'success' : 'warning'}>
            {credentialingApp ? credentialingApp.status.replace(/-/g, ' ') : provider.credentialStatus}
          </Badge>
        </div>

        {credentialingApp && (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-slate-400 font-semibold">Reviewer Assigned</p>
              <p className="mt-1 font-semibold text-slate-900">{credentialingApp.reviewer}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-slate-400 font-semibold">Application Date</p>
              <p className="mt-1 font-semibold text-slate-900">{credentialingApp.applicationDate}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-slate-400 font-semibold">Expiry Date</p>
              <p className="mt-1 font-semibold text-slate-900">{credentialingApp.expiryDate}</p>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <h4 className="font-semibold text-slate-900 mb-4">Verified Documents & Licenses</h4>
        <div className="space-y-3">
          {credentialingApp?.documents.length ? (
            credentialingApp.documents.map(doc => (
              <div key={doc.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                <div>
                  <p className="font-semibold text-slate-900">{doc.name}</p>
                  <p className="text-xs text-slate-500">Number: {doc.documentNumber || 'N/A'} • Expires: {doc.expiryDate}</p>
                </div>
                <Badge variant={doc.status === 'verified' ? 'success' : 'warning'}>{doc.status}</Badge>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No credentialing documents recorded for this provider.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
