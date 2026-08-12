import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helper, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && <label className="nmis-label">{label}</label>}
        <input
          ref={ref}
          className={`nmis-control ${error ? 'border-status-error focus:border-status-error focus:ring-status-error' : ''} ${className}`}
          {...props}
        />
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
