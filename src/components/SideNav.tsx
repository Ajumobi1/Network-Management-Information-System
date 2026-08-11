import { BuildingLibraryIcon, ChatBubbleLeftRightIcon, ChartBarIcon, ClipboardDocumentListIcon, Cog6ToothIcon, CreditCardIcon, CurrencyDollarIcon, ExclamationTriangleIcon, ShieldCheckIcon, SparklesIcon, UserGroupIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const sections = [
  { label: 'Dashboard', path: '/dashboard', icon: ChartBarIcon },
  { label: 'Providers', path: '/providers', icon: BuildingLibraryIcon },
  { label: 'Credentialing', path: '/credentialing', icon: ShieldCheckIcon },
  { label: 'Contracts', path: '/contracts', icon: CreditCardIcon },
  { label: 'Capitation', path: '/capitation', icon: CurrencyDollarIcon },
  { label: 'Inspections', path: '/inspections', icon: ClipboardDocumentListIcon },
  { label: 'Performance', path: '/performance', icon: ChartBarIcon },
  { label: 'Reports', path: '/reports', icon: SparklesIcon },
  { label: 'Communication', path: '/communication', icon: ChatBubbleLeftRightIcon },
  { label: 'Complaints', path: '/complaints', icon: ExclamationTriangleIcon },
  { label: 'Settings', path: '/settings', icon: Cog6ToothIcon },
];

const adminSections = [
  { label: 'Manage users', path: '/admin/users', icon: UserGroupIcon },
  { label: 'Invite provider', path: '/admin/invite-provider', icon: UserPlusIcon },
];

function SideNav() {
  const { session } = useAuth();
  const isSuperAdmin = session?.user.role === 'super-admin';

  return (
    <aside className="hidden w-80 shrink-0 xl:block">
      <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Navigation</p>
          <h2 className="text-xl font-semibold text-slate-900">NMIS Workspace</h2>
        </div>

        <nav className="space-y-2">
          {sections.map(section => {
            const Icon = section.icon;
            return (
              <NavLink
                key={section.path}
                to={section.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-semibold transition ${
                    isActive ? 'bg-[#0F3C91] text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                {section.label}
              </NavLink>
            );
          })}

          {isSuperAdmin && (
            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 text-xs uppercase tracking-[0.3em] text-slate-400">Admin Hub</p>
              <div className="space-y-2">
                {adminSections.map(section => {
                  const Icon = section.icon;
                  return (
                    <NavLink
                      key={section.path}
                      to={section.path}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-semibold transition ${
                          isActive ? 'bg-[#0F3C91] text-white' : 'text-slate-700 hover:bg-slate-100'
                        }`
                      }
                    >
                      <Icon className="h-5 w-5" />
                      {section.label}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          )}
        </nav>
      </div>
    </aside>
  );
}

export default SideNav;
