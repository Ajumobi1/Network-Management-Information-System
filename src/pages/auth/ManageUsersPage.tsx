import { useMemo, useState } from 'react';
import { 
  UserPlus, ShieldCheck, Lock, Unlock, UserMinus, 
  History, MoreVertical, Mail, Search, ShieldAlert,
  UserCheck, AlertTriangle
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserRole } from '../../auth/authTypes';
import { useMockData } from '../../repositories/common';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import PageHeader from '../../components/ui/PageHeader';
import Select from '../../components/ui/Select';
import { SectionHeader } from '../../components/ui/LayoutComponents';

const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  role: z.enum(['network-officer', 'super-admin']),
  isActive: z.boolean(),
});

type UserFormValues = z.infer<typeof userSchema>;

type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'suspended' | 'locked';
  lastLogin: string;
};

const initialUsers: ManagedUser[] = [
  { id: '1', name: 'Daphne Harrison', email: 'daphne@nmis.org', role: 'network-officer', status: 'active', lastLogin: '2026-08-20 14:30' },
  { id: '2', name: 'Peter Miles', email: 'peter@nmis.org', role: 'network-officer', status: 'active', lastLogin: '2026-08-21 09:15' },
  { id: '3', name: 'Aisha Quinn', email: 'aisha@nmis.org', role: 'network-officer', status: 'suspended', lastLogin: '2026-08-15 11:00' },
  { id: '4', name: 'Admin User', email: 'admin@nmis.org', role: 'super-admin', status: 'active', lastLogin: '2026-08-21 16:45' },
];

const roleOptions = [
  { label: 'Network Officer', value: 'network-officer' },
  { label: 'Super Admin', value: 'super-admin' },
];

export default function ManageUsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>(initialUsers);
  const [searchTerm, setSearch] = useState('');
  const [message, setMessage] = useState('');

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'network-officer',
      isActive: true,
    },
  });

  const onSubmit = (values: UserFormValues) => {
    if (!useMockData) {
      setMessage('Trusted user provisioning is pending Phase 3B staging verification.');
      return;
    }

    const newUser: ManagedUser = {
      id: `${Date.now()}`,
      name: values.name,
      email: values.email,
      role: values.role as UserRole,
      status: values.isActive ? 'active' : 'suspended',
      lastLogin: 'Never',
    };
    setUsers(previous => [newUser, ...previous]);
    setMessage(`${values.name} was added successfully.`);
    reset();
  };

  const updateUserStatus = (id: string, newStatus: 'active' | 'suspended' | 'locked') => {
    setUsers(previous => previous.map(user => (user.id === id ? { ...user, status: newStatus } : user)));
    setMessage(`User account status updated to ${newStatus}.`);
  };

  return (
    <main className="nmis-page">
      <PageHeader
        eyebrow="Administration"
        title="Identity & Access Management"
        subtitle="Manage administrative accounts, control system-wide access levels, and monitor security-critical user activity."
        actions={[
          { label: 'Security Audit', icon: <History size={16} />, variant: 'secondary', onClick: () => alert('Opening security audit logs...') }
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
        <div className="space-y-6">
          {/* User Register */}
          <Card className="p-0 overflow-hidden">
            <div className="border-b border-brand-border bg-brand-soft/50 px-6 py-4 flex items-center justify-between">
              <SectionHeader title="System Users" subtitle="Directory of authorized administrative personnel" />
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-subtle" size={16} />
                <input 
                  type="text" 
                  placeholder="Search users..." 
                  className="nmis-control pl-10 h-9 text-xs"
                  value={searchTerm}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="nmis-table-wrap">
              <table className="nmis-table">
                <thead>
                  <tr>
                    <th>User Identity</th>
                    <th>System Role</th>
                    <th>Account Status</th>
                    <th>Last Activity</th>
                    <th className="text-right">Access Controls</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-black text-xs">
                            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-brand-foreground">{user.name}</p>
                            <p className="text-xs font-medium text-brand-muted">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          {user.role === 'super-admin' ? <ShieldCheck size={14} className="text-brand-orange" /> : <Users size={14} className="text-brand-blue" />}
                          <span className="text-xs font-black uppercase tracking-widest text-brand-secondary">
                            {user.role.replace('-', ' ')}
                          </span>
                        </div>
                      </td>
                      <td>
                        <Badge variant={user.status === 'active' ? 'success' : user.status === 'suspended' ? 'warning' : 'error'}>
                          {user.status}
                        </Badge>
                      </td>
                      <td>
                        <div className="flex items-center gap-2 text-brand-muted">
                          <Clock size={12} />
                          <span className="text-xs font-medium">{user.lastLogin}</span>
                        </div>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          {user.status === 'active' ? (
                            <button 
                              onClick={() => updateUserStatus(user.id, 'suspended')}
                              className="p-2 rounded-lg text-brand-orange hover:bg-brand-orange/10 transition-colors"
                              title="Suspend Account"
                            >
                              <UserMinus size={16} />
                            </button>
                          ) : (
                            <button 
                              onClick={() => updateUserStatus(user.id, 'active')}
                              className="p-2 rounded-lg text-status-success hover:bg-status-successSoft transition-colors"
                              title="Activate Account"
                            >
                              <UserCheck size={16} />
                            </button>
                          )}
                          <button 
                            onClick={() => updateUserStatus(user.id, user.status === 'locked' ? 'active' : 'locked')}
                            className={`p-2 rounded-lg transition-colors ${user.status === 'locked' ? 'text-status-success hover:bg-status-successSoft' : 'text-status-error hover:bg-status-errorSoft'}`}
                            title={user.status === 'locked' ? 'Unlock Account' : 'Lock Account'}
                          >
                            {user.status === 'locked' ? <Unlock size={16} /> : <Lock size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Add User Form */}
          <Card>
            <SectionHeader title="Provision Account" subtitle="Invite new officer to the platform" />
            <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <Input label="Full Name" placeholder="e.g. John Doe" error={errors.name?.message} {...register('name')} />
              <Input label="Official Email" type="email" placeholder="officer@odchc.gov.ng" error={errors.email?.message} {...register('email')} />
              <Select label="Platform Role" options={roleOptions} error={errors.role?.message} {...register('role')} />
              
              <div className="pt-4 border-t border-brand-divider">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-brand-soft/50 text-brand-secondary">
                  <ShieldAlert size={16} className="mt-0.5 shrink-0" />
                  <p className="text-[11px] leading-relaxed">
                    New accounts are created with a temporary password sent via email. Users must change their password upon first login.
                  </p>
                </div>
                <Button type="submit" className="mt-4 w-full gap-2 h-11">
                  <UserPlus size={18} /> Provision Account
                </Button>
              </div>
            </form>
            {message ? (
              <div className="mt-4 p-3 rounded-xl bg-brand-blue/5 border border-brand-blue/20 text-xs font-bold text-brand-blue animate-in fade-in">
                {message}
              </div>
            ) : null}
          </Card>

          {/* Security Stats */}
          <Card className="bg-brand-orange/5 border-brand-orange/20">
            <div className="flex items-center gap-3 text-brand-orange mb-4">
              <AlertTriangle size={20} />
              <h3 className="font-black uppercase tracking-widest text-xs">Security Alert</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-brand-muted">Locked Accounts</span>
                <span className="text-xs font-black text-status-error">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-brand-muted">Suspended Accounts</span>
                <span className="text-xs font-black text-brand-orange">1</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-brand-muted">Admin Privileges</span>
                <span className="text-xs font-black text-brand-foreground">1</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
