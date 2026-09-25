import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AppErrorBoundary from './components/system/AppErrorBoundary';
import { DEPLOYMENT_TAG } from './lib/runtime';
import './index.css';
import './public-portal-security.css';

const UPDATE_ATTEMPT_KEY = 'nmis-deployment-update-attempt';
let reloadTriggered = false;

async function retireServiceWorkers(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(registration => registration.unregister()));
  } catch (error) {
    console.warn('NMIS service-worker cleanup failed:', error);
  }

  if (!('caches' in window)) return;

  try {
    const names = await caches.keys();
    const appCaches = names.filter(name =>
      /^(workbox-|nmis-|odchc-)/i.test(name),
    );
    await Promise.all(appCaches.map(name => caches.delete(name)));
  } catch (error) {
    console.warn('NMIS cache cleanup failed:', error);
  }
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

async function ensureCurrentBuild(): Promise<void> {
  if (import.meta.env.DEV || !navigator.onLine) return;

  const serverBuildId = await fetchServerBuildId();
  if (!serverBuildId || serverBuildId === DEPLOYMENT_TAG) {
    try {
      sessionStorage.removeItem(UPDATE_ATTEMPT_KEY);
    } catch {
      // sessionStorage is optional.
    }
    return;
  }

  let previousAttempt = '';
  try {
    previousAttempt = sessionStorage.getItem(UPDATE_ATTEMPT_KEY) || '';
  } catch {
    // sessionStorage is optional.
  }

  if (previousAttempt === serverBuildId) {
    // One automatic attempt has already happened for this deployment. Avoid a
    // reload loop; the visible app can still run while the next launch retries.
    return;
  }

  try {
    sessionStorage.setItem(UPDATE_ATTEMPT_KEY, serverBuildId);
  } catch {
    // sessionStorage is optional.
  }

  // Retire any previously-installed PWA worker before the next navigation.
  // The new architecture deliberately uses ordinary network requests so the
  // installed Home Screen app cannot keep an old application shell alive.
  await retireServiceWorkers();

  const url = new URL(window.location.href);
  url.searchParams.set('__nmis_build', serverBuildId);
  url.searchParams.set('__nmis_refresh', String(Date.now()));

  reloadTriggered = true;
  window.location.replace(url.toString());
  await new Promise<void>(() => undefined);
}

async function bootstrap(): Promise<void> {
  await ensureCurrentBuild();
  await retireServiceWorkers();

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

  // Keep long-running tabs current as well. No service worker is involved.
  const checkWhileOpen = () => {
    if (reloadTriggered || !navigator.onLine) return;
    void ensureCurrentBuild();
  };

  window.setInterval(checkWhileOpen, 5 * 60 * 1000);
  window.addEventListener('focus', checkWhileOpen);
  window.addEventListener('pageshow', checkWhileOpen);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkWhileOpen();
  });
}

void bootstrap();
