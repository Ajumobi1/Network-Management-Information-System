import { MapPin, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Dashboard2Intelligence } from '../../types/dashboard/dashboardIntelligenceTypes';

type PopulationIntelligenceSectionProps = { intelligence: Dashboard2Intelligence };

export default function PopulationIntelligenceSection({ intelligence }: PopulationIntelligenceSectionProps) {
  const maxLga = intelligence.population.byLga[0]?.value || 1;
  const maxDistrict = intelligence.population.bySenatorialDistrict[0]?.value || 1;
  const maxFacility = intelligence.population.topFacilities[0]?.value || 1;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue">Population & enrolment</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Population intelligence</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">Formal and informal coverage, principal/dependant composition, and where enrolment is concentrated.</p>
        </div>
        <Link to="/population/enrolment/register" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-blue hover:text-brand-navy"><UsersRound className="h-4 w-4" />Open enrolment register</Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Formal" value={intelligence.population.formal} detail="/C/ policy sector" tone="blue" />
        <Metric label="Informal" value={intelligence.population.informal} detail="/D/ policy sector" tone="amber" />
        <Metric label="Principals" value={intelligence.population.principal} detail="Source CATEGORY field" tone="green" />
        <Metric label="Dependants" value={intelligence.population.dependant} detail="Source CATEGORY field" tone="slate" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-800">Sector distribution</p>
          <div className="mt-5 space-y-4">{intelligence.population.bySector.map(item => { const percentage = intelligence.population.total ? (item.value / intelligence.population.total) * 100 : 0; const isFormal = item.name === 'formal'; return <div key={item.name}><div className="mb-1 flex items-center justify-between text-sm"><span className="capitalize text-slate-600">{item.name}</span><span className="font-semibold text-slate-900">{item.value.toLocaleString()} · {percentage.toFixed(1)}%</span></div><div className="h-2.5 rounded-full bg-white"><div className={`h-2.5 rounded-full ${isFormal ? 'bg-brand-blue' : 'bg-amber-500'}`} style={{ width: `${percentage}%` }} /></div></div>; })}</div>
          <p className="mt-5 text-xs leading-5 text-slate-500">Sector is based on policy derivation rules; category remains authoritative from the source CATEGORY field.</p>
        </div>

        <div className="rounded-2xl border border-slate-200 p-4">
          <p className="text-sm font-semibold text-slate-800">Where people are enrolled</p>
          <div className="mt-4"><p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400"><MapPin className="h-3.5 w-3.5" />Senatorial Districts</p><div className="mt-3 space-y-3">{intelligence.population.bySenatorialDistrict.map(item => <RankRow key={item.name} name={item.name} value={item.value} max={maxDistrict} tone="blue" />)}</div></div>
          <div className="mt-5 border-t border-slate-100 pt-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Top LGAs</p><div className="mt-3 space-y-3">{intelligence.population.byLga.slice(0, 5).map(item => <RankRow key={item.name} name={item.name} value={item.value} max={maxLga} tone="blue" />)}</div></div>
          <div className="mt-5 border-t border-slate-100 pt-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Top facilities</p><div className="mt-3 space-y-3">{intelligence.population.topFacilities.slice(0, 5).map(item => <RankRow key={item.name} name={item.name} value={item.value} max={maxFacility} tone="green" />)}</div></div>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value, detail, tone }: { label: string; value: number; detail: string; tone: 'blue' | 'amber' | 'green' | 'slate' }) { const colors = { blue: 'text-brand-blue', amber: 'text-amber-700', green: 'text-emerald-700', slate: 'text-slate-700' }; return <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p><p className={`mt-2 text-2xl font-semibold ${colors[tone]}`}>{value.toLocaleString()}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>; }
function RankRow({ name, value, max, tone }: { name: string; value: number; max: number; tone: 'blue' | 'green' }) { return <div><div className="mb-1 flex items-center justify-between gap-3 text-xs"><span className="truncate text-slate-600">{name}</span><span className="shrink-0 font-semibold text-slate-800">{value.toLocaleString()}</span></div><div className="h-1.5 rounded-full bg-slate-100"><div className={`h-1.5 rounded-full ${tone === 'blue' ? 'bg-brand-blue' : 'bg-emerald-500'}`} style={{ width: `${Math.max((value / max) * 100, 3)}%` }} /></div></div>; }
