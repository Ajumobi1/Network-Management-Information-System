import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDownUp, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Badge from '../../../../components/ui/Badge';
import { ProviderDirectoryItem } from '../../types';
import ProviderStatusBadge from '../ProviderStatusBadge';
import ProviderToolbar from '../ProviderToolbar';

const listColumns = [
  { key: 'providerCode', label: 'Code' },
  { key: 'providerName', label: 'Facility Name' },
  { key: 'category', label: 'Category' },
  { key: 'ownership', label: 'Ownership' },
  { key: 'lga', label: 'LGA' },
  { key: 'status', label: 'Status' },
];

export default function ProviderTable({ providers }: { providers: ProviderDirectoryItem[]; onSelect?: (providerId: string) => void }) {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<keyof ProviderDirectoryItem>('providerName');
  const [selected, setSelected] = useState<string[]>([]);
  const sortedProviders = useMemo(() => [...providers].sort((left, right) => String(left[sortKey]).localeCompare(String(right[sortKey]))), [providers, sortKey]);

  return (
    <div className="nmis-table-wrap">
      <ProviderToolbar selectedCount={selected.length} visibleColumnCount={listColumns.length} />
      <div className="overflow-x-auto">
        <table className="nmis-table w-full">
          <thead>
            <tr>
              <th className="w-12 px-6 py-4">
                <input
                  aria-label="Select all providers"
                  type="checkbox"
                  className="h-4 w-4 rounded border-brand-border text-brand-blue focus:ring-brand-blue"
                  onChange={event => setSelected(event.target.checked ? providers.map(provider => provider.id) : [])}
                />
              </th>
              {listColumns.map(column => (
                <th key={column.key} className="px-6 py-4">
                  <button
                    className="flex items-center gap-2 hover:text-brand-foreground transition-colors"
                    onClick={() => setSortKey(column.key as keyof ProviderDirectoryItem)}
                  >
                    {column.label}
                    <ArrowDownUp className="h-3 w-3 opacity-50" />
                  </button>
                </th>
              ))}
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedProviders.map(provider => (
              <tr
                key={provider.id}
                className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/providers/${provider.id}`)}
              >
                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                  <input
                    aria-label={`Select ${provider.providerName}`}
                    type="checkbox"
                    className="h-4 w-4 rounded border-brand-border text-brand-blue focus:ring-brand-blue"
                    checked={selected.includes(provider.id)}
                    onChange={() => setSelected(current => current.includes(provider.id) ? current.filter(id => id !== provider.id) : [...current, provider.id])}
                  />
                </td>
                <td className="px-6 py-4 font-mono text-xs font-bold text-brand-blue bg-brand-blue/5 rounded-lg text-center w-20">
                  {provider.providerCode}
                </td>
                <td className="px-6 py-4">
                  <div className="font-black text-slate-900 text-sm hover:text-brand-blue transition-colors">{provider.providerName}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">{provider.subcategory}</div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant="info" className="text-[10px] uppercase tracking-wider">{provider.category}</Badge>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs font-semibold text-slate-700">{provider.ownership}</span>
                </td>
                <td className="px-6 py-4 text-slate-600 font-medium">{provider.lga}</td>
                <td className="px-6 py-4">
                  <ProviderStatusBadge status={provider.status} />
                </td>
                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs px-3 py-1.5 text-brand-blue hover:bg-brand-blue/10"
                    onClick={() => navigate(`/providers/${provider.id}`)}
                  >
                    <Eye size={14} /> View Profile
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-4 border-t border-brand-divider p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-brand-muted">
          Showing {sortedProviders.length} official network providers <span className="mx-2 opacity-30">|</span> Page 1 of 1
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
