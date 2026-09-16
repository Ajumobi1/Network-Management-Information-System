import { ReactNode, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    mainRef.current?.focus({ preventScroll: true });
  }, [location.pathname]);

  return <div className="nmis-shell flex h-dvh min-h-dvh flex-col overflow-hidden bg-brand-background text-brand-foreground transition-colors duration-300">
    <a href="#main-content" className="sr-only z-[100] rounded-control bg-brand-navy px-4 py-3 text-sm font-bold text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4">
      Skip to main content
    </a>
    <Topbar onMenuOpen={() => setMobileMenuOpen(true)} />
    <div className="flex flex-1 overflow-hidden">
      <Sidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <main id="main-content" ref={mainRef} tabIndex={-1} className="nmis-main min-w-0 flex-1 overflow-y-auto px-3 py-3 outline-none custom-scrollbar sm:px-6 sm:py-6 lg:px-8">
        <div className="nmis-page">
          {!hideHeader ? <PageHeader title={title} subtitle={subtitle} breadcrumb={breadcrumb} actions={actions} /> : null}
          {children}
        </div>
      </main>
    </div>
  </div>;
}
