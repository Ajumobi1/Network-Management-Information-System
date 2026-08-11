import Input from '../../../components/ui/Input';

export type WizardStepFieldsProps = {
  title: string;
  fields: string[];
  isValid: boolean;
};

export default function WizardStepFields({ title, fields, isValid }: WizardStepFieldsProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isValid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
          {isValid ? 'Validated' : 'Needs review'}
        </span>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {fields.map(field => (
          <label key={field} className="space-y-2 text-sm font-medium text-slate-700">
            {field}
            <Input readOnly placeholder={`Enter ${field.toLowerCase()}`} />
          </label>
        ))}
      </div>
    </div>
  );
}
