import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Activity, Bell, Building2, ChevronDown, ClipboardCheck, ClipboardList, FileChartColumn, FileText, Grid, History, PanelLeftClose, PanelLeftOpen, Settings, ShieldCheck, UploadCloud, Users, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../auth/authTypes';

type SidebarProps = { mobileOpen?: boolean; onClose?: () => void };
type NavItem = { label: string; path: string; icon: any; end?: boolean; roles?: UserRole[] };
type NavGroup = { label: string; icon: any; children: NavItem[]; roles?: UserRole[] };
type Section = NavItem | NavGroup;
const isGroup = (section: Section): section is NavGroup => 'children' in section;

const sections: Section[] = [
  { label: 'Dashboard', path: '/dashboard', icon: Grid, end: true },
  { 
    label: 'Provider Network', 
    icon: Building2, 
    children: [
      { label: 'Provider Directory', path: '/providers', icon: Users },
      { label: 'Register Provider', path: '/providers/new', icon: ClipboardList },
      { label: 'Credentialing', path: '/credentialing', icon: ShieldCheck },
      { label: 'Contracts', path: '/contracts', icon: FileText },
      { label: 'Performance Monitoring', path: '/performance', icon: Activity },
    ] 
  },
  { 
    label: 'Population & Enrolment', 
    icon: Users, 
    children: [
      { label: 'Enrolment Register', path: '/population/enrolment/register', icon: Users },
      { label: 'Upload Capitation List', path: '/population/enrolment/upload', icon: UploadCloud },
    ] 
  },
  { 
    label: 'Financial Management', 
    icon: FileChartColumn, 
    children: [
      { label: 'Claims/FFS Register', path: '/financial/register', icon: FileChartColumn },
      { label: 'Capitation Register', path: '/financial/capitation', icon: FileChartColumn },
      { label: 'Claims/FFS Upload', path: '/financial/upload', icon: UploadCloud },
      { label: 'Capitation Upload', path: '/financial/upload?type=capitation', icon: UploadCloud },
      { label: 'Manual Claims/FFS Entry', path: '/financial/manual', icon: ClipboardCheck },
      { label: 'Manual Capitation Entry', path: '/financial/manual/capitation', icon: ClipboardCheck },
      { label: 'Import History', path: '/financial/history', icon: ClipboardCheck },
    ] 
  },
  { 
    label: 'Quality & Compliance', 
    icon: ShieldCheck, 
    children: [
      { label: 'Inspections', path: '/inspections', icon: ClipboardCheck, end: true },
      { label: 'Accreditation', path: '/accreditations', icon: ClipboardList, end: true },
      { label: 'Complaints', path: '/complaints', icon: Bell },
    ] 
  },
  { 
    label: 'Communication', 
    icon: Bell, 
    children: [
      { label: 'Communication Centre', path: '/communication', icon: FileText },
    ] 
  },
  { 
    label: 'Administration', 
    icon: Settings, 
    roles: ['super-admin'],
    children: [
      { label: 'User Management', path: '/admin/users', icon: Users },
      { label: 'Audit Logs', path: '/admin/audit', icon: History },
      { label: 'Reports Centre', path: '/reports', icon: FileText },
      { label: 'System Settings', path: '/settings', icon: Settings },
    ] 
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

export default function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const { session } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => getInitialExpanded(location.pathname));
  
  const userRole = (session?.user?.role as UserRole) || 'network-officer';

  const visibleSections = useMemo(() => {
    return sections.filter(section => {
      if (section.roles && !section.roles.includes(userRole)) {
        return false;
      }
      return true;
    });
  }, [userRole]);

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

  return (
    <>
      {mobileOpen ? (
        <button 
          type="button" 
          aria-label="Close navigation" 
          onClick={onClose} 
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" 
        />
      ) : null}
      
      <aside className={`
        ${mobileOpen ? 'nmis-mobile-sheet fixed inset-y-0 left-0 z-50 flex max-w-[calc(100vw-0.75rem)]' : 'hidden h-full lg:flex'} 
        ${collapsed ? 'w-[4.75rem]' : 'w-[18rem]'} 
        shrink-0 border-r border-[#174f78] 
        bg-[linear-gradient(180deg,#0b4f82_0%,#083b63_100%)] 
        transition-[width] duration-300 ease-in-out
      `}>
        <div className="flex h-full w-full flex-col px-3 py-6">
          <div className="flex min-h-0 flex-1 flex-col space-y-6">
            {/* Branding Section */}
            <div className={`flex shrink-0 items-center ${collapsed ? 'justify-center' : 'justify-between'} gap-2 px-2`}>
              {!collapsed ? (
                <div className="flex flex-col">
                  <p className="text-[0.625rem] font-black uppercase tracking-[0.3em] text-white/40">ODCHC NMIS</p>
                  <h2 className="mt-1.5 text-[0.9375rem] font-bold leading-tight text-white">Network Management</h2>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-status-success animate-pulse" />
                    <p className="text-[0.6875rem] font-medium capitalize text-white/60">{userRole.replace('-', ' ')} Portal</p>
                  </div>
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 p-1.5">
                  <img src="/assets/odchc-seal.png" alt="Logo" className="h-full w-full object-contain" />
                </div>
              )}
              
              <button 
                type="button" 
                onClick={() => setCollapsed(value => !value)} 
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-white/10 text-white/60 transition-all hover:bg-white/10 hover:text-white"
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
              </button>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 scroll-smooth space-y-1 overflow-y-auto pb-10 custom-scrollbar" aria-label="Primary navigation">
              {visibleSections.map(section => {
                if (!isGroup(section)) {
                  return (
                    <NavLink 
                      key={section.label} 
                      to={section.path} 
                      end={section.end} 
                      onClick={onClose} 
                      title={collapsed ? section.label : undefined} 
                      className={({ isActive }) => `
                        flex items-center ${collapsed ? 'justify-center' : ''} gap-3 
                        rounded-control px-3 py-2.5 text-sm font-semibold transition-all duration-200
                        ${isActive 
                          ? 'bg-[#f7931e] text-white shadow-[0_4px_12px_-2px_rgba(247,147,30,0.5)]' 
                          : 'text-white/70 hover:bg-white/5 hover:text-white'}
                      `}
                    >
                      <section.icon size={18} className="shrink-0" />
                      {!collapsed ? <span>{section.label}</span> : null}
                    </NavLink>
                  );
                }

                const isActiveGroup = section.children.some(child => location.pathname.startsWith(child.path));
                
                return (
                  <div key={section.label} className="mb-1">
                    <button 
                      type="button" 
                      onClick={() => collapsed ? setCollapsed(false) : setExpanded(previous => ({ ...previous, [section.label]: !previous[section.label] }))} 
                      className={`
                        flex w-full items-center ${collapsed ? 'justify-center' : 'justify-between'} gap-3 
                        rounded-control px-3 py-2.5 text-left text-sm font-semibold transition-all duration-200
                        ${isActiveGroup ? 'text-[#f9b35a]' : 'text-white/70 hover:bg-white/5 hover:text-white'}
                      `}
                      title={collapsed ? section.label : undefined}
                      aria-expanded={collapsed ? false : expanded[section.label]}
                    >
                      <span className="flex items-center gap-3">
                        <section.icon size={18} className="shrink-0" />
                        {!collapsed ? section.label : null}
                      </span>
                      {!collapsed ? (
                        <ChevronDown 
                          size={14} 
                          className={`text-white/30 transition-transform duration-300 ${expanded[section.label] ? 'rotate-180' : ''}`} 
                        />
                      ) : null}
                    </button>
                    
                    {!collapsed && expanded[section.label] ? (
                      <div className="mt-0.5 space-y-0.5 px-2 pb-1">
                        {section.children.map(child => (
                          <NavLink 
                            key={`${section.label}-${child.label}`} 
                            to={child.path} 
                            onClick={onClose} 
                            className={({ isActive }) => `
                              flex items-center gap-3 rounded-control px-3 py-2 text-[0.8125rem] font-medium transition-all duration-200
                              ${isActive 
                                ? 'bg-[#f7931e]/90 text-white shadow-[0_4px_8px_-2px_rgba(247,147,30,0.3)]' 
                                : 'text-white/50 hover:bg-white/5 hover:text-white'}
                            `}
                          >
                            <child.icon size={16} className="shrink-0" />
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
          
          {/* User Profile Footer Removed per User Request */}
        </div>
      </aside>
    </>
  );
}
