import { Link } from 'react-router-dom';

type PageHeaderAction = {
  label: string;
  to?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
};

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: PageHeaderAction[];
};

function PageHeader({ title, description, actions = [] }: PageHeaderProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">Overview</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">{title}</h1>
          {description ? <p className="mt-3 text-sm text-slate-600 max-w-2xl">{description}</p> : null}
        </div>
        <div className="flex flex-wrap gap-3">
          {actions.map(action => {
            const className = action.variant === 'secondary'
              ? 'rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100'
              : 'rounded-2xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-navy';

            if (action.to) {
              return (
                <Link key={action.label} to={action.to} className={className}>
                  {action.label}
                </Link>
              );
            }

            return (
              <button key={action.label} type="button" onClick={action.onClick} className={className}>
                {action.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default PageHeader;
