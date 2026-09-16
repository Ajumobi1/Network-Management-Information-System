import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import AppErrorBoundary from './AppErrorBoundary';

function BrokenChild(): never {
  throw new Error('test render failure');
}

describe('AppErrorBoundary', () => {
  it('shows a recoverable error screen when a child fails to render', async () => {
    const reload = vi.fn();
    vi.stubGlobal('location', { reload });

    render(
      <AppErrorBoundary>
        <BrokenChild />
      </AppErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('NMIS needs to reload');
    expect(screen.getByText('test render failure')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Reload NMIS' }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
