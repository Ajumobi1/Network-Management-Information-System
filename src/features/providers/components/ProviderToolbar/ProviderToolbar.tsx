import { Settings2 } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import ProviderBulkActions from '../ProviderBulkActions';
import ProviderImportExport from '../ProviderImportExport';

type ProviderToolbarProps = {
  selectedCount: number;
  visibleColumnCount: number;
};

export default function ProviderToolbar({ selectedCount, visibleColumnCount }: ProviderToolbarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
      <ProviderBulkActions selectedCount={selectedCount} />
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" className="gap-2"><Settings2 className="h-4 w-4" /> {visibleColumnCount} Columns</Button>
        <ProviderImportExport />
      </div>
    </div>
  );
}
