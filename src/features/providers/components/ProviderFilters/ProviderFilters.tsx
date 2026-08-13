import Button from '../../../../components/ui/Button';
import Select from '../../../../components/ui/Select';
import { ProviderDirectoryFilters } from '../../types';
import ProviderSearch from '../ProviderSearch';

type ProviderFiltersProps = {
  filters: ProviderDirectoryFilters;
  categories: string[];
  ownerships: string[];
  onChange: (filters: ProviderDirectoryFilters) => void;
};

export default function ProviderFilters({ filters, categories, ownerships, onChange }: ProviderFiltersProps) {
  const handleReset = () => {
    onChange({
      search: '',
      status: 'all',
      contractStatus: 'all',
      credentialStatus: 'all',
      inspectionStatus: 'all',
      capitationStatus: 'all',
      lga: 'all',
      category: 'all',
      subcategory: 'all',
      ownership: 'all',
    });
  };

  return (
    <div className="nmis-card p-4 sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="nmis-label">Search directory</p>
            <ProviderSearch value={filters.search} onChange={search => onChange({ ...filters, search })} />
          </div>

          <Select
            label="Facility type"
            value={filters.category}
            options={categories.map(c => ({ label: c === 'all' ? 'All types' : c, value: c }))}
            onChange={event => onChange({ ...filters, category: event.target.value })}
          />

          <Select
            label="Ownership"
            value={filters.ownership}
            options={ownerships.map(o => ({ label: o === 'all' ? 'All ownerships' : o, value: o }))}
            onChange={event => onChange({ ...filters, ownership: event.target.value as any })}
          />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="secondary" onClick={handleReset} className="h-[2.625rem]">
            Reset
          </Button>
          <Button variant="secondary" disabled className="h-[2.625rem] opacity-50" title="More filters are coming soon">
            More filters
          </Button>
        </div>
      </div>
    </div>
  );
}
