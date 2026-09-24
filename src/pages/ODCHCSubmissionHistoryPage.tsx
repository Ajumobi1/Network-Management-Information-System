import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, Eye, Loader2, RefreshCw, Search, X } from 'lucide-react';
import { supabase } from '../lib/supabase/supabaseClient';

type ChecklistType = 'primary' | 'dental' | 'pharmacy' | 'qa';

type Submission = {
  id: string;
  submission_code: string;
  checklist_type: ChecklistType;
  checklist_title: string;
  facility_name: string;
  inspection_date: string;
  overall_score: number | null;
  maximum_score: number | null;
  percentage: number | null;
  recommendation: 'yes' | 'no' | null;
  submitted_email: string | null;
  submitted_at: string;
};

type SubmissionDetail = Submission & {
  profile_data: Record<string, unknown>;
  responses: Record<string, unknown>;
  raw_payload: Record<string, unknown>;
  submitted_by: string;
};

type HistoryResponse = { items: Submission[]; total: number; limit: number; offset: number };

const PAGE_SIZE = 50;
const typeLabels: Record<ChecklistType, string> = {
  primary: 'Primary Services',
  dental: 'Dental Services',
  pharmacy: 'Pharmacy Services',
  qa: 'Quality Assurance',
};

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '—';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function prettyJson(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2);
}

export default function ODCHCSubmissionHistoryPage() {
  const [items, setItems] = useState<Submission[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<'all' | ChecklistType>('all');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<SubmissionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: rpcError } = await supabase.rpc('nmis_list_odchc_checklist_submissions', {
      p_checklist_type: type === 'all' ? null : type,
      p_search: search.trim() || null,
      p_limit: PAGE_SIZE,
      p_offset: page * PAGE_SIZE,
    });
    if (rpcError) {
      setError(rpcError.message);
      setItems([]);
      setTotal(0);
    } else {
      const result = data as HistoryResponse;
      setItems(result?.items ?? []);
      setTotal(Number(result?.total ?? 0));
    }
    setLoading(false);
  }, [page, search, type]);

  useEffect(() => { void loadSubmissions(); }, [loadSubmissions]);

  const viewSubmission = async (id: string) => {
    setDetailLoading(true);
    setError(null);
    const { data, error: rpcError } = await supabase.rpc('nmis_get_odchc_checklist_submission', {
      p_submission_id: id,
    });
    if (rpcError) setError(rpcError.message);
    else setDetail(data as SubmissionDetail);
    setDetailLoading(false);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="min-h-full bg-brand-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="nmis-kicker">Quality &amp; Compliance</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-brand-foreground sm:text-3xl">Submission History</h1>
            <p className="mt-2 max-w-2xl text-sm text-brand-secondary">View completed ODCHC accreditation and ORANGHIS QA checklist submissions stored in NMIS.</p>
          </div>
          <button type="button" onClick={() => void loadSubmissions()} className="inline-flex items-center justify-center gap-2 rounded-control border border-brand-border bg-white px-4 py-2.5 text-sm font-bold text-brand-foreground shadow-sm transition hover:border-brand-blue hover:text-brand-blue disabled:opacity-60" disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </header>

        <section className="nmis-card flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
            <input value={search} onChange={event => { setSearch(event.target.value); setPage(0); }} placeholder="Search submission code, facility, email..." className="w-full rounded-control border border-brand-border bg-white py-2.5 pl-9 pr-3 text-sm text-brand-foreground placeholder:text-brand-muted focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15" />
          </label>
          <select value={type} onChange={event => { setType(event.target.value as 'all' | ChecklistType); setPage(0); }} className="rounded-control border border-brand-border bg-white px-3 py-2.5 text-sm font-semibold text-brand-foreground focus:border-brand-blue focus:outline-none">
            <option value="all">All checklist types</option>
            <option value="primary">Primary Services</option>
            <option value="dental">Dental Services</option>
            <option value="pharmacy">Pharmacy Services</option>
            <option value="qa">Quality Assurance</option>
          </select>
        </section>

        {error ? (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert"><AlertCircle className="mt-0.5 shrink-0" size={18} /><div><p className="font-bold">Unable to load submission history</p><p className="mt-1">{error}</p><p className="mt-2 text-xs">Confirm that the submission-history migration has been applied in Supabase.</p></div></div>
        ) : null}

        <section className="nmis-card overflow-hidden">
          <div className="flex flex-col gap-1 border-b border-brand-divider bg-brand-surface/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="nmis-kicker">Submitted checklists</p><p className="mt-1 text-sm text-brand-secondary">{total.toLocaleString()} total submission{total === 1 ? '' : 's'}</p></div>
            <p className="text-xs font-semibold text-brand-muted">Page {Math.min(page + 1, totalPages)} of {totalPages}</p>
          </div>
          {loading ? <div className="flex min-h-52 items-center justify-center gap-2 text-sm text-brand-secondary"><Loader2 className="animate-spin" size={18} /> Loading submissions...</div> : items.length === 0 ? <div className="flex min-h-52 items-center justify-center px-5 text-center text-sm text-brand-secondary">No checklist submissions match the current filters.</div> : (
            <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-brand-surface text-xs uppercase tracking-wider text-brand-muted"><tr><th className="px-5 py-3 font-bold">Submission</th><th className="px-5 py-3 font-bold">Facility</th><th className="px-5 py-3 font-bold">Checklist</th><th className="px-5 py-3 font-bold">Inspection date</th><th className="px-5 py-3 font-bold">Score</th><th className="px-5 py-3 font-bold">Submitted</th><th className="px-5 py-3 text-right font-bold">Action</th></tr></thead><tbody className="divide-y divide-brand-divider/70">{items.map(item => <tr key={item.id} className="transition hover:bg-brand-surface/50"><td className="whitespace-nowrap px-5 py-4"><p className="font-bold text-brand-blue">{item.submission_code}</p><p className="mt-1 text-xs text-brand-muted">{item.submitted_email || 'Authenticated NMIS user'}</p></td><td className="px-5 py-4 font-semibold text-brand-foreground">{item.facility_name}</td><td className="whitespace-nowrap px-5 py-4 text-brand-secondary">{typeLabels[item.checklist_type] || item.checklist_title}</td><td className="whitespace-nowrap px-5 py-4 text-brand-secondary">{formatDate(item.inspection_date)}</td><td className="whitespace-nowrap px-5 py-4">{item.percentage == null ? <span className="text-brand-muted">—</span> : <span className="font-black text-brand-foreground">{item.percentage}%</span>} {item.recommendation ? <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${item.recommendation === 'yes' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{item.recommendation === 'yes' ? 'Recommended' : 'Not recommended'}</span> : null}</td><td className="whitespace-nowrap px-5 py-4 text-brand-secondary">{formatDateTime(item.submitted_at)}</td><td className="px-5 py-4 text-right"><button type="button" onClick={() => void viewSubmission(item.id)} className="inline-flex items-center gap-1.5 rounded-control border border-brand-border bg-white px-3 py-2 text-xs font-bold text-brand-blue transition hover:border-brand-blue hover:bg-brand-surface"><Eye size={14} /> View</button></td></tr>)}</tbody></table></div>
          )}
          <div className="flex items-center justify-between border-t border-brand-divider px-5 py-3"><p className="text-xs text-brand-muted">Showing {total === 0 ? 0 : page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}</p><div className="flex gap-2"><button type="button" disabled={page === 0 || loading} onClick={() => setPage(value => Math.max(0, value - 1))} className="inline-flex items-center gap-1 rounded-control border border-brand-border bg-white px-3 py-2 text-xs font-bold text-brand-foreground disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={14} /> Previous</button><button type="button" disabled={(page + 1) * PAGE_SIZE >= total || loading} onClick={() => setPage(value => value + 1)} className="inline-flex items-center gap-1 rounded-control border border-brand-border bg-white px-3 py-2 text-xs font-bold text-brand-foreground disabled:cursor-not-allowed disabled:opacity-40">Next <ChevronRight size={14} /></button></div></div>
        </section>
      </div>

      {detail || detailLoading ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true"><div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"><div className="flex items-start justify-between border-b border-brand-divider px-5 py-4"><div><p className="nmis-kicker">Submission details</p><h2 className="mt-1 text-lg font-black text-brand-foreground">{detail?.submission_code || 'Loading...'}</h2></div><button type="button" onClick={() => setDetail(null)} className="rounded-full p-2 text-brand-muted hover:bg-brand-surface hover:text-brand-foreground" aria-label="Close details"><X size={18} /></button></div>{detailLoading ? <div className="flex min-h-52 items-center justify-center gap-2 text-sm text-brand-secondary"><Loader2 className="animate-spin" size={18} /> Loading submission...</div> : detail ? <div className="overflow-y-auto p-5"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div><p className="nmis-kicker">Facility</p><p className="mt-1 text-sm font-bold">{detail.facility_name}</p></div><div><p className="nmis-kicker">Checklist</p><p className="mt-1 text-sm font-bold">{typeLabels[detail.checklist_type]}</p></div><div><p className="nmis-kicker">Inspection date</p><p className="mt-1 text-sm font-bold">{formatDate(detail.inspection_date)}</p></div><div><p className="nmis-kicker">Submitted</p><p className="mt-1 text-sm font-bold">{formatDateTime(detail.submitted_at)}</p></div></div><details className="mt-6" open><summary className="cursor-pointer text-sm font-black text-brand-blue">Facility profile</summary><pre className="mt-3 max-h-72 overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-relaxed text-slate-100">{prettyJson(detail.profile_data)}</pre></details><details className="mt-4"><summary className="cursor-pointer text-sm font-black text-brand-blue">Checklist responses</summary><pre className="mt-3 max-h-96 overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-relaxed text-slate-100">{prettyJson(detail.responses)}</pre></details><details className="mt-4"><summary className="cursor-pointer text-sm font-black text-brand-blue">Raw submission payload</summary><pre className="mt-3 max-h-96 overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-relaxed text-slate-100">{prettyJson(detail.raw_payload)}</pre></details></div> : null}</div></div> : null}
    </main>
  );
}
