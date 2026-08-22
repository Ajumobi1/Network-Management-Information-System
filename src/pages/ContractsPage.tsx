import { useState, useMemo } from 'react';
import { 
  FileText, ShieldCheck, Clock, Download, Plus, Search, 
  Filter, CheckCircle2, AlertCircle, FilePlus, Calendar,
  ArrowRight, History, MoreVertical, X, Check
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { useContracts, useContractSummary, useCreateContract } from '../hooks/contracts/contractsHooks';
import { ProviderCategory, ProviderOwnership } from '../constants/providerNetwork';
import { LoadingState, ErrorState } from '../components/ui/FeedbackStates';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { SectionHeader } from '../components/ui/LayoutComponents';

export default function ContractsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Renewal' | 'Expired'>('all');

  const { data: contracts = [], isLoading, isError, refetch } = useContracts();
  const { data: summary } = useContractSummary();
  const createContractMutation = useCreateContract();

  const [newContract, setNewContract] = useState({
    providerId: '',
    providerName: '',
    providerCode: '',
    contractType: 'Capitation (Primary Care)',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10),
    status: 'Active' as const
  });

  const filteredContracts = useMemo(() => {
    return contracts.filter(c => {
      const matchesSearch = c.providerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           c.providerCode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [contracts, searchTerm, statusFilter]);

  if (isLoading) return <LoadingState title="Synchronizing contract registry..." />;
  if (isError) return <ErrorState title="Contract data unavailable" action={{ label: 'Retry Connection', onClick: () => refetch() }} />;

  const handleCreateClick = () => {
    console.log('Create contract clicked');
    setShowCreateModal(true);
  };

  return (
    <main className="nmis-page">
      <PageHeader
        eyebrow="Provider Network"
        title="Contract Portfolio Management"
        subtitle="Execute, review, and manage healthcare service level agreements (SLAs) and provider capitation contracts."
        actions={
          <div className="flex gap-2">
            <button 
              onClick={handleCreateClick}
              className="inline-flex items-center justify-center rounded-control transition-all duration-200 active:scale-[0.98] gap-2 bg-brand-blue text-white hover:bg-brand-hover shadow-soft px-4 py-2 text-sm font-bold"
            >
              <Plus size={16} /> Create New Contract
            </button>
            <Button variant="secondary" onClick={() => alert('Generating contract portfolio CSV...')}>Export Portfolio</Button>
          </div>
        }
      />

      {/* Professional KPI Dashboard */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="relative overflow-hidden border-l-4 border-l-status-success">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-status-successSoft p-4 text-status-success">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-brand-muted">Active Contracts</p>
              <p className="text-3xl font-black text-brand-foreground">{summary?.activeCount || 0}</p>
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 opacity-5 text-status-success">
            <ShieldCheck size={80} />
          </div>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-brand-orange">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-brand-orange/10 p-4 text-brand-orange">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-brand-muted">Renewal Pipeline</p>
              <p className="text-3xl font-black text-brand-orange">{summary?.renewalCount || 0}</p>
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 opacity-5 text-brand-orange">
            <Clock size={80} />
          </div>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-status-error">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-status-errorSoft p-4 text-status-error">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-brand-muted">Expired / Suspended</p>
              <p className="text-3xl font-black text-status-error">{summary?.expiredCount || 0}</p>
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 opacity-5 text-status-error">
            <AlertCircle size={80} />
          </div>
        </Card>
      </div>

      {/* Filter Hub */}
      <Card className="flex flex-wrap items-center justify-between gap-4 py-4">
        <div className="flex flex-1 flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-subtle" size={18} />
            <input
              type="text"
              placeholder="Search by provider name or code..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="nmis-control pl-10"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'Active', 'Renewal', 'Expired'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status as any)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${statusFilter === status ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20' : 'bg-brand-soft text-brand-muted hover:bg-brand-divider'}`}
              >
                {status === 'all' ? 'All Contracts' : status}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Contract Register */}
      <Card className="p-0 overflow-hidden">
        <div className="nmis-table-wrap">
          <table className="nmis-table">
            <thead>
              <tr>
                <th>Provider Identity</th>
                <th>Agreement Type</th>
                <th>Effective Period</th>
                <th>Lifecycle Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.length === 0 ? (
                <tr><td colSpan={5} className="py-20 text-center text-brand-muted">No contracts found matching current filters.</td></tr>
              ) : (
                filteredContracts.map(c => (
                  <tr key={c.id}>
                    <td>
                      <p className="font-bold text-brand-foreground">{c.providerName}</p>
                      <p className="text-xs font-medium text-brand-muted">{c.providerCode}</p>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-brand-blue" />
                        <span className="text-xs font-black uppercase tracking-widest text-brand-secondary">{c.contractType}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-brand-foreground">Ends: {new Date(c.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        <span className="text-[10px] font-medium text-brand-muted uppercase">Signed: {new Date(c.startDate).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td>
                      <Badge variant={c.status === 'Active' ? 'success' : c.status === 'Renewal' ? 'warning' : 'error'} className="font-bold">
                        {c.status}
                      </Badge>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" size="sm" className="h-8">View PDF</Button>
                        <Button variant="outline" size="sm" className="h-8 border-brand-divider">History</Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Contract Modal (Mock) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-brand-divider pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-brand-blue/10 p-2 text-brand-blue">
                  <FilePlus size={20} />
                </div>
                <h2 className="text-xl font-black text-brand-foreground">Provision New Agreement</h2>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-brand-muted hover:text-brand-foreground">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-brand-muted">Select Provider</label>
                  <select className="nmis-control">
                    <option>Search accredited providers...</option>
                    <option>ADULOJU MEMORIAL HOSPITAL (PRO-001)</option>
                    <option>MAO HOSPITAL LIMITED (PRO-042)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-brand-muted">Contract Type</label>
                  <select className="nmis-control">
                    <option>Capitation (Primary Care)</option>
                    <option>Fee-for-Service (Secondary)</option>
                    <option>Performance Based (P4P)</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-brand-muted">Effective Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-subtle" size={16} />
                    <input 
                      type="date" 
                      className="nmis-control pl-10" 
                      value={newContract.startDate}
                      onChange={(e) => setNewContract(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-brand-muted">Expiry Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-subtle" size={16} />
                    <input 
                      type="date" 
                      className="nmis-control pl-10" 
                      value={newContract.endDate}
                      onChange={(e) => setNewContract(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-brand-muted">Contract Terms & SLAs</label>
                <textarea className="nmis-control min-h-[120px] resize-none" placeholder="Enter custom agreement clauses or SLA variations..." />
              </div>

              <div className="flex items-center gap-3 p-4 rounded-2xl bg-brand-soft/50 text-brand-secondary border border-brand-blue/10">
                <CheckCircle2 size={20} className="text-brand-blue shrink-0" />
                <p className="text-xs leading-relaxed">
                  Executing this agreement will automatically update the provider's lifecycle status and enable capitation disbursement logic for the next billing cycle.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-brand-divider">
                <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                <Button 
                  className="gap-2" 
                  disabled={createContractMutation.isPending}
                  onClick={async () => { 
                    try {
                      await createContractMutation.mutateAsync({
                        providerId: newContract.providerId || 'PRO-001',
                        providerName: newContract.providerName || 'ADULOJU MEMORIAL HOSPITAL',
                        providerCode: newContract.providerCode || 'NMIS-FAC-001',
                        category: ProviderCategory.Hospital,
                        ownership: ProviderOwnership.Private,
                        contractType: newContract.contractType,
                        startDate: newContract.startDate,
                        endDate: newContract.endDate,
                        status: newContract.status
                      });
                      alert('Contract provisioned successfully.'); 
                      setShowCreateModal(false); 
                    } catch (err) {
                      alert('Failed to provision contract.');
                    }
                  }}
                >
                  {createContractMutation.isPending ? 'Executing...' : <><Check size={18} /> Execute Agreement</>}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}
