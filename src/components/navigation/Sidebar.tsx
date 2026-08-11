import { NavLink } from 'react-router-dom';
import {
  Layers,
  ClipboardList,
  ClipboardCheck,
  Grid,
  ShieldCheck,
  FileChartColumn,
  Zap,
  Bell,
  Users,
  Settings,
  LogOut,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const sections = [
  { label: 'Dashboard', path: '/dashboard', icon: Grid, visible: true },
  {
    label: 'Provider Management',
    icon: Layers,
    visible: true,
    children: [
      { label: 'Provider Directory', path: '/providers', icon: Users, visible: true },
      { label: 'Provider Registration', path: '/provider-registration', icon: ClipboardList, visible: true },
      { label: 'Credentialing', path: '/credentialing', icon: ShieldCheck, visible: true },
      { label: 'Contracts', path: '/contracts', icon: FileText, visible: true },
    ],
  },
  {
    label: 'Network Financial Data',
    icon: FileChartColumn,
    visible: true,
    children: [
      { label: 'Financial Overview', path: '/financial/dashboard', icon: Grid, visible: true },
      { label: 'Claims Data', path: '/financial/claims', icon: FileText, visible: true },
      { label: 'Claims Analytics', path: '/financial/claims/analytics', icon: FileChartColumn, visible: true },
      { label: 'Capitation Data', path: '/financial/capitation', icon: FileChartColumn, visible: true },
      { label: 'FFS Data', path: '/financial/ffs', icon: FileText, visible: true },
      { label: 'Enrolment Data', path: '/financial/enrolment', icon: Users, visible: true },
      { label: 'Data Upload Centre', path: '/financial/upload', icon: ClipboardList, visible: true },
      { label: 'Import History', path: '/financial/history', icon: ClipboardCheck, visible: true },
    ],
  },
  {
    label: 'Population & Enrolment',
    icon: Users,
    visible: true,
    children: [
      { label: 'Population Overview', path: '/population/enrolment', icon: Grid, visible: true },
      { label: 'Enrolment Register', path: '/population/enrolment/register', icon: Users, visible: true },
      { label: 'Upload Capitation List', path: '/population/enrolment/upload', icon: ClipboardList, visible: true },
    ],
  },
  { label: 'Capitation', path: '/capitation', icon: FileChartColumn, visible: true },
  { label: 'Facility Inspection', path: '/inspections', icon: ClipboardCheck, visible: true },
  { label: 'Performance', path: '/performance', icon: Zap, visible: true },
  { label: 'Reports', path: '/reports', icon: FileChartColumn, visible: true },
  { label: 'Communication', path: '/communication', icon: Bell, visible: true },
  { label: 'Notifications', path: '/notifications', icon: Bell, visible: true },
  { label: 'User Management', path: '/admin/users', icon: Users, visible: true },
  { label: 'Audit Logs', path: '/audit-logs', icon: FileText, visible: true },
  { label: 'Settings', path: '/settings', icon: Settings, visible: true },
  { label: 'Logout', path: '/login', icon: LogOut, visible: true, action: 'logout' },
];

function Sidebar() {
  const { signOut } = useAuth();

  return (
    <aside className="hidden w-80 shrink-0 border-r border-slate-200 bg-white lg:block">
      <div className="flex h-full flex-col justify-between px-4 py-6">
        <div className="space-y-8">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Navigation</p>
            <h2 className="mt-3 text-xl font-semibold text-slate-900">Enterprise shell</h2>
          </div>
          <nav className="space-y-2">
            {sections.map(section => {
              if (!section.visible) return null;

              if ('children' in section && section.children) {
                return (
                  <div key={section.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-3 flex items-center gap-3 rounded-3xl px-3 py-2 text-sm font-semibold text-slate-700">
                      <section.icon className="h-4 w-4" />
                      {section.label}
                    </div>
                    <div className="space-y-1">
                      {section.children.map(child => (
                        <NavLink
                          key={child.label}
                          to={child.path}
                          className={({ isActive }) =>
                            `flex items-center gap-3 rounded-3xl px-3 py-2 text-sm font-medium transition ${
                              isActive ? 'bg-brand-blue text-white' : 'text-slate-700 hover:bg-slate-100'
                            }`
                          }
                        >
                          <child.icon className="h-4 w-4" />
                          {child.label}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <NavLink
                  key={section.label}
                  to={section.path}
                  onClick={section.action === 'logout' ? signOut : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-medium transition ${
                      isActive ? 'bg-brand-blue text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`
                  }
                >
                  <section.icon className="h-5 w-5" />
                  {section.label}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">Need help?</p>
          <p className="mt-2">Use the assistant to find modules, reports, and tasks.</p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
