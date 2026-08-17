import { Link, Outlet } from 'react-router-dom';
import Shell from './layout/Shell';

export default function AppLayout() {
  return <Shell title="Network Management Information System (NMIS)" subtitle="Ondo State Contributory Health Commission provider, enrolment, and financial operations in one unified workspace." hideHeader actions={<Link to="/settings" className="inline-flex min-h-[2.625rem] items-center justify-center rounded-control border border-brand-border bg-brand-card px-4 py-2 text-sm font-semibold text-brand-secondary transition hover:bg-brand-surface">System settings</Link>}>
    <Outlet />
    <footer className="nmis-card px-5 py-4 text-sm text-brand-muted sm:px-6"><p>© {new Date().getFullYear()} Ondo State Contributory Health Commission · Network Management Information System (NMIS). All rights reserved.</p></footer>
  </Shell>;
}
