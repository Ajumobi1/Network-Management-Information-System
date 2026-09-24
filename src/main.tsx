import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AppErrorBoundary from './components/system/AppErrorBoundary';
import { DEPLOYMENT_TAG } from './lib/runtime';
import './index.css';
import './public-portal-security.css';

let reloadTriggered = false;
let serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

async function unregisterLegacyChecklistWorkers(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;

  const registrations = await navigator.serviceWorker.getRegistrations();
  let removed = false;

  await Promise.all(
    registrations.map(async registration => {
      const scriptUrls = [
        registration.active?.scriptURL,
        registration.waiting?.scriptURL,
        registration.installing?.scriptURL,
      ].filter((url): url is string => Boolean(url));

      const legacyChecklistWorker =
        registration.scope === `${window.location.origin}/odchc-checklist/` ||
        scriptUrls.some(url => url.includes('/odchc-checklist/sw.js'));

      if (!legacyChecklistWorker) return;

      try {
        removed = (await registration.unregister()) || removed;
      } catch {
        // Retry on a later launch if the browser does not unregister immediately.
      }
    }),
  );

  return removed;
}

async function fetchServerBuildId(): Promise<string | null> {
  if (import.meta.env.DEV || !navigator.onLine) return null;

  try {
    const response = await fetch(`/version.json?check=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store',
      headers: { 'cache-control': 'no-cache' },
    });

    if (!response.ok) return null;

    const payload = await response.json() as { buildId?: unknown };
    return typeof payload.buildId === 'string' && payload.buildId.trim()
      ? payload.buildId.trim()
      : null;
  } catch {
    return null;
  }
}

async function updateServiceWorker(): Promise<void> {
  if (!navigator.onLine || !serviceWorkerRegistration) return;

  try {
    await serviceWorkerRegistration.update();

    const waiting = serviceWorkerRegistration.waiting;
    if (waiting) {
      waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  } catch {
    // A temporary update failure must never interrupt an otherwise valid session.
  }
}

async function checkForNewDeployment(): Promise<void> {
  if (reloadTriggered || import.meta.env.DEV || !navigator.onLine) return;

  const serverBuildId = await fetchServerBuildId();
  if (!serverBuildId || serverBuildId === DEPLOYMENT_TAG) return;

  // Never reload until a fresh service worker has taken control. Reloading while
  // an older worker still controls the page can reproduce the stale-PWA problem.
  await updateServiceWorker();
}

async function registerCurrentServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloadTriggered) return;
    reloadTriggered = true;
    window.location.reload();
  });

  try {
    serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    });

    await updateServiceWorker();

    const check = () => {
      void updateServiceWorker();
      void checkForNewDeployment();
    };

    check();
    window.setInterval(check, 5 * 60 * 1000);
    window.addEventListener('focus', check);
    window.addEventListener('pageshow', check);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check();
    });
  } catch (error) {
    console.warn('NMIS service-worker registration/update failed:', error);
  }
}

async function bootstrap(): Promise<void> {
  let removedLegacyWorker = false;

  try {
    removedLegacyWorker = await unregisterLegacyChecklistWorkers();
  } catch {
    // The cleanup remains best-effort and will be retried on another launch.
  }

  if (removedLegacyWorker) {
    window.location.reload();
    return;
  }

  await registerCurrentServiceWorker();

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
