import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDownUp, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Badge from '../../../../components/ui/Badge';
import { ProviderDirectoryItem } from '../../types';
import ProviderStatusBadge from '../ProviderStatusBadge';
import ProviderToolbar from '../ProviderToolbar';
import { getProviderCategoryLabel } from '../../../../constants/providerNetwork';

const listColumns = [
  { key: 'providerCode', label: 'Code', sortable: true },
  { key: 'providerName', label: 'Facility Name', sortable: true },
  { key: 'category', label: 'Category', sortable: true },
  { key: 'ownership', label: 'Ownership', sortable: true },
  { key: 'lga', label: 'LGA', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
];

type ProviderTableProps = {
  providers: ProviderDirectoryItem[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  onSelect?: (providerId: string) => void;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
};

export default function ProviderTable({ 
  providers, 
  page = 1, 
  pageSize = 50, 
  totalCount = providers.length, 
  onPageChange,
  sortField = 'providerName',
  sortDirection = 'asc',
  onSort
}: ProviderTableProps) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  return (
    <div className="nmis-table-wrap">
      <ProviderToolbar selectedCount={selected.length} visibleColumnCount={listColumns.length} />
      <div className="nmis-table-scroll">
        <table className="nmis-table w-full min-w-[960px]">
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
                <th 
                  key={column.key} 
                  className={`px-6 py-4 ${column.sortable ? 'cursor-pointer hover:bg-slate-50 transition-colors' : ''}`}
                  onClick={() => column.sortable && onSort?.(column.key)}
                >
                  <div className="flex items-center gap-2 text-brand-foreground">
                    {column.label}
                    {column.sortable && (
                      <ArrowDownUp size={12} className={sortField === column.key ? 'text-brand-blue' : 'text-slate-300'} />
                    )}
                  </div>
                </th>
              ))}
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {providers.map(provider => (
              <tr
                key={provider.id}
                className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/providers/${provider.id}`)}
              >
                <td className="px-4 py-3 sm:px-6 sm:py-4" onClick={(e) => e.stopPropagation()}>
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
                <td className="px-4 py-3 sm:px-6 sm:py-4">
                  <div className="font-black text-slate-900 text-sm hover:text-brand-blue transition-colors">{provider.providerName}</div>
                </td>
                <td className="px-4 py-3 sm:px-6 sm:py-4">
                  <Badge variant="info" className="text-[10px] uppercase tracking-wider">{getProviderCategoryLabel(provider.category)}</Badge>
                </td>
                <td className="px-4 py-3 sm:px-6 sm:py-4">
                  <span className="text-xs font-semibold text-slate-700">{provider.ownership}</span>
                </td>
                <td className="px-6 py-4 text-slate-600 font-medium">{provider.lga}</td>
                <td className="px-4 py-3 sm:px-6 sm:py-4">
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
          Showing {startItem}–{endItem} of {totalCount} providers <span className="mx-2 opacity-30">|</span> Page {page} of {totalPages}
        </p>
        {totalPages > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="gap-1"
              disabled={page <= 1}
              onClick={() => onPageChange?.(page - 1)}
            >
              <ChevronLeft size={16} /> Previous
            </Button>
            <div className="flex max-w-full flex-wrap items-center gap-1 px-2">
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                const isCurrent = pageNum === page;
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange?.(pageNum)}
                    className={`h-8 w-8 rounded-lg text-xs font-bold transition-colors ${
                      isCurrent
                        ? 'bg-brand-blue text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="gap-1"
              disabled={page >= totalPages}
              onClick={() => onPageChange?.(page + 1)}
            >
              Next <ChevronRight size={16} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
