import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Card from '../../../../components/ui/Card';
import Badge from '../../../../components/ui/Badge';
import { useEnrollees } from '../../../../hooks/enrolment';
import { ProviderTabProps } from '../ProfileTabShell';

export default function EnrolmentTab({ provider }: ProviderTabProps) {
  const { data: records = [], isLoading } = useEnrollees({ providerId: provider.id });
  const summary = useMemo(() => ({
    total: records.length,
    formal: records.filter(record => record.sector === 'formal').length,
    informal: records.filter(record => record.sector === 'informal').length,
    principals: records.filter(record => record.category === 'principal').length,
    dependants: records.filter(record => record.category === 'dependant').length,
    male: records.filter(record => record.gender === 'male').length,
    female: records.filter(record => record.gender === 'female').length,
  }), [records]);
  const monthlyHistory = useMemo(() => {
    const grouped = records.reduce<Record<string, number>>((accumulator, record) => {
      accumulator[record.period] = (accumulator[record.period] || 0) + 1;
      return accumulator;
    }, {});
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([period, value]) => ({ period, value }));
  }, [records]);

  return <div className="space-y-5"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Population linkage</p><h3 className="mt-1 text-xl font-bold text-slate-900">Enrolment / Population</h3><p className="mt-1 text-sm text-slate-500">Normalized monthly beneficiary records linked to {provider.providerName}.</p></div><Badge variant="info">Provider master: {provider.providerCode}</Badge></div>{isLoading ? <Card>Loading facility enrolment records...</Card> : <><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Total enrollees" value={summary.total} /><Metric label="Formal" value={summary.formal} /><Metric label="Informal" value={summary.informal} /><Metric label="Principals" value={summary.principals} /><Metric label="Dependants" value={summary.dependants} /><Metric label="Male" value={summary.male} /><Metric label="Female" value={summary.female} /><Metric label="Periods" value={monthlyHistory.length} /></div><div className="grid gap-5 lg:grid-cols-2"><Card><h4 className="font-bold text-slate-900">Monthly enrolment history</h4>{monthlyHistory.length === 0 ? <p className="mt-8 text-center text-sm text-slate-500">No normalized enrolment records are linked to this facility.</p> : <div className="mt-5"><ResponsiveContainer width="100%" height={240}><BarChart data={monthlyHistory}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="period" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip formatter={(value) => [Number(value ?? 0).toLocaleString(), 'Enrollees']} /><Bar dataKey="value" fill="#2563eb" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div>}</Card><Card><h4 className="font-bold text-slate-900">Current facility composition</h4><div className="mt-5 space-y-4"><Composition label="Formal" value={summary.formal} total={summary.total} color="bg-brand-blue" /><Composition label="Informal" value={summary.informal} total={summary.total} color="bg-amber-500" /><Composition label="Principals" value={summary.principals} total={summary.total} color="bg-emerald-500" /><Composition label="Dependants" value={summary.dependants} total={summary.total} color="bg-violet-500" /></div></Card></div></>}</div>;
}

function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-2 text-xl font-black text-slate-900">{value.toLocaleString()}</p></div>; }
function Composition({ label, value, total, color }: { label: string; value: number; total: number; color: string }) { const percentage = total ? (value / total) * 100 : 0; return <div><div className="flex justify-between text-sm"><span className="font-semibold text-slate-700">{label}</span><span className="font-bold text-slate-900">{value.toLocaleString()} ({percentage.toFixed(1)}%)</span></div><div className="mt-2 h-2 rounded-full bg-slate-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(percentage, value ? 4 : 0)}%` }} /></div></div>; }
