import { useState } from 'react';
import { FileText, ShieldAlert, Upload } from 'lucide-react';
import ProviderStatusBadge from '../../components/ProviderStatusBadge';
import { ProviderTabProps } from '../ProfileTabShell';
import { useProviderDocuments, useReviewProviderDocument } from '../../../../hooks/providers/useProviderDocuments';
import Button from '../../../../components/ui/Button';
import { isSecureContractError } from '../../../../lib/security/secureContracts';
import { providerDocumentsRepository, ProviderDocumentRecord } from '../../../../repositories/providers/providerDocumentsRepository';

export default function DocumentsTab({ provider }: ProviderTabProps) {
  const { data: documents, isLoading, isError, error } = useProviderDocuments(provider.id);
  const reviewMutation = useReviewProviderDocument();
  const [actionError, setActionError] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (document: ProviderDocumentRecord) => {
    if (!document.file_url) {
      setActionError('This document does not have a downloadable file attached.');
      return;
    }
    setActionError('');
    setDownloadingId(document.id);
    try {
      const url = await providerDocumentsRepository.getDownloadUrl(document.file_url);
      const anchor = window.document.createElement('a');
      anchor.href = url;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.download = document.name || 'odchc-nmis-document.pdf';
      window.document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to download this document');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleReview = async (documentId: string, status: string) => {
    setActionError('');
    try {
      await reviewMutation.mutateAsync({ documentId, status });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update document status');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-blue" />
      </div>
    );
  }

  if (isError) {
    const secureUnavailable = isSecureContractError(error);
    return (
      <div className="rounded-card border border-amber-200 bg-amber-50 p-6 text-center text-amber-800">
        <ShieldAlert className="mx-auto h-8 w-8 mb-2" />
        <h4 className="font-semibold">{secureUnavailable ? 'Secure document contract unavailable' : 'Unable to load documents'}</h4>
        <p className="mt-1 text-sm">{error instanceof Error ? error.message : 'An unexpected error occurred.'}</p>
      </div>
    );
  }

  const docs = documents || [];
  const activeDocsCount = docs.filter((d: ProviderDocumentRecord) => d.status === 'Approved').length;
  const credentialingCompletion = docs.length > 0 ? Math.round((activeDocsCount / docs.length) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Credentialing Summary Card */}
      <div className="grid gap-4 sm:grid-cols-3 rounded-card bg-slate-50 p-5 border border-slate-200">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Credentialing Completion</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{credentialingCompletion}%</p>
          <p className="text-xs text-slate-500">{activeDocsCount} of {docs.length} verified</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Facility Status</p>
          <p className="mt-1"><ProviderStatusBadge status={provider.credentialStatus || 'Approved'} /></p>
        </div>
        <div className="flex items-center justify-end">
          <Button variant="secondary" className="gap-2" onClick={() => alert('Trusted document upload is restricted to verified administrator workflows.')}>
            <Upload size={16} /> Upload Document
          </Button>
        </div>
      </div>

      {actionError && (
        <div className="rounded-card bg-status-errorSoft p-3 text-sm text-status-error border border-status-error/20">
          {actionError}
        </div>
      )}

      {/* Document List */}
      <div className="space-y-3">
        {docs.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No documents registered for this provider facility.</div>
        ) : (
          docs.map((document: ProviderDocumentRecord) => (
            <div key={document.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-white p-4 border border-slate-200 shadow-sm">
              <div className="min-w-0 flex items-start gap-3">
                <div className="rounded-xl bg-slate-100 p-2 text-brand-blue">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{document.name || document.type}</p>
                  <p className="text-xs text-slate-500">{document.type} • Version {document.version || '1.0'} • Expires {document.expiry_date || 'N/A'}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <ProviderStatusBadge status={document.status as any} />
                {document.file_url && (
                  <Button
                    variant="secondary"
                    className="gap-1.5 text-xs py-1 px-2.5 h-auto text-brand-blue hover:bg-brand-soft"
                    onClick={() => handleDownload(document)}
                    disabled={downloadingId === document.id}
                  >
                    <FileText size={14} /> {downloadingId === document.id ? 'Preparing...' : 'Download'}
                  </Button>
                )}
                {document.type !== 'Inspection Report' && (
                  <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
                    <Button
                      variant="secondary"
                      className="text-xs py-1 px-2.5 h-auto text-emerald-700 hover:bg-emerald-50"
                      onClick={() => handleReview(document.id, 'Approved')}
                      disabled={reviewMutation.isPending}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="secondary"
                      className="text-xs py-1 px-2.5 h-auto text-rose-700 hover:bg-rose-50"
                      onClick={() => handleReview(document.id, 'Rejected')}
                      disabled={reviewMutation.isPending}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
