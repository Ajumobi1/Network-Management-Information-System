import { useMemo, useState, useEffect } from 'react';
import { 
  UserPlus, ShieldCheck, Lock, Unlock, UserMinus, 
  History, MoreVertical, Mail, Search, ShieldAlert,
  UserCheck, AlertTriangle, Users, Clock, Edit2, X, Save,
  Eye, EyeOff
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserRole, AuthUser } from '../../auth/authTypes';
import { authService } from '../../services/auth/authService';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import PageHeader from '../../components/ui/PageHeader';
import Select from '../../components/ui/Select';
import { SectionHeader } from '../../components/ui/LayoutComponents';
import { LoadingState, ErrorState } from '../../components/ui/FeedbackStates';

const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
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

const initialUsers: ManagedUser[] = [];

const roleOptions = [
  { label: 'Network Officer', value: 'network-officer' },
  { label: 'Super Admin', value: 'super-admin' },
];

export default function ManageUsersPage() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    const result = await authService.listUsers();
    if (result.success) {
      setUsers(result.data);
    } else {
      setError(result.error.message);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
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

  const onSubmit = async (values: UserFormValues) => {
    setIsProvisioning(true);
    const result = await authService.provisionUser(values.name, values.email, values.password, values.role as UserRole);
    setIsProvisioning(false);
    
    if (result.success) {
      setMessage(`Account for ${values.name} has been provisioned. They can now login with their credentials.`);
      reset();
      fetchUsers();
    } else {
      setMessage(`Error: ${result.error.message}`);
    }
    
    setTimeout(() => setMessage(''), 5000);
  };

  const handleResetPassword = async (email: string) => {
    if (confirm(`Are you sure you want to trigger a password reset for ${email}?`)) {
      const result = await authService.forgotPassword(email);
      if (result.success) {
        setMessage(`A password reset link has been sent to ${email}.`);
      } else {
        setMessage(`Error: ${result.error.message}`);
      }
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const updateUserStatus = async (id: string, newStatus: 'active' | 'suspended' | 'locked') => {
    const result = await authService.updateUserStatus(id, newStatus);
    if (result.success) {
      setMessage(`Account status updated to ${newStatus}.`);
      fetchUsers();
    } else {
      setMessage(`Error: ${result.error.message}`);
    }
    setTimeout(() => setMessage(''), 5000);
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      const result = await authService.deleteUser(id);
      if (result.success) {
        setMessage('User deleted successfully.');
        fetchUsers();
      } else {
        setMessage(`Error: ${result.error.message}`);
      }
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    // For simplicity, we'll just update status and role if needed
    // In a real app, you'd have an updateUser RPC
    setMessage(`User update functionality is linked to account status controls.`);
    setEditingUser(null);
    setTimeout(() => setMessage(''), 5000);
  };

  if (isLoading) return <LoadingState title="Loading identity registry..." />;
  if (error) return <ErrorState title="User registry unavailable" description={error} action={{ label: 'Retry', onClick: fetchUsers }} />;

  return (
    <main className="nmis-page">
      <PageHeader
        eyebrow="Administration"
        title="Identity & Access Management"
        subtitle="Manage administrative accounts, control system-wide access levels, and monitor security-critical user activity."
        actions={
          <Button variant="secondary" onClick={() => alert('Opening security audit logs...')}><History size={16} /> Security Audit</Button>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
        <div className="space-y-6">
          {/* User Register */}
          <Card className="p-0 overflow-hidden">
            <div className="border-b border-brand-border bg-brand-soft/50 px-6 py-4 flex items-center justify-between">
              <SectionHeader title="Active Users" subtitle="Manage existing administrative accounts" />
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
                            {user.role?.replace('-', ' ') || 'No Role'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <Badge variant={user.status === 'active' ? 'success' : user.status === 'suspended' ? 'warning' : 'error'}>
                          {user.status || (user.isActive ? 'active' : 'inactive')}
                        </Badge>
                      </td>
                      <td>
                        <div className="flex items-center gap-2 text-brand-muted">
                          <Clock size={12} />
                          <span className="text-xs font-medium">Recently</span>
                        </div>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => setEditingUser(user)}
                            className="p-2 rounded-lg text-brand-muted hover:bg-brand-soft transition-colors"
                            title="Edit Profile"
                          >
                            <Edit2 size={16} />
                          </button>
                          {user.status === 'active' || user.isActive ? (
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
                          <button 
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 rounded-lg text-status-error hover:bg-status-errorSoft transition-colors"
                            title="Delete User"
                          >
                            <UserMinus size={16} />
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
            <SectionHeader title="Provision Account" subtitle="Register new officer credentials" />
            <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <Input label="Full Name" placeholder="Enter full name" error={errors.name?.message} {...register('name')} />
              <Input label="Email address" type="email" placeholder="user@example.com" error={errors.email?.message} {...register('email')} />
              <div className="relative">
                <Input 
                  label="Initial Password" 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="••••••••" 
                  error={errors.password?.message} 
                  {...register('password')} 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[38px] text-brand-subtle hover:text-brand-secondary transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <Select label="Role" options={roleOptions} error={errors.role?.message} {...register('role')} />
              
              <div className="pt-4 border-t border-brand-divider">
                <div className="flex items-center gap-3 mb-4">
                  <input type="checkbox" {...register('isActive')} className="h-4 w-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue" />
                  <span className="text-sm text-slate-700">Activate user immediately</span>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-brand-soft/50 text-brand-secondary">
                  <ShieldAlert size={16} className="mt-0.5 shrink-0" />
                  <p className="text-[11px] leading-relaxed">
                    Administrators are responsible for secure credential distribution. Users should be prompted to change passwords upon first login.
                  </p>
                </div>
                <Button type="submit" className="mt-4 w-full gap-2 h-11" disabled={isProvisioning}>
                  <UserPlus size={18} /> {isProvisioning ? 'Provisioning...' : 'Provision Account'}
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
                <span className="text-xs font-black text-status-error">{users.filter(u => u.status === 'locked').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-brand-muted">Suspended Accounts</span>
                <span className="text-xs font-black text-brand-orange">{users.filter(u => u.status === 'suspended').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-brand-muted">Admin Privileges</span>
                <span className="text-xs font-black text-brand-foreground">{users.filter(u => u.role === 'super-admin').length}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-brand-divider pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-brand-blue/10 p-2 text-brand-blue">
                  <Edit2 size={20} />
                </div>
                <h2 className="text-xl font-black text-brand-foreground">Edit User Profile</h2>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-brand-muted hover:text-brand-foreground">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleEditSave} className="space-y-4">
              <Input 
                label="Full Name" 
                value={editingUser.name} 
                onChange={e => setEditingUser({ ...editingUser, name: e.target.value })} 
              />
              <Input 
                label="Email Address" 
                type="email" 
                value={editingUser.email} 
                onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} 
              />
              <Select 
                label="Role" 
                options={roleOptions} 
                value={editingUser.role || ''} 
                onChange={e => setEditingUser({ ...editingUser, role: e.target.value as UserRole })} 
              />
              
              <div className="pt-6 flex justify-end gap-3 border-t border-brand-divider">
                <Button variant="secondary" onClick={() => setEditingUser(null)}>Cancel</Button>
                <Button type="submit" className="gap-2">
                  <Save size={18} /> Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </main>
  );
}
