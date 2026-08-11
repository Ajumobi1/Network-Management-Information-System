import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Activity,
  Bell,
  Building2,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  FileChartColumn,
  FileText,
  Grid,
  Layers,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
  UploadCloud,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

type SidebarProps = {
  mobileOpen?: boolean;
  onClose?: () => void;
};

type NavItem = {
  label: string;
  path: string;
  icon: typeof Grid;
  end?: boolean;
  visible?: boolean;
};

type NavGroup = {
  label: string;
  icon: typeof Grid;
  children: NavItem[];
  visible?: boolean;
};

type Section = NavItem | NavGroup;

const isGroup = (section: Section): section is NavGroup => 'children' in section;

const sections: Section[] = [
  { label: 'Dashboard', path: '/dashboard', icon: Grid, end: true, visible: true },
  {
    label: 'Provider Network',
    icon: Building2,
    visible: true,
    children: [
      { label: 'Provider Directory', path: '/providers', icon: Users },
      { label: 'Provider Registration', path: '/provider-registration', icon: ClipboardList },
      { label: 'Credentialing', path: '/credentialing', icon: ShieldCheck },
      { label: 'Contracts', path: '/contracts', icon: FileText },
      { label: 'Inspections', path: '/inspections', icon: ClipboardCheck },
      { label: 'Provider Performance', path: '/performance', icon: Activity },
    ],
  },
  {
    label: 'Financial Management',
    icon: FileChartColumn,
    visible: true,
    children: [
      { label: 'Financial Overview', path: '/financial/dashboard', icon: Grid },
      { label: 'Claims', path: '/financial/claims', icon: FileText },
      { label: 'Capitation', path: '/financial/capitation', icon: FileChartColumn },
      { label: 'Fee-for-Service', path: '/financial/ffs', icon: FileText },
      { label: 'Data Upload Centre', path: '/financial/upload', icon: UploadCloud },
      { label: 'Import History', path: '/financial/history', icon: ClipboardCheck },
    ],
  },
  {
    label: 'Population & Enrolment',
    icon: Users,
    visible: true,
    children: [
      { label: 'Population Overview', path: '/population/enrolment', icon: Grid },
      { label: 'Enrolment Register', path: '/population/enrolment/register', icon: Users },
      { label: 'Monthly Analysis', path: '/population/enrolment', icon: FileChartColumn },
      { label: 'Upload Capitation List', path: '/population/enrolment/upload', icon: UploadCloud },
    ],
  },
  {
    label: 'Analytics & Reports',
    icon: Zap,
    visible: true,
    children: [
      { label: 'Executive Analytics', path: '/dashboard', icon: Grid },
      { label: 'Financial Intelligence', path: '/analytics/financial-intelligence', icon: FileChartColumn },
      { label: 'Provider Analytics', path: '/providers', icon: Building2 },
      { label: 'Enrolment Analytics', path: '/population/enrolment', icon: Users },
      { label: 'Reports Centre', path: '/reports', icon: FileText },
    ],
  },
  {
    label: 'Quality & Compliance',
    icon: ShieldCheck,
    visible: true,
    children: [
      { label: 'Inspections', path: '/inspections', icon: ClipboardCheck },
      { label: 'Performance Monitoring', path: '/performance', icon: Activity },
      { label: 'Audit Logs', path: '/audit-logs', icon: FileText },
      { label: 'Complaints', path: '/complaints', icon: Bell },
    ],
  },
  {
    label: 'Communication',
    icon: Bell,
    visible: true,
    children: [
      { label: 'Notifications', path: '/notifications', icon: Bell },
      { label: 'SMS / Email', path: '/communication', icon: FileText },
      { label: 'Communication History', path: '/communication', icon: ClipboardList },
    ],
  },
  {
    label: 'Administration',
    icon: Settings,
    visible: true,
    children: [
      { label: 'User Management', path: '/admin/users', icon: Users },
      { label: 'Roles & Permissions', path: '/admin/users', icon: ShieldCheck },
      { label: 'System Settings', path: '/settings', icon: Settings },
    ],
  },
];

function getInitialExpanded(locationPath: string) {
  const saved = sessionStorage.getItem('nmis.sidebar.expanded');
  const parsed = saved ? (JSON.parse(saved) as Record<string, boolean>) : {};
  sections.filter(isGroup).forEach(group => {
    if (group.children.some(child => locationPath.startsWith(child.path))) parsed[group.label] = true;
  });
  return parsed;
}

function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const { session, signOut } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => getInitialExpanded(location.pathname));

  const role = session?.user.role ?? 'super-admin';
  const visibleSections = useMemo(() => sections.filter(section => section.visible !== false), []);

  useEffect(() => {
    sessionStorage.setItem('nmis.sidebar.expanded', JSON.stringify(expanded));
  }, [expanded]);

  useEffect(() => {
    setExpanded(previous => {
      const next = { ...previous };
      sections.filter(isGroup).forEach(group => {
        if (group.children.some(child => location.pathname.startsWith(child.path))) next[group.label] = true;
      });
      return next;
    });
  }, [location.pathname]);

  const toggleGroup = (label: string) => {
    setExpanded(previous => ({ ...previous, [label]: !previous[label] }));
  };

  return (
    <>
      {mobileOpen ? <button type="button" aria-label="Close navigation" onClick={onClose} className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" /> : null}
      <aside className={`${mobileOpen ? 'fixed inset-y-0 left-0 z-50 flex' : 'hidden lg:flex'} ${collapsed ? 'w-20' : 'w-80'} shrink-0 border-r border-slate-200 bg-white transition-[width] duration-200`}>
        <div className="flex h-full min-h-screen w-full flex-col justify-between px-3 py-5">
          <div className="min-h-0 space-y-6">
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} gap-2 px-2`}>
              {!collapsed ? (
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Navigation</p>
                  <h2 className="mt-2 text-lg font-semibold text-slate-900">Enterprise shell</h2>
                  <p className="mt-1 text-xs text-slate-500">Role: {role.replace('-', ' ')}</p>
                </div>
              ) : <Layers className="h-6 w-6 text-brand-blue" />}
              <button
                type="button"
                onClick={() => setCollapsed(value => !value)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </button>
              {mobileOpen ? <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 lg:hidden" aria-label="Close navigation"><X className="h-4 w-4" /></button> : null}
            </div>

            <nav className="min-h-0 space-y-2 overflow-y-auto pb-4" aria-label="Primary navigation">
              {visibleSections.map(section => {
                if (!isGroup(section)) {
                  return (
                    <NavLink
                      key={section.label}
                      to={section.path}
                      end={section.end}
                      onClick={onClose}
                      title={collapsed ? section.label : undefined}
                      className={({ isActive }) => `flex items-center ${collapsed ? 'justify-center' : ''} gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-brand-blue text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'}`}
                    >
                      <section.icon className="h-4 w-4 shrink-0" />
                      {!collapsed ? <span>{section.label}</span> : null}
                    </NavLink>
                  );
                }

                const isActiveGroup = section.children.some(child => location.pathname.startsWith(child.path));
                return (
                  <div key={section.label} className={`rounded-2xl border ${isActiveGroup ? 'border-brand-blue/20 bg-brand-blue/[0.04]' : 'border-slate-200 bg-slate-50'}`}>
                    <button
                      type="button"
                      onClick={() => collapsed ? setCollapsed(false) : toggleGroup(section.label)}
                      className={`flex w-full items-center ${collapsed ? 'justify-center' : 'justify-between'} gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold ${isActiveGroup ? 'text-brand-blue' : 'text-slate-700'}`}
                      title={collapsed ? section.label : undefined}
                      aria-expanded={collapsed ? false : expanded[section.label]}
                    >
                      <span className="flex items-center gap-3"><section.icon className="h-4 w-4 shrink-0" />{!collapsed ? section.label : null}</span>
                      {!collapsed ? <ChevronDown className={`h-4 w-4 transition-transform ${expanded[section.label] ? 'rotate-180' : ''}`} /> : null}
                    </button>
                    {!collapsed && expanded[section.label] ? (
                      <div className="space-y-1 px-2 pb-2">
                        {section.children.map(child => (
                          <NavLink
                            key={`${section.label}-${child.label}`}
                            to={child.path}
                            onClick={onClose}
                            className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${isActive ? 'bg-brand-blue text-white' : 'text-slate-600 hover:bg-white hover:text-slate-900'}`}
                          >
                            <child.icon className="h-4 w-4 shrink-0" />
                            <span>{child.label}</span>
                          </NavLink>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </nav>
          </div>

          <div className={`${collapsed ? 'p-2' : 'p-4'} rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-600`}>
            {collapsed ? <button type="button" onClick={signOut} className="flex w-full justify-center text-slate-600" title="Logout" aria-label="Logout"><LogOut className="h-4 w-4" /></button> : <><p className="font-semibold text-slate-900">Need help?</p><p className="mt-2 text-xs leading-5">Use the assistant to find modules, reports, and tasks.</p><button type="button" onClick={signOut} className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-brand-blue"><LogOut className="h-3.5 w-3.5" /> Logout</button></>}
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
