const requestedMockMode = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export const isDevelopmentBuild = Boolean(import.meta.env.DEV);
export const useMockData = isDevelopmentBuild && requestedMockMode;

export const supabaseRuntimeConfig = {
  url: import.meta.env.VITE_SUPABASE_URL?.trim() ?? '',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '',
};

export function getRuntimeConfigurationError(): string | null {
  if (!isDevelopmentBuild && requestedMockMode) {
    return 'Mock mode is restricted to development builds.';
  }

  if (!useMockData && (!supabaseRuntimeConfig.url || !supabaseRuntimeConfig.anonKey)) {
    return 'Supabase runtime configuration is required when mock mode is disabled.';
  }

  return null;
}

export function assertLiveRuntimeConfiguration(): void {
  const message = getRuntimeConfigurationError();
  if (message) throw new Error(message);
}

export function isLiveRuntime(): boolean {
  return !useMockData;
}

export const inertSupabaseRuntimeConfig = {
  url: 'https://inert.nmis.invalid',
  anonKey: 'inert-anon-key',
};

// Build identifier is injected by vite.config.ts and is shared by the app shell,
// the PWA update checker, and cache-busting for the bundled ODCHC checklist.
export const DEPLOYMENT_TAG = import.meta.env.VITE_NMIS_BUILD_ID?.trim() || 'development';
