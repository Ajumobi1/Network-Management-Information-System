import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Users, WalletCards } from 'lucide-react';
import { usePopulationSnapshot } from '../../hooks/dashboard/dashboardHooks';

function formatNaira(value: number): string {
  if (value >= 1_000_000_000) return `₦${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(2)}M`;
  return `₦${Math.round(value).toLocaleString('en-NG')}`;
}

export default function PopulationSnapshotPanel() {
  const { data, isLoading, isError } = usePopulationSnapshot();

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-blue">Population intelligence</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Enrolment and expenditure snapshot</h2>
          <p className="mt-1 text-sm text-slate-500">Live normalized population linked to the Provider Directory and financial records.</p>
        </div>
        <Link to="/population/enrolment" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-blue hover:text-brand-navy">
          Open population hub <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {isLoading ? <div className="mt-6 h-32 animate-pulse rounded-2xl bg-slate-100" /> : null}
      {isError ? <p className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Population analytics could not be loaded.</p> : null}
      {data ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr_1.1fr]">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <Users className="h-5 w-5 text-brand-blue" />
              <p className="mt-3 text-2xl font-semibold text-slate-900">{data.totalEnrollees.toLocaleString()}</p>
              <p className="mt-1 text-xs text-slate-500">Total enrollees</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-4">
              <Users className="h-5 w-5 text-emerald-700" />
              <p className="mt-3 text-2xl font-semibold text-slate-900">{data.formalCount.toLocaleString()}</p>
              <p className="mt-1 text-xs text-slate-500">Formal · {data.formalPercentage}%</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-4">
              <Users className="h-5 w-5 text-amber-700" />
              <p className="mt-3 text-2xl font-semibold text-slate-900">{data.informalCount.toLocaleString()}</p>
              <p className="mt-1 text-xs text-slate-500">Informal · {data.informalPercentage}%</p>
            </div>
            <div className="rounded-2xl bg-sky-50 p-4">
              <MapPin className="h-5 w-5 text-sky-700" />
              <p className="mt-3 text-2xl font-semibold text-slate-900">{data.providerCount}</p>
              <p className="mt-1 text-xs text-slate-500">Facilities covered</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Sector mix</p>
                <p className="mt-1 text-xs text-slate-500">Formal vs informal records</p>
              </div>
              <Users className="h-5 w-5 text-slate-400" />
            </div>
            <div className="mt-5 space-y-4">
              {data.bySector.map(item => {
                const percentage = data.totalEnrollees ? (item.value / data.totalEnrollees) * 100 : 0;
                const label = item.name === 'formal' ? 'Formal' : item.name === 'informal' ? 'Informal' : item.name;
                return (
                  <div key={item.name}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="capitalize text-slate-600">{label}</span>
                      <span className="font-semibold text-slate-900">{item.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100"><div className={`h-2 rounded-full ${item.name === 'formal' ? 'bg-brand-blue' : 'bg-amber-500'}`} style={{ width: `${percentage}%` }} /></div>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 flex items-center gap-2 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5" />{data.lgaCount} LGAs · {data.senatorialDistrictCount} senatorial districts</div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Financial relationship</p>
                <p className="mt-1 text-xs text-slate-500">Linked expenditure and PEPM</p>
              </div>
              <WalletCards className="h-5 w-5 text-slate-400" />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Linked expenditure</p><p className="mt-1 text-lg font-semibold text-slate-900">{formatNaira(data.financialExpenditure)}</p></div>
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">PEPM</p><p className="mt-1 text-lg font-semibold text-slate-900">{formatNaira(data.pepm)}</p></div>
            </div>
            <div className="mt-5 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Top enrolment LGAs</p>
              {data.byLga.slice(0, 4).map(item => <div key={item.name} className="flex items-center justify-between text-sm"><span className="truncate pr-3 text-slate-600">{item.name}</span><span className="font-semibold text-slate-900">{item.value}</span></div>)}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
