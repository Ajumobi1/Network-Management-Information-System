import { Eye } from 'lucide-react';
import Button from '../../../../components/ui/Button';

export default function ProviderQuickActions({ providerId, onSelect }: { providerId: string; onSelect: (providerId: string) => void }) {
  return (
    <Button variant="ghost" className="gap-2" onClick={() => onSelect(providerId)}>
      <Eye className="h-4 w-4" /> View
    </Button>
  );
}
