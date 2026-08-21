import { ReactNode } from 'react';

export type PageBreadcrumb = { label: string; href?: string };

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  breadcrumb?: PageBreadcrumb[];
  actions?: ReactNode;
  meta?: ReactNode;
  className?: string;
};

export default function PageHeader({ title, subtitle, eyebrow, breadcrumb = [], actions, meta, className = '' }: PageHeaderProps) {
  return (
    <header className={`nmis-page-header ${className}`.trim()}>
      <div className="min-w-0">
        {breadcrumb.length > 0 ? <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-2 text-xs text-brand-muted">
          {breadcrumb.map((item, index) => <span key={`${item.label}-${index}`} className="inline-flex items-center gap-2"><>{item.href ? <a href={item.href} className="transition hover:text-brand-blue">{item.label}</a> : <span>{item.label}</span>}{index < breadcrumb.length - 1 ? <span aria-hidden="true">/</span> : null}</></span>)}
        </nav> : null}
        {eyebrow ? <p className="nmis-eyebrow">{eyebrow}</p> : null}
        <h1 className="nmis-page-title">{title}</h1>
        {subtitle ? <p className="nmis-page-subtitle">{subtitle}</p> : null}
        {meta ? <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-brand-muted">{meta}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
