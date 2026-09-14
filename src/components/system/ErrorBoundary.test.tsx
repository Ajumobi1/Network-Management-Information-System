import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ErrorBoundary from './ErrorBoundary';

function BrokenComponent() {
  throw new Error('test render failure');
}

describe('ErrorBoundary', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders its children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <p>Inspection dashboard</p>
      </ErrorBoundary>,
    );

    expect(screen.getByText('Inspection dashboard')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /could not load this page/i })).not.toBeInTheDocument();
  });

  it('shows a recovery screen when a child throws during render', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /could not load this page/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reload application/i })).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalledWith(
      'NMIS application error:',
      expect.any(Error),
      expect.any(Object),
    );
  });
});