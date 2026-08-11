import { InputHTMLAttributes } from 'react';

export default function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const baseClasses =
    'w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition duration-200 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15';

  return <input {...props} className={`${baseClasses} ${props.className ?? ''}`.trim()} />;
}
