import { ProviderProfile } from '../types';

export type ProviderTabProps = {
  provider: ProviderProfile;
};

export function InfoGrid({ items }: { items: Array<[string, string | number]> }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-3xl bg-slate-50 p-5">
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
        </div>
      ))}
    </div>
  );
}
