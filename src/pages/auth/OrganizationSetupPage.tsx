import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';

const setupSchema = z.object({
  organizationName: z.string().min(1, 'Organization name is required'),
  themeColor: z.string().min(1, 'Theme color is required'),
  branches: z.string().min(1, 'At least one branch is required'),
  adminName: z.string().min(1, 'Admin name is required'),
  adminEmail: z.string().min(1, 'Admin email is required').email('Enter a valid email'),
  adminPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

type SetupFormValues = z.infer<typeof setupSchema>;

export default function OrganizationSetupPage() {
  const [complete, setComplete] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      organizationName: '',
      themeColor: '#0F3C91',
      branches: '',
      adminName: '',
      adminEmail: '',
      adminPassword: '',
    },
  });

  const onSubmit = () => {
    setComplete(true);
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="grid gap-12 md:grid-cols-[1.05fr_0.95fr]">
          <div className="bg-gradient-to-br from-[#0F3C91] to-[#111D42] px-10 py-12 text-white md:px-14 md:py-16">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200/80">First-time setup</p>
            <h1 className="mt-8 text-4xl font-semibold leading-tight">Configure your NMIS organization</h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-200/90">
              Create your enterprise profile, upload branding, and create the first Super Admin account to secure the platform.
            </p>
          </div>

          <div className="px-8 py-10 md:px-12 md:py-14">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Organization setup</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">Wizard for first-run configuration</h2>
            </div>

            {complete ? (
              <div className="space-y-6 rounded-3xl border border-slate-200 bg-slate-50 p-8 text-slate-700">
                <h3 className="text-2xl font-semibold text-slate-900">Setup complete</h3>
                <p className="text-sm">Your organization profile is configured. The login page is now ready for your Super Admin to sign in.</p>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                <div>
                  <label className="text-sm font-medium text-slate-700">Organization name</label>
                  <input
                    type="text"
                    {...register('organizationName')}
                    className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0F3C91] focus:ring-2 focus:ring-sky-100"
                    placeholder="Example Health Systems"
                  />
                  {errors.organizationName && <p className="mt-2 text-sm text-rose-600">{errors.organizationName.message}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Theme accent color</label>
                  <input
                    type="color"
                    {...register('themeColor')}
                    className="mt-3 h-12 w-20 rounded-3xl border border-slate-200 bg-white px-4 py-3"
                  />
                  {errors.themeColor && <p className="mt-2 text-sm text-rose-600">{errors.themeColor.message}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Branches / states</label>
                  <input
                    type="text"
                    {...register('branches')}
                    className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0F3C91] focus:ring-2 focus:ring-sky-100"
                    placeholder="e.g. Texas, California, New York"
                  />
                  {errors.branches && <p className="mt-2 text-sm text-rose-600">{errors.branches.message}</p>}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Super Admin name</label>
                    <input
                      type="text"
                      {...register('adminName')}
                      className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0F3C91] focus:ring-2 focus:ring-sky-100"
                      placeholder="Admin name"
                    />
                    {errors.adminName && <p className="mt-2 text-sm text-rose-600">{errors.adminName.message}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Super Admin email</label>
                    <input
                      type="email"
                      {...register('adminEmail')}
                      className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0F3C91] focus:ring-2 focus:ring-sky-100"
                      placeholder="admin@example.com"
                    />
                    {errors.adminEmail && <p className="mt-2 text-sm text-rose-600">{errors.adminEmail.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Super Admin password</label>
                  <input
                    type="password"
                    {...register('adminPassword')}
                    className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0F3C91] focus:ring-2 focus:ring-sky-100"
                    placeholder="Choose a strong password"
                  />
                  {errors.adminPassword && <p className="mt-2 text-sm text-rose-600">{errors.adminPassword.message}</p>}
                </div>

                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-3xl bg-[#0F3C91] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-[#0B2E74]"
                >
                  Complete setup
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
