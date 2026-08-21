import { PlusCircle, CalendarDays, CloudUpload, FileChartColumn, UserPlus, ShieldCheck } from 'lucide-react';
import Button from '../ui/Button';

const cardDefinitions = [
  { label: 'Register provider', icon: PlusCircle, variant: 'primary' },
  { label: 'Schedule inspection', icon: CalendarDays, variant: 'secondary' },
  { label: 'Upload capitation', icon: CloudUpload, variant: 'secondary' },
  { label: 'Generate report', icon: FileChartColumn, variant: 'ghost' },
  { label: 'Invite provider', icon: UserPlus, variant: 'ghost' },
  { label: 'Assign inspector', icon: ShieldCheck, variant: 'secondary' },
];

export default function QuickActionCards() {
  return (
    <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">Quick actions</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Fast access tools</h2>
        </div>
        <p className="rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-600">Instant workflow</p>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cardDefinitions.map(card => (
          <div key={card.label} className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:shadow-elevated">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-white shadow-sm text-slate-900">
                <card.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{card.label}</p>
                <p className="text-sm text-slate-600">Run this workflow quickly.</p>
              </div>
            </div>
            <Button variant={card.variant as any} className="mt-6 w-full text-sm">Launch</Button>
          </div>
        ))}
      </div>
    </div>
  );
}
