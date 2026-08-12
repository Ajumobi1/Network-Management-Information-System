import { ChevronDown, Filter, RotateCcw } from 'lucide-react';
import { ReactNode, useState } from 'react';

export type FilterBarProps = {
  primaryFilters?: ReactNode;
  advancedFilters?: ReactNode;
  activeFilters?: ReactNode;
  onReset?: () => void;
  resetLabel?: string;
  advancedLabel?: string;
  className?: string;
};

export default function FilterBar({ primaryFilters, advancedFilters, activeFilters, onReset, resetLabel = 'Reset filters', advancedLabel = 'More filters', className = '' }: FilterBarProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const hasAdvanced = Boolean(advancedFilters);

  return <section className={`nmis-card p-4 sm:p-5 ${className}`.trim()} aria-label="Filters">
    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div className="flex min-w-0 flex-1 flex-wrap items-end gap-3">{primaryFilters}</div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {hasAdvanced ? <button type="button" onClick={() => setAdvancedOpen(value => !value)} aria-expanded={advancedOpen} className="inline-flex min-h-[2.625rem] items-center gap-2 rounded-control border border-brand-border bg-brand-card px-3.5 py-2 text-sm font-semibold text-brand-secondary transition hover:bg-brand-surface"><Filter className="h-4 w-4" />{advancedOpen ? 'Hide filters' : advancedLabel}<ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} /></button> : null}
        {onReset ? <button type="button" onClick={onReset} className="inline-flex min-h-[2.625rem] items-center gap-2 rounded-control px-3 py-2 text-sm font-semibold text-brand-muted transition hover:bg-brand-surface hover:text-brand-foreground"><RotateCcw className="h-3.5 w-3.5" />{resetLabel}</button> : null}
      </div>
    </div>
    {advancedOpen && advancedFilters ? <div className="mt-4 grid gap-3 border-t border-brand-divider pt-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{advancedFilters}</div> : null}
    {activeFilters ? <div className="mt-4">{activeFilters}</div> : null}
  </section>;
}
