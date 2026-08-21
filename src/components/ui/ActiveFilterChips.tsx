import { X } from 'lucide-react';

type FilterChip = {
  id: string;
  label: string;
  value: string;
};

type ActiveFilterChipsProps = {
  chips: FilterChip[];
  onRemove: (id: string) => void;
  onClear?: () => void;
};

export default function ActiveFilterChips({ chips, onRemove, onClear }: ActiveFilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3" aria-label="Active filters">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Active filters</span>
      {chips.map(chip => (
        <button key={chip.id} type="button" onClick={() => onRemove(chip.id)} className="inline-flex items-center gap-1.5 rounded-full border border-brand-blue/20 bg-brand-blue/[0.06] px-3 py-1.5 text-xs font-semibold text-brand-blue transition hover:bg-brand-blue/10" aria-label={`Remove ${chip.label} filter`}>
          <span>{chip.label}: {chip.value}</span><X className="h-3.5 w-3.5" />
        </button>
      ))}
      {onClear ? <button type="button" onClick={onClear} className="px-2 py-1 text-xs font-semibold text-slate-500 hover:text-slate-900">Clear all</button> : null}
    </div>
  );
}
