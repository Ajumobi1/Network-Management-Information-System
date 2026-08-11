import { ReactNode, useState } from 'react';
import Sidebar from '../navigation/Sidebar';
import Topbar from '../navigation/Topbar';

type ShellProps = {
  title: string;
  subtitle?: string;
  breadcrumb?: { label: string; href?: string }[];
  actions?: ReactNode;
  children: ReactNode;
};

export default function Shell({ title, subtitle, breadcrumb = [], actions, children }: ShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300">
      <Topbar onMenuOpen={() => setMobileMenuOpen(true)} />
      <div className="flex min-h-[calc(100vh-4rem)]">
        <Sidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
              <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                {breadcrumb.map((item, index) => (
                  <span key={item.label} className="inline-flex items-center gap-2">
                    {item.href ? (
                      <a href={item.href} className="text-slate-500 transition hover:text-slate-900">
                        {item.label}
                      </a>
                    ) : (
                      <span>{item.label}</span>
                    )}
                    {index < breadcrumb.length - 1 && <span>›</span>}
                  </span>
                ))}
              </nav>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">{title}</h1>
                  {subtitle ? <p className="mt-2 max-w-3xl text-sm text-slate-600">{subtitle}</p> : null}
                </div>
                <div className="flex flex-wrap gap-3">{actions}</div>
              </div>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
