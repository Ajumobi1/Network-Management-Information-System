import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { hasError: boolean; message: string };

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'An unexpected application error occurred.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('NMIS application render error:', error, info.componentStack);
  }

  private recover = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex min-h-dvh items-center justify-center bg-brand-background px-4 py-8">
        <section className="nmis-card w-full max-w-lg p-6 text-center sm:p-8" role="alert">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-status-error">Application error</p>
          <h1 className="mt-3 text-2xl font-black text-brand-foreground">NMIS needs to reload</h1>
          <p className="mt-3 text-sm leading-6 text-brand-secondary">
            The page encountered an unexpected error. Reloading is safe; saved drafts and server records are preserved by the application workflow.
          </p>
          <p className="mt-3 break-words rounded-control bg-brand-surface p-3 text-left text-xs text-brand-muted">{this.state.message}</p>
          <button type="button" onClick={this.recover} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-control bg-brand-blue px-5 py-2.5 text-sm font-black text-white transition hover:bg-brand-blue/90">
            Reload NMIS
          </button>
        </section>
      </main>
    );
  }
}
