import { ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider, type QueryClientConfig } from '@tanstack/react-query';
import { ThemeProvider } from './ThemeProvider';
import { AuthProvider } from '../contexts/AuthContext';

const queryClientOptions: QueryClientConfig = {
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 10,
      gcTime: 1000 * 60 * 60 * 24, // 24 hours persistence in memory
      networkMode: 'offlineFirst',
    },
    mutations: {
      // Mutations must not be retried automatically: a retried write can duplicate a
      // provider, financial record, enrolment, or inspection submission.
      networkMode: 'offlineFirst',
      retry: 0,
    },
  },
};

export function RootProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient(queryClientOptions));

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
