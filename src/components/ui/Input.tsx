import { InputHTMLAttributes, forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helper, error, className = '', type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full space-y-1.5">
        {label && <label className="nmis-label">{label}</label>}
        <div className="relative">
          <input
            ref={ref}
            type={inputType}
            className={`nmis-control ${error ? 'border-status-error focus:border-status-error focus:ring-status-error' : ''} ${isPassword ? 'pr-12' : ''} ${className}`}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-brand-muted hover:bg-brand-soft hover:text-brand-blue transition-all"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
        {error ? (
          <p className="mt-1.5 text-xs text-status-error">{error}</p>
        ) : helper ? (
          <p className="nmis-helper">{helper}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
