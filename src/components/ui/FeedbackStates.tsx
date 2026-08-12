import { AlertCircle, FileQuestion, Loader2, RefreshCcw } from 'lucide-react';
import Button from './Button';
import Card from './Card';

type FeedbackProps = {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
};

export function LoadingState({ title = 'Loading data...', description = 'Please wait while we fetch the requested information.', className = '' }: Partial<FeedbackProps>) {
  return (
    <div className={`flex min-h-[300px] flex-col items-center justify-center rounded-panel border border-brand-border bg-brand-surface/50 p-12 text-center ${className}`}>
      <Loader2 className="h-10 w-10 animate-spin text-brand-blue" />
      <h3 className="mt-6 text-lg font-bold text-brand-foreground">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-brand-secondary">{description}</p>
    </div>
  );
}

export function EmptyState({ title, description, action, className = '' }: FeedbackProps) {
  return (
    <div className={`flex min-h-[300px] flex-col items-center justify-center rounded-panel border border-dashed border-brand-border bg-brand-surface/30 p-12 text-center ${className}`}>
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft text-brand-blue">
        <FileQuestion className="h-8 w-8" />
      </div>
      <h3 className="mt-6 text-lg font-bold text-brand-foreground">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-brand-secondary">{description}</p>}
      {action && (
        <Button variant="secondary" className="mt-8" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

export function ErrorState({ title, description = 'An unexpected error occurred while processing your request.', action, className = '' }: FeedbackProps) {
  return (
    <div className={`flex min-h-[300px] flex-col items-center justify-center rounded-panel border border-status-error/10 bg-status-errorSoft/30 p-12 text-center ${className}`}>
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-status-errorSoft text-status-error">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h3 className="mt-6 text-lg font-bold text-status-error">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-status-error/80">{description}</p>
      {action && (
        <Button variant="secondary" className="mt-8 border-status-error/20 text-status-error hover:bg-status-errorSoft" onClick={action.onClick}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          {action.label}
        </Button>
      )}
    </div>
  );
}

export function TableLoadingState({ columns = 5, rows = 5 }: { columns?: number; rows?: number }) {
  return (
    <div className="nmis-table-wrap">
      <table className="nmis-table">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i}><div className="h-3 w-20 animate-pulse rounded bg-brand-divider" /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              {Array.from({ length: columns }).map((_, j) => (
                <td key={j}><div className="h-4 w-full animate-pulse rounded bg-brand-divider" /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
