import { useNavigate } from 'react-router-dom';
import { FilePlus, ShieldCheck, AlertCircle } from 'lucide-react';
import ProviderStatusBadge from '../../components/ProviderStatusBadge';
import { ProviderTabProps } from '../ProfileTabShell';
import Button from '../../../../components/ui/Button';
import Card from '../../../../components/ui/Card';

export default function ContractsTab({ provider }: ProviderTabProps) {
  const navigate = useNavigate();
  const contractStatus = provider.contractStatus;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6" aria-labelledby="provider-contract-status">
        <div className="flex items-center justify-between mb-4">
          <p id="provider-contract-status" className="text-sm font-black uppercase tracking-widest text-brand-muted">Contract lifecycle status</p>
          {contractStatus && <ProviderStatusBadge status={contractStatus} />}
        </div>
        
        {!contractStatus ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand-muted">
              <AlertCircle size={24} />
            </div>
            <p className="font-bold text-brand-foreground text-lg">No Active Agreement</p>
            <p className="mt-1 text-sm text-brand-muted max-w-sm mx-auto">
              This provider does not have a registered service level agreement. Disbursement logic is currently disabled.
            </p>
            <Button 
              className="mt-6 gap-2" 
              onClick={() => navigate('/contracts')}
            >
              <FilePlus size={18} /> Provision New Contract
            </Button>
          </div>
        ) : (
          <Card className="bg-white border-brand-divider">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-status-successSoft p-3 text-status-success">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-brand-foreground uppercase tracking-tight">Verified Agreement Active</p>
                <p className="text-xs text-brand-muted">Contract ID: CON-{provider.id.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 border-t border-brand-divider pt-4">
              <Button variant="secondary" size="sm" onClick={() => navigate('/contracts')}>Manage Portfolio</Button>
              <Button variant="outline" size="sm" className="border-brand-divider">View Agreement PDF</Button>
            </div>
          </Card>
        )}
      </section>
    </div>
  );
}
