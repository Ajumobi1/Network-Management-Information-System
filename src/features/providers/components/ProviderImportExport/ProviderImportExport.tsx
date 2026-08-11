import { Download, Upload } from 'lucide-react';
import Button from '../../../../components/ui/Button';

export default function ProviderImportExport() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" className="gap-2"><Download className="h-4 w-4" /> Export</Button>
      <Button variant="outline" className="gap-2"><Upload className="h-4 w-4" /> Import</Button>
    </div>
  );
}
