import { MapPin, ShieldCheck, Sparkles } from 'lucide-react';

const coveragePoints = [
  { label: 'Lagos Metro', value: '91%', status: 'Stable' },
  { label: 'Abuja Central', value: '78%', status: 'Watch' },
  { label: 'Kano Corridor', value: '64%', status: 'Risk' },
  { label: 'Port Harcourt Hub', value: '84%', status: 'Stable' },
];

export default function ProviderCoverageMap() {
  return (
    <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">Provider coverage</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Network coverage map</h2>
        </div>
        <div className="inline-flex items-center gap-3 rounded-3xl bg-slate-50 px-4 py-2 text-sm text-slate-600">
          <MapPin className="h-4 w-4" />
          Coverage status
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="h-[420px] rounded-[28px] bg-slate-100 p-4 text-slate-600">
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-200 text-slate-500">
              <ShieldCheck className="h-10 w-10" />
            </div>
            <p className="text-lg font-semibold text-slate-900">Provider coverage heat map</p>
            <p className="max-w-md text-sm text-slate-500">
              Placeholder visualization for future Leaflet or Google Maps integration. Displays provider locations, coverage zones, and risk heat areas.
            </p>
          </div>
        </div>

        <div className="space-y-4 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center gap-3 text-slate-900">
            <Sparkles className="h-5 w-5 text-slate-700" />
            <p className="font-semibold">Critical coverage zones</p>
          </div>
          <div className="space-y-3">
            {coveragePoints.map(point => (
              <div key={point.label} className="rounded-3xl bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{point.label}</p>
                    <p className="text-sm text-slate-500">{point.status}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">{point.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
