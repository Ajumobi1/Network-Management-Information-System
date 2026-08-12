import { AlertTriangle, ArrowRight, CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Dashboard2Intelligence, DashboardAttentionItem } from '../../types/dashboard/dashboardIntelligenceTypes';

type ManagementAttentionPanelProps = { intelligence: Dashboard2Intelligence };

const levelMap = {
  critical: { icon: TriangleAlert, badge: 'Critical', className: 'border-rose-200 bg-rose-50 text-rose-800', iconClass: 'text-rose-600' },
  warning: { icon: AlertTriangle, badge: 'Attention', className: 'border-amber-200 bg-amber-50 text-amber-800', iconClass: 'text-amber-600' },
  info: { icon: Info, badge: 'Monitor', className: 'border-blue-200 bg-blue-50 text-blue-800', iconClass: 'text-blue-600' },
};

export default function ManagementAttentionPanel({ intelligence }: ManagementAttentionPanelProps) {
  return <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue">Executive oversight</p><h2 className="mt-2 text-xl font-semibold text-slate-900">Management attention</h2><p className="mt-1 text-sm text-slate-500">Rule-based signals derived from current network, population, and financial data.</p></div><AlertTriangle className="h-5 w-5 text-amber-600" /></div>{intelligence.managementAttention.length === 0 ? <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /><div><p className="font-semibold">No current management attention signals</p><p className="mt-1 text-emerald-700">The current filtered view has no supported high-PEPM, material change, unmatched-provider, or import-warning signal.</p></div></div> : <div className="mt-5 grid gap-3 md:grid-cols-2">{intelligence.managementAttention.map(item => <AttentionItem key={item.id} item={item} />)}</div>}</section>;
}

function AttentionItem({ item }: { item: DashboardAttentionItem }) { const config = levelMap[item.level]; const Icon = config.icon; const content = <div className={`flex items-start gap-3 rounded-2xl border p-4 ${config.className}`}><Icon className={`mt-0.5 h-5 w-5 shrink-0 ${config.iconClass}`} /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-[11px] font-bold uppercase tracking-[0.18em]">{config.badge}</span><span className="text-xs opacity-70">{item.title}</span></div><p className="mt-2 truncate font-semibold" title={item.subject}>{item.subject}</p><p className="mt-1 text-sm opacity-90">{item.detail}</p>{item.href ? <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold">Investigate <ArrowRight className="h-3.5 w-3.5" /></span> : null}</div></div>; return item.href ? <Link to={item.href} className="block transition hover:-translate-y-0.5">{content}</Link> : content; }
