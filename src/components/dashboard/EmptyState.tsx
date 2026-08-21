import Button from '../ui/Button';

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel: string;
};

export default function EmptyState({ title, description, actionLabel }: EmptyStateProps) {
  return (
    <div className="rounded-[32px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
      <p className="text-sm uppercase tracking-[0.3em] text-slate-400">No data</p>
      <h3 className="mt-4 text-xl font-semibold text-slate-900">{title}</h3>
      <p className="mt-3 text-sm text-slate-600">{description}</p>
      <Button variant="secondary" className="mt-6 mx-auto text-sm">{actionLabel}</Button>
    </div>
  );
}
