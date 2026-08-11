import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserRole } from '../../auth/authTypes';

const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  role: z.enum(['network-officer', 'inspector', 'finance', 'claims', 'customer-service']),
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
  { id: '2', name: 'Peter Miles', email: 'peter@nmis.org', role: 'claims', isActive: true },
  { id: '3', name: 'Aisha Quinn', email: 'aisha@nmis.org', role: 'inspector', isActive: false },
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
    const newUser: ManagedUser = {
      id: `${Date.now()}`,
      name: values.name,
      email: values.email,
      role: values.role,
      isActive: values.isActive,
    };
    setUsers(prev => [newUser, ...prev]);
    setMessage(`${values.name} was added successfully. Invitation workflow can be completed via email.`);
    reset();
  };

  const toggleUserActive = (id: string) => {
    setUsers(prev => prev.map(user => (user.id === id ? { ...user, isActive: !user.isActive } : user)));
    setMessage('User status updated.');
  };

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">User management</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Create and manage users</h1>
          </div>
          <p className="text-sm text-slate-500">Super Admins can create accounts, assign roles, and activate or deactivate users.</p>
        </div>

        <form className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-700">Name</label>
              <input
                type="text"
                {...register('name')}
                className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0F3C91] focus:ring-2 focus:ring-sky-100"
                placeholder="Enter full name"
              />
              {errors.name && <p className="mt-2 text-sm text-rose-600">{errors.name.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Email address</label>
              <input
                type="email"
                {...register('email')}
                className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0F3C91] focus:ring-2 focus:ring-sky-100"
                placeholder="user@example.com"
              />
              {errors.email && <p className="mt-2 text-sm text-rose-600">{errors.email.message}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Role</label>
                <select
                  {...register('role')}
                  className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0F3C91] focus:ring-2 focus:ring-sky-100"
                >
                  <option value="network-officer">Network Officer</option>
                  <option value="inspector">Inspector</option>
                  <option value="finance">Finance</option>
                  <option value="claims">Claims</option>
                  <option value="customer-service">Customer Service</option>
                </select>
              </div>

              <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                <input type="checkbox" {...register('isActive')} className="h-4 w-4 rounded border-slate-300 text-[#0F3C91] focus:ring-[#0F3C91]" />
                <span className="text-sm text-slate-700">Activate user</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm font-semibold text-slate-700">Complete account setup</p>
            <p className="text-sm text-slate-500">A secure invite email will be sent to the new user. Provider invitations are generated through the provider workflow.</p>
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-3xl bg-[#0F3C91] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-[#0B2E74]"
            >
              Create user invitation
            </button>
          </div>
        </form>

        {message && <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">{message}</div>}
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Active users</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Manage existing accounts</h2>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200">
          <table className="w-full border-separate border-spacing-0 text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {users.map(user => (
                <tr key={user.id} className="border-t border-slate-200">
                  <td className="px-6 py-4 text-slate-900">{user.name}</td>
                  <td className="px-6 py-4 text-slate-600">{user.email}</td>
                  <td className="px-6 py-4 text-slate-600">{user.role.replace('-', ' ')}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => toggleUserActive(user.id)}
                      className="rounded-2xl bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
