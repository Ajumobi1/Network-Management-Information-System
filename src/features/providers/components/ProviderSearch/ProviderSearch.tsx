import { Search } from 'lucide-react';
import Input from '../../../../components/ui/Input';

type ProviderSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function ProviderSearch({ value, onChange }: ProviderSearchProps) {
  return (
    <label className="relative">
      <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
      <Input
        className="pl-10"
        placeholder="Global search by code, name, contact, phone, email, state..."
        value={value}
        onChange={event => onChange(event.target.value)}
      />
    </label>
  );
}
