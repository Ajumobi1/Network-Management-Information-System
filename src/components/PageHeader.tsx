import { Link } from 'react-router-dom';
import DesignPageHeader from './ui/PageHeader';

type PageHeaderAction = { label: string; to?: string; onClick?: () => void; variant?: 'primary' | 'secondary'; disabled?: boolean };
type PageHeaderProps = { title: string; description?: string; actions?: PageHeaderAction[] };

export default function PageHeader({ title, description, actions = [] }: PageHeaderProps) {
  return <DesignPageHeader title={title} eyebrow="Overview" subtitle={description} actions={<>{actions.map(action => {
    const className = action.variant === 'secondary' ? `inline-flex min-h-[2.625rem] items-center justify-center rounded-control border border-brand-border px-4 py-2 text-sm font-semibold transition ${action.disabled ? 'cursor-not-allowed bg-brand-surface text-brand-subtle' : 'bg-brand-card text-brand-secondary hover:bg-brand-surface'}` : `inline-flex min-h-[2.625rem] items-center justify-center rounded-control px-4 py-2 text-sm font-semibold text-white transition ${action.disabled ? 'cursor-not-allowed bg-slate-300' : 'bg-brand-blue hover:bg-brand-hover'}`;
    if (action.to && !action.disabled) return <Link key={action.label} to={action.to} className={className}>{action.label}</Link>;
    return <button key={action.label} type="button" onClick={action.onClick} className={className} disabled={action.disabled}>{action.label}</button>;
  })}</>} />;
}
