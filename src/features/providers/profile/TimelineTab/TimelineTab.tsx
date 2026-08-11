import { ProviderTabProps } from '../ProfileTabShell';

export default function TimelineTab({ provider }: ProviderTabProps) {
  return (
    <div className="space-y-3">
      {provider.timeline.map(item => (
        <div key={item.id} className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
          <p className="mt-1 text-xs text-slate-500">{item.date} • {item.actor}</p>
          <p className="mt-2 text-sm text-slate-600">{item.description}</p>
        </div>
      ))}
    </div>
  );
}
