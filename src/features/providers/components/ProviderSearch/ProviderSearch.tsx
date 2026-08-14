import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import Input from '../../../../components/ui/Input';

type ProviderSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function ProviderSearch({ value, onChange }: ProviderSearchProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (draft === value) return;
    const timer = window.setTimeout(() => onChange(draft), 250);
    return () => window.clearTimeout(timer);
  }, [draft, value, onChange]);

  return (
    <div className="relative w-full">
      <Search className="pointer-events-none absolute left-4 top-3.5 z-10 h-4 w-4 text-slate-400" aria-hidden="true" />
      <Input
        className="pl-10"
        placeholder="Search by provider code, name, category, or LGA..."
        aria-label="Search provider directory"
        value={draft}
        onChange={event => setDraft(event.target.value)}
      />
    </div>
  );
}
