import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import AppErrorBoundary from './components/system/AppErrorBoundary';
import { DEPLOYMENT_TAG } from './lib/runtime';
import './index.css';
import './public-portal-security.css';

let reloadTriggered = false;
let serviceWorkerRegistration: ServiceWorkerRegistration | undefined;
let updateServiceWorker: ((reloadPage?: boolean) => Promise<void>) | undefined;

async function cleanupLegacyChecklistServiceWorkers(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;

  const registrations = await navigator.serviceWorker.getRegistrations();
  let legacyFound = false;

  await Promise.all(
    registrations.map(async registration => {
      const scriptUrls = [
        registration.active?.scriptURL,
        registration.waiting?.scriptURL,
        registration.installing?.scriptURL,
      ].filter((url): url is string => Boolean(url));

      const isLegacyChecklistWorker =
        registration.scope === `${window.location.origin}/odchc-checklist/` ||
        scriptUrls.some(url => url.includes('/odchc-checklist/sw.js'));

      if (!isLegacyChecklistWorker) return;

      legacyFound = true;
      try {
        await registration.unregister();
      } catch {
        // The next launch can retry cleanup if the browser declines the unregister request.
      }
    }),
  );

  return legacyFound;
}

async function fetchServerBuildId(): Promise<string | null> {
  if (import.meta.env.DEV || !navigator.onLine) return null;

  try {
    const response = await fetch(`/version.json?check=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'cache-control': 'no-cache',
      },
    });

    if (!response.ok) return null;

    const payload = await response.json() as { buildId?: unknown };
    return typeof payload.buildId === 'string' && payload.buildId.trim() ? payload.buildId.trim() : null;
  } catch {
    return null;
  }
}

async function ensureLatestBuild(): Promise<void> {
  if (reloadTriggered || import.meta.env.DEV || !navigator.onLine || !DEPLOYMENT_TAG) return;

  const serverBuildId = await fetchServerBuildId();
  if (!serverBuildId || serverBuildId === DEPLOYMENT_TAG) return;

  reloadTriggered = true;

  try {
    sessionStorage.setItem('nmis_pending_build_update', serverBuildId);
  } catch {
    // Session storage is optional.
  }

  try {
    if (updateServiceWorker) {
      await updateServiceWorker(true);
      return;
    }

    if (serviceWorkerRegistration) {
      await serviceWorkerRegistration.update();
    }
  } catch {
    // Do not reload against an old service worker if the update could not be prepared.
    reloadTriggered = false;
  }
}

async function refreshServiceWorker(swUrl: string, registration: ServiceWorkerRegistration): Promise<void> {
  if (!navigator.onLine || registration.installing) return;

  try {
    const response = await fetch(`${swUrl}${swUrl.includes('?') ? '&' : '?'}check=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'cache-control': 'no-cache',
      },
    });

    if (response.ok) await registration.update();
  } catch {
    // Offline or transient failures should never log the user out or break the application.
  }

  await ensureLatestBuild();
}

async function bootstrap(): Promise<void> {
  let legacyWorkerFound = false;

  try {
    legacyWorkerFound = await cleanupLegacyChecklistServiceWorkers();
  } catch {
    // Continue startup; the cleanup will be retried on a later launch.
  }

  if (legacyWorkerFound) {
    window.location.reload();
    return;
  }

  updateServiceWorker = registerSW({
    immediate: true,
    onRegisteredSW: (swUrl, registration) => {
      if (!registration) return;

      serviceWorkerRegistration = registration;

      const checkForUpdate = () => {
        void refreshServiceWorker(swUrl, registration);
      };

      checkForUpdate();
      window.setInterval(checkForUpdate, 5 * 60 * 1000);
      window.addEventListener('focus', checkForUpdate);
      window.addEventListener('pageshow', checkForUpdate);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkForUpdate();
      });
    },
    onNeedRefresh: () => {
      if (reloadTriggered) return;
      reloadTriggered = true;
      window.setTimeout(() => window.location.reload(), 250);
    },
  });

  const rootElement = document.getElementById('root');

  if (!rootElement) {
    throw new Error('NMIS root element was not found.');
  }

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </React.StrictMode>,
  );
}

void bootstrap();
