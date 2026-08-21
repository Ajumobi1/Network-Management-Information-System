import { useMemo, useState } from 'react';
import { UserPlus } from 'lucide-react';
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
  isActive: boolean;
};

const initialUsers: ManagedUser[] = [
  { id: '1', name: 'Daphne Harrison', email: 'daphne@nmis.org', role: 'network-officer', isActive: true },
  { id: '2', name: 'Peter Miles', email: 'peter@nmis.org', role: 'network-officer', isActive: true },
  { id: '3', name: 'Aisha Quinn', email: 'aisha@nmis.org', role: 'network-officer', isActive: false },
];

const roleOptions = [
  { label: 'Network Officer', value: 'network-officer' },
  { label: 'Super Admin', value: 'super-admin' },
];

export default function ManageUsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>(initialUsers);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const selectedUser = useMemo(() => users.find(user => user.id === selectedUserId) ?? null, [selectedUserId, users]);

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
      setMessage('Trusted user provisioning is pending Phase 3B staging verification. No account was created.');
      return;
    }

    const newUser: ManagedUser = {
      id: `${Date.now()}`,
      name: values.name,
      email: values.email,
      role: values.role as UserRole,
      isActive: values.isActive,
    };
    setUsers(previous => [newUser, ...previous]);
    setMessage(`${values.name} was added successfully. This mock-mode invitation preview does not send an email.`);
    reset();
  };

  const toggleUserActive = (id: string) => {
    if (!useMockData) {
      setMessage('Trusted account management is pending Phase 3B staging verification. No account was changed.');
      return;
    }

    setUsers(previous => previous.map(user => (user.id === id ? { ...user, isActive: !user.isActive } : user)));
    setMessage('User status updated in the mock-mode preview.');
  };

  return (
    <main className="nmis-page">
      <PageHeader
        eyebrow="Administration"
        title="Create and manage users"
        subtitle="Create local user-access previews, assign roles, and review activation status. Production invitation delivery is not enabled in mock mode."
      />

      <Card>
        <SectionHeader title="Account setup" subtitle="Create a user invitation preview" />
        <form className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(17rem,0.8fr)]" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Name" placeholder="Enter full name" error={errors.name?.message} {...register('name')} />
            <Input label="Email address" type="email" placeholder="user@example.com" error={errors.email?.message} {...register('email')} />
            <Select label="Role" options={roleOptions} error={errors.role?.message} {...register('role')} />
            <label className="flex min-h-11 items-center gap-3 rounded-control border border-brand-divider bg-brand-surface px-4 text-sm font-medium text-brand-secondary">
              <input type="checkbox" {...register('isActive')} className="h-4 w-4 rounded border-brand-border text-brand-blue focus:ring-brand-blue" />
              Activate user
            </label>
          </div>

          <aside className="rounded-card border border-brand-divider bg-brand-surface p-5">
            <Badge variant="default" size="sm">{useMockData ? 'Mock mode' : 'Secure workflow pending'}</Badge>
            <p className="mt-3 font-semibold text-brand-foreground">{useMockData ? 'Invitation preview' : 'Trusted administration required'}</p>
            <p className="mt-2 text-sm leading-6 text-brand-muted">{useMockData ? 'A local user record is added for interface validation. Email dispatch and persistent user provisioning require a configured production workflow.' : 'Account invitations, role changes and activation remain disabled until the audited Phase 3B trusted administration workflow is verified.'}</p>
            <Button type="submit" className="mt-5 w-full gap-2" disabled={!useMockData}><UserPlus size={16} /> Create user invitation</Button>
          </aside>
        </form>

        {message ? <div className="mt-5 rounded-card border border-brand-divider bg-brand-surface p-4 text-sm text-brand-secondary">{message}</div> : null}
      </Card>

      <Card>
        <SectionHeader title="Manage existing accounts" subtitle={`${users.filter(user => user.isActive).length} active users in this mock-mode preview`} />
        <div className="nmis-table-wrap mt-5">
          <div className="overflow-x-auto">
            <table className="nmis-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="font-semibold text-brand-foreground">{user.name}</td>
                    <td>{user.email}</td>
                    <td className="capitalize">{user.role.replace('-', ' ')}</td>
                    <td><Badge variant={user.isActive ? 'success' : 'error'}>{user.isActive ? 'Active' : 'Inactive'}</Badge></td>
                    <td className="text-right"><Button type="button" variant="secondary" size="sm" disabled={!useMockData} onClick={() => { setSelectedUserId(user.id); toggleUserActive(user.id); }}>{user.isActive ? 'Deactivate' : 'Activate'}</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {selectedUser ? <p className="sr-only">Selected user: {selectedUser.name}</p> : null}
      </Card>
    </main>
  );
}
