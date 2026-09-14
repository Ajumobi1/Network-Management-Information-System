import { ReactNode, useState } from 'react';
import Sidebar from '../navigation/Sidebar';
import Topbar from '../navigation/Topbar';
import PageHeader from '../ui/PageHeader';

type ShellProps = {
  title: string;
  subtitle?: string;
  breadcrumb?: { label: string; href?: string }[];
  actions?: ReactNode;
  children: ReactNode;
  hideHeader?: boolean;
};

export default function Shell({ title, subtitle, breadcrumb = [], actions, children, hideHeader = false }: ShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return <div className="nmis-shell flex h-dvh min-h-dvh flex-col overflow-hidden bg-brand-background text-brand-foreground transition-colors duration-300">
    <Topbar onMenuOpen={() => setMobileMenuOpen(true)} />
    <div className="flex flex-1 overflow-hidden">
      <Sidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <main className="nmis-main min-w-0 flex-1 overflow-y-auto px-3 py-3 custom-scrollbar sm:px-6 sm:py-6 lg:px-8">
        <div className="nmis-page">
          {!hideHeader ? <PageHeader title={title} subtitle={subtitle} breadcrumb={breadcrumb} actions={actions} /> : null}
          {children}
        </div>
      </main>
    </div>
  </div>;
}
