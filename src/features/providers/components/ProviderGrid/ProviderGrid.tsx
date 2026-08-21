import { useMemo } from 'react';
import { ProviderDirectoryItem } from '../../types';
import ProviderCard from '../ProviderCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../../../../components/ui/Button';

interface ProviderGridProps {
  providers: ProviderDirectoryItem[];
  onSelect: (providerId: string) => void;
}

export default function ProviderGrid({ providers, onSelect }: ProviderGridProps) {
  const sortedProviders = useMemo(() => 
    [...providers].sort((a, b) => a.providerName.localeCompare(b.providerName)),
    [providers]
  );

  if (providers.length === 0) {
    return (
      <div className="nmis-panel flex flex-col items-center justify-center py-24 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-slate-300">
          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h3 className="mt-6 text-xl font-bold text-slate-900">No providers found</h3>
        <p className="mt-2 max-w-sm text-slate-500">
          Try adjusting your filters or search query to find the healthcare facilities you are looking for.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sortedProviders.map(provider => (
          <ProviderCard 
            key={provider.id} 
            provider={provider} 
            onSelect={onSelect} 
          />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-4 border-t border-slate-100 pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Showing <span className="text-slate-900">{providers.length}</span> facilities <span className="mx-3 opacity-20">|</span> Page 1 of 1
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" size="sm" className="gap-2 px-5">
            <ChevronLeft size={16} /> Previous
          </Button>
          <Button variant="secondary" size="sm" className="gap-2 px-5">
            Next <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
