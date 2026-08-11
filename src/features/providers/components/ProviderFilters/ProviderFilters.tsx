import { Settings2 } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Card from '../../../../components/ui/Card';
import { ProviderDirectoryFilters } from '../../types';
import ProviderSearch from '../ProviderSearch';

type ProviderFiltersProps = {
  filters: ProviderDirectoryFilters;
  states: string[];
  categories: string[];
  onChange: (filters: ProviderDirectoryFilters) => void;
};

export default function ProviderFilters({ filters, states, categories, onChange }: ProviderFiltersProps) {
  return (
    <Card>
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr_auto]">
        <ProviderSearch value={filters.search} onChange={search => onChange({ ...filters, search })} />
        <select
          className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900"
          value={filters.state}
          onChange={event => onChange({ ...filters, state: event.target.value })}
        >
          {states.map(state => <option key={state} value={state}>{state === 'all' ? 'All states' : state}</option>)}
        </select>
        <select
          className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900"
          value={filters.category}
          onChange={event => onChange({ ...filters, category: event.target.value })}
        >
          {categories.map(category => <option key={category} value={category}>{category === 'all' ? 'All categories' : category}</option>)}
        </select>
        <Button variant="secondary" className="gap-2"><Settings2 className="h-4 w-4" /> Saved filters</Button>
      </div>
    </Card>
  );
}
