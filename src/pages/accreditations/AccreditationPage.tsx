import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, FilePenLine, Plus, Search, ShieldCheck } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import KpiCard from '../../components/ui/KpiCard';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { ErrorState, LoadingState } from '../../components/ui/FeedbackStates';
import { useAccreditations } from '../../hooks/accreditations/accreditationHooks';

function facilityTypeLabel(code: string, fallback: string) {
  if (code === 'private-hospital') return 'Hospital — Private';
  if (code === 'government-hospital') return 'Hospital — Government';
  return fallback;
}

export default function AccreditationPage() {
  const navigate = useNavigate();
  const { data: records = [], isLoading, isError, refetch } = useAccreditations();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'Draft' | 'Submitted'>('all');

  const filtered = useMemo(() => records.filter(record => {
    if (status !== 'all' && record.status !== status) return false;
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return record.facility_name.toLowerCase().includes(q) || record.facility_type_name.toLowerCase().includes(q) || record.template_code.toLowerCase().includes(q);
  }), [records, search, status]);

  const drafts = records.filter(record => record.status.toLowerCase() === 'draft').length;
  const submitted = records.filter(record => record.status.toLowerCase() === 'submitted').length;
  const successful = records.filter(record => (record.recommendation || '').toLowerCase().includes('recommended') && !(record.recommendation || '').toLowerCase().includes('not')).length;

  if (isLoading) return <main className="nmis-page"><LoadingState label="Loading accreditation records…" /></main>;
  if (isError) return <main className="nmis-page"><ErrorState title="Accreditation records unavailable" action={{ label: 'Retry', onClick: () => refetch() }} /></main>;

  return (
    <main className="nmis-page">
      <div className="space-y-6">
        <section className="relative isolate overflow-hidden rounded-panel border border-[#174b78] bg-[linear-gradient(120deg,#071c4b_0%,#0b3d72_52%,#0b65a1_100%)] px-5 py-6 text-white shadow-[0_22px_50px_-30px_rgba(7,28,75,0.8)] sm:px-7 sm:py-7">
          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#ffbe6a]"><ShieldCheck size={14} /> Quality & Compliance</div>
              <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">New Facility Accreditation</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">Assess facilities that are not yet registered in the Provider Directory. Accreditation records are maintained independently from registered-provider inspections.</p>
            </div>
            <Button className="bg-[#f7931e] text-white shadow-lg shadow-orange-950/20 hover:bg-[#ff9f2f]" onClick={() => navigate('/inspections/accreditation/new')}><Plus size={16} /> New Accreditation</Button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <KpiCard title="Accreditation records" value={records.length.toLocaleString()} subtitle="Independent assessment history" tone="primary" icon={<ClipboardCheck size={20} />} />
          <KpiCard title="Drafts" value={drafts.toLocaleString()} subtitle="Saved assessments to resume" tone="warning" icon={<FilePenLine size={20} />} />
          <KpiCard title="Submitted" value={submitted.toLocaleString()} subtitle={`${successful.toLocaleString()} recommended outcomes`} tone="success" icon={<ShieldCheck size={20} />} />
        </section>

        <Card className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={16} />
                <Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search facility name or facility type" className="pl-9" />
              </div>
              <select className="nmis-control sm:w-44" value={status} onChange={event => setStatus(event.target.value as typeof status)}>
                <option value="all">All statuses</option>
                <option value="Draft">Drafts</option>
                <option value="Submitted">Submitted</option>
              </select>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-brand-surface text-[11px] font-black uppercase tracking-wider text-brand-muted">
                <tr><th className="px-5 py-4">Facility</th><th className="px-5 py-4">Type</th><th className="px-5 py-4">Assessment date</th><th className="px-5 py-4">Scores</th><th className="px-5 py-4">Recommendation</th><th className="px-5 py-4">Status</th><th className="px-5 py-4 text-right">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-brand-divider">
                {filtered.map(record => (
                  <tr key={record.id} className="hover:bg-brand-surface/60">
                    <td className="px-5 py-4"><p className="font-black text-brand-foreground">{record.facility_name}</p><p className="mt-1 text-xs text-brand-muted">ID: {record.id.slice(0, 8).toUpperCase()}</p></td>
                    <td className="px-5 py-4 text-brand-secondary">{facilityTypeLabel(record.facility_type_code, record.facility_type_name)}</td>
                    <td className="px-5 py-4 text-brand-secondary">{record.assessment_date || '—'}</td>
                    <td className="px-5 py-4"><div className="space-y-1 text-xs"><p><strong>Credentialing:</strong> {record.credentialing_points}/{record.credentialing_possible}</p><p><strong>Accreditation:</strong> {record.accreditation_points}/{record.accreditation_possible}</p><p className="font-black text-brand-blue"><strong>Overall:</strong> {record.overall_score ?? 0}%</p></div></td>
                    <td className="max-w-[250px] px-5 py-4 text-xs font-bold text-brand-secondary">{record.recommendation || 'Pending'}</td>
                    <td className="px-5 py-4"><Badge variant={record.status.toLowerCase() === 'submitted' ? 'success' : 'warning'}>{record.status}</Badge></td>
                    <td className="px-5 py-4 text-right"><Button variant="secondary" onClick={() => navigate(`/inspections/accreditation/new?draftId=${encodeURIComponent(record.id)}&facilityType=${encodeURIComponent(record.facility_type_code)}`)}>{record.status.toLowerCase() === 'draft' ? 'Resume' : 'View'}</Button></td>
                  </tr>
                ))}
                {!filtered.length && <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-brand-muted">No accreditation records match the current filters.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </main>
  );
}
