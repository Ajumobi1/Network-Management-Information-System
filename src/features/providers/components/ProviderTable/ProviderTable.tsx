import { useMemo, useState } from 'react';
import { ArrowDownUp } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Card from '../../../../components/ui/Card';
import { ProviderDirectoryItem } from '../../types';
import ProviderQuickActions from '../ProviderQuickActions';
import ProviderStatusBadge, { formatProviderLabel } from '../ProviderStatusBadge';
import ProviderToolbar from '../ProviderToolbar';
import { PROVIDER_IMPORT_EXPORT_COLUMNS } from '../../../../constants/providerNetwork';

const visibleColumns = PROVIDER_IMPORT_EXPORT_COLUMNS;

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
    <Card className="overflow-hidden p-0">
      <ProviderToolbar selectedCount={selected.length} visibleColumnCount={visibleColumns.length} />
      <div className="overflow-x-auto">
        <table className="min-w-[1600px] divide-y divide-slate-200 text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-4"><input aria-label="Select all providers" type="checkbox" onChange={event => setSelected(event.target.checked ? providers.map(provider => provider.id) : [])} /></th>
              {visibleColumns.map(column => (
                <th key={column} className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <button className="inline-flex items-center gap-2" onClick={() => setSortKey(columnMap[column])}>
                    {column}<ArrowDownUp className="h-3 w-3" />
                  </button>
                </th>
              ))}
              <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {sortedProviders.map(provider => (
              <tr key={provider.id} className="hover:bg-slate-50">
                <td className="px-4 py-4"><input aria-label={`Select ${provider.providerName}`} type="checkbox" checked={selected.includes(provider.id)} onChange={() => setSelected(current => current.includes(provider.id) ? current.filter(id => id !== provider.id) : [...current, provider.id])} /></td>
                <td className="px-4 py-4 text-sm font-semibold text-slate-900">{provider.providerCode}</td>
                <td className="px-4 py-4 text-sm font-semibold text-slate-900">{provider.providerName}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{provider.category}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{provider.subcategory}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{formatProviderLabel(provider.ownership)}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{provider.lga}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{provider.state}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{provider.contactPerson}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{provider.phone}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{provider.email}</td>
                <td className="px-4 py-4"><ProviderStatusBadge status={provider.status} /></td>
                <td className="px-4 py-4"><ProviderStatusBadge status={provider.contractStatus} /></td>
                <td className="px-4 py-4"><ProviderStatusBadge status={provider.credentialStatus} /></td>
                <td className="px-4 py-4"><ProviderStatusBadge status={provider.inspectionStatus} /></td>
                <td className="px-4 py-4"><ProviderStatusBadge status={provider.capitationStatus} /></td>
                <td className="px-4 py-4 text-sm text-slate-600">{provider.inspectionRating}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{provider.lastInspectionDate}</td>
                <td className="px-4 py-4"><ProviderQuickActions providerId={provider.id} onSelect={onSelect} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 border-t border-slate-200 p-5 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <span>Showing {sortedProviders.length} providers • Page 1 of 1</span>
        <div className="flex gap-2"><Button variant="secondary">Previous</Button><Button variant="secondary">Next</Button></div>
      </div>
    </Card>
  );
}
