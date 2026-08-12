import { useMemo, useState } from 'react';
import { ArrowDownUp, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import { ProviderDirectoryItem } from '../../types';
import ProviderQuickActions from '../ProviderQuickActions';
import ProviderStatusBadge, { formatProviderLabel } from '../ProviderStatusBadge';
import ProviderToolbar from '../ProviderToolbar';
import { PROVIDER_IMPORT_EXPORT_COLUMNS } from '../../../../constants/providerNetwork';

const visibleColumns = PROVIDER_IMPORT_EXPORT_COLUMNS.filter(column => !['Contact Person', 'Phone', 'Email'].includes(column));

const columnMap: Record<string, keyof ProviderDirectoryItem> = {
  'Provider Code': 'providerCode',
  'Provider Name': 'providerName',
  'Provider Category': 'category',
  'Provider Subcategory': 'subcategory',
  Ownership: 'ownership',
  LGA: 'lga',
  State: 'state',
  'Contact Person': 'contactPerson',
  Phone: 'phone',
  Email: 'email',
  Status: 'status',
  'Contract Status': 'contractStatus',
  'Credential Status': 'credentialStatus',
  'Inspection Status': 'inspectionStatus',
  'Capitation Status': 'capitationStatus',
  'Inspection Rating': 'inspectionRating',
  'Last Inspection Date': 'lastInspectionDate',
};

export default function ProviderTable({ providers, onSelect }: { providers: ProviderDirectoryItem[]; onSelect: (providerId: string) => void }) {
  const [sortKey, setSortKey] = useState<keyof ProviderDirectoryItem>('providerName');
  const [selected, setSelected] = useState<string[]>([]);
  const sortedProviders = useMemo(() => [...providers].sort((left, right) => String(left[sortKey]).localeCompare(String(right[sortKey]))), [providers, sortKey]);

  return (
    <div className="nmis-table-wrap">
      <ProviderToolbar selectedCount={selected.length} visibleColumnCount={visibleColumns.length} />
      <div className="overflow-x-auto">
        <table className="nmis-table min-w-[1800px]">
          <thead>
            <tr>
              <th className="w-12 px-4">
                <input
                  aria-label="Select all providers"
                  type="checkbox"
                  className="h-4 w-4 rounded border-brand-border text-brand-blue focus:ring-brand-blue"
                  onChange={event => setSelected(event.target.checked ? providers.map(provider => provider.id) : [])}
                />
              </th>
              {visibleColumns.map(column => (
                <th key={column}>
                  <button
                    className="flex items-center gap-2 hover:text-brand-foreground transition-colors"
                    onClick={() => setSortKey(columnMap[column])}
                  >
                    {column}
                    <ArrowDownUp className="h-3 w-3 opacity-50" />
                  </button>
                </th>
              ))}
              <th className="sticky right-0 bg-brand-card-muted px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedProviders.map(provider => (
              <tr key={provider.id}>
                <td className="px-4">
                  <input
                    aria-label={`Select ${provider.providerName}`}
                    type="checkbox"
                    className="h-4 w-4 rounded border-brand-border text-brand-blue focus:ring-brand-blue"
                    checked={selected.includes(provider.id)}
                    onChange={() => setSelected(current => current.includes(provider.id) ? current.filter(id => id !== provider.id) : [...current, provider.id])}
                  />
                </td>
                <td className="font-semibold text-brand-foreground">{provider.providerCode}</td>
                <td className="font-semibold text-brand-foreground">{provider.providerName}</td>
                <td>{provider.category}</td>
                <td>{provider.subcategory}</td>
                <td>{formatProviderLabel(provider.ownership)}</td>
                <td>{provider.lga}</td>
                <td>{provider.state}</td>
                <td><ProviderStatusBadge status={provider.status} /></td>
                <td><ProviderStatusBadge status={provider.contractStatus} /></td>
                <td><ProviderStatusBadge status={provider.credentialStatus} /></td>
                <td><ProviderStatusBadge status={provider.inspectionStatus} /></td>
                <td><ProviderStatusBadge status={provider.capitationStatus} /></td>
                <td>{provider.inspectionRating}</td>
                <td>{provider.lastInspectionDate}</td>
                <td className="sticky right-0 bg-brand-card-muted/50 backdrop-blur-sm px-4 text-center">
                  <ProviderQuickActions providerId={provider.id} status={provider.status} onSelect={onSelect} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-4 border-t border-brand-divider p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-brand-muted">
          Showing {sortedProviders.length} providers <span className="mx-2 opacity-30">|</span> Page 1 of 1
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="gap-1">
            <ChevronLeft size={16} /> Previous
          </Button>
          <Button variant="secondary" size="sm" className="gap-1">
            Next <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
