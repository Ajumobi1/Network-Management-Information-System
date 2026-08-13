import PageHeader from '../components/PageHeader';
import { ShieldCheck, Users, Lock, History, Settings as SettingsIcon } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function SettingsPage() {
  const adminStats = [
    { label: 'System Users', value: '0', icon: <Users size={20} /> },
    { label: 'Security Roles', value: '0', icon: <Lock size={20} /> },
    { label: 'Audit Logs', value: '0', icon: <History size={20} /> },
  ];

  const tools = [
    { name: 'User Management', description: 'Create and manage administrative accounts and roles.', link: '/settings/users' },
    { name: 'Audit Viewer', description: 'Inspect system-wide activity logs and security events.', link: '/settings/audit' },
    { name: 'System Config', description: 'Manage global application settings and constants.', link: '#' },
    { name: 'Data Management', description: 'Tools for manual data correction and maintenance.', link: '#' },
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="System administration"
          description="Configure users, roles, notifications, and audit settings for the NMIS platform."
          actions={[{ label: 'Manage roles (Coming Soon)', disabled: true }]}
        />

        <div className="grid gap-6 md:grid-cols-3">
          {adminStats.map(stat => (
            <Card key={stat.label} className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-brand-blue/10 text-brand-blue">
                {stat.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
              </div>
            </Card>
          ))}
        </div>

        <Card>
          <div className="flex items-center gap-2 text-brand-blue mb-6">
            <ShieldCheck size={20} />
            <h2 className="text-lg font-semibold text-slate-900 uppercase tracking-widest">Administrative Tools</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {tools.map(tool => (
              <div key={tool.name} className="flex flex-col p-5 rounded-3xl border border-slate-200 bg-slate-50 hover:border-brand-blue/30 transition-colors group">
                <h3 className="font-semibold text-slate-900 group-hover:text-brand-blue transition-colors">{tool.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{tool.description}</p>
                <div className="mt-4 flex justify-end">
                  <Button variant="ghost" size="sm" className="gap-2" disabled={tool.link === '#'}>
                    Open <SettingsIcon size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </main>
  );
}
