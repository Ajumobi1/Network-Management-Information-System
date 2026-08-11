import { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand-blue text-white hover:bg-brand-navy focus:ring-brand-blue/40',
  secondary: 'bg-slate-50 text-slate-900 hover:bg-slate-100 focus:ring-slate-200',
  danger: 'bg-rose-500 text-white hover:bg-rose-600 focus:ring-rose-400/40',
  outline: 'border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 focus:ring-slate-200',
  ghost: 'bg-transparent text-slate-900 hover:bg-slate-100 focus:ring-slate-200',
};

export default function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-3xl px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 ${variantClasses[variant]} ${className}`.trim()}
    />
  );
}
