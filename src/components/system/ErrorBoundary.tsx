import { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, ShieldAlert } from 'lucide-react';
import Button from '../ui/Button';

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('NMIS application error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main
        className="flex min-h-screen items-center justify-center bg-brand-background px-5 py-12 sm:px-8"
        role="alert"
      >
        <section className="w-full max-w-lg rounded-panel border border-brand-border bg-brand-card p-6 shadow-panel sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-status-errorSoft text-status-error">
            <ShieldAlert size={24} aria-hidden="true" />
          </div>
          <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-brand-muted">NMIS system notice</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-brand-foreground sm:text-3xl">
            We could not load this page
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-brand-secondary">
            Something unexpected interrupted the application. Reload the page to restore your session and try again.
          </p>
          <Button type="button" onClick={this.handleReload} className="mt-7">
            <RefreshCw size={17} aria-hidden="true" />
            Reload application
          </Button>
        </section>
      </main>
    );
  }
}