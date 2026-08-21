import { ShieldCheck, TrendingUp, Bell, CreditCard, Globe2, Sparkles } from 'lucide-react';

export default function ExecutiveSummaryCard() {
  return (
    <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">Executive summary</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Today’s command overview</h2>
        </div>
        <div className="rounded-3xl bg-slate-50 px-4 py-2 text-sm text-slate-600">Mission critical</div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <div className="rounded-[24px] bg-slate-50 p-5">
          <div className="flex items-center gap-3 text-slate-900">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <p className="font-semibold">Network status</p>
          </div>
          <p className="mt-3 text-sm text-slate-600">Stable with 84% health and a strong capacity outlook for the next 48 hours.</p>
        </div>

        <div className="rounded-[24px] bg-slate-50 p-5">
          <div className="flex items-center gap-3 text-slate-900">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            <p className="font-semibold">Financial snapshot</p>
          </div>
          <p className="mt-3 text-sm text-slate-600">Capitation totals are trending +8.4% month-over-month, with 80% of payments cleared.</p>
        </div>

        <div className="rounded-[24px] bg-slate-50 p-5">
          <div className="flex items-center gap-3 text-slate-900">
            <Bell className="h-5 w-5 text-rose-600" />
            <p className="font-semibold">Pending decisions</p>
          </div>
          <p className="mt-3 text-sm text-slate-600">18 inspections, 28 contracts, and 37 licenses need executive review before the end of week.</p>
        </div>

        <div className="rounded-[24px] bg-slate-50 p-5">
          <div className="flex items-center gap-3 text-slate-900">
            <Globe2 className="h-5 w-5 text-sky-600" />
            <p className="font-semibold">Risk indicators</p>
          </div>
          <p className="mt-3 text-sm text-slate-600">Kano corridor coverage is 64%, and East specialist capacity is under target. Escalate regional support.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Today’s highlights', value: '14 providers require inspection', icon: Sparkles },
          { label: 'Risk indicators', value: '3 regions under coverage threshold', icon: Bell },
          { label: 'Pending decisions', value: '6 contracts require renewal', icon: CreditCard },
        ].map(item => (
          <div key={item.label} className="rounded-[24px] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 text-slate-900">
              <item.icon className="h-5 w-5 text-slate-700" />
              <p className="text-sm font-semibold">{item.label}</p>
            </div>
            <p className="mt-3 text-base font-semibold text-slate-900">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
