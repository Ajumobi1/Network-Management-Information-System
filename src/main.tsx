import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AppErrorBoundary from './components/system/AppErrorBoundary';
import { DEPLOYMENT_TAG } from './lib/runtime';
import './index.css';
import './public-portal-security.css';

const UPDATE_QUERY_KEY = '__nmis_refresh';
let reloadTriggered = false;

function showUpdatingState(): void {
  const root = document.getElementById('root');
  if (!root) return;

  root.innerHTML = `
    <div style="min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:24px;background:#f8fafc;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#071c4b;">
      <div style="width:min(100%,420px);text-align:center;background:#fff;border:1px solid #dbe5f3;border-radius:18px;padding:28px;box-shadow:0 14px 40px rgba(7,28,75,.08);">
        <div style="font-size:18px;font-weight:800;margin-bottom:8px;">Updating NMIS</div>
        <div style="font-size:14px;line-height:1.6;color:#5e6f8d;">Loading the latest version. Please wait…</div>
      </div>
    </div>
  `;
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

async function getWorkerBuildId(
  worker: ServiceWorker | null,
  timeoutMs = 1500,
): Promise<string | null> {
  if (!worker) return null;

  return new Promise(resolve => {
    const channel = new MessageChannel();
    const timer = window.setTimeout(() => resolve(null), timeoutMs);

    channel.port1.onmessage = event => {
      window.clearTimeout(timer);
      const buildId = event.data?.buildId;
      resolve(typeof buildId === 'string' && buildId.trim() ? buildId.trim() : null);
    };

    try {
      worker.postMessage({ type: 'NMIS_GET_BUILD_ID' }, [channel.port2]);
    } catch {
      window.clearTimeout(timer);
      resolve(null);
    }
  });
}

async function waitForWorkerActivation(
  registration: ServiceWorkerRegistration,
  timeoutMs = 10000,
): Promise<boolean> {
  if (registration.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  if (!registration.installing) {
    return Boolean(registration.active);
  }

  return new Promise(resolve => {
    const timer = window.setTimeout(() => resolve(false), timeoutMs);
    const installing = registration.installing;

    installing.addEventListener('statechange', () => {
      if (installing.state === 'activated') {
        window.clearTimeout(timer);
        resolve(true);
      } else if (installing.state === 'redundant') {
        window.clearTimeout(timer);
        resolve(false);
      }
    });
  });
}

async function registerCurrentServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return null;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloadTriggered) return;
    reloadTriggered = true;
    window.location.reload();
  });

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    });

    await registration.update();
    await waitForWorkerActivation(registration);

    return registration;
  } catch (error) {
    console.warn('NMIS service-worker registration/update failed:', error);
    return null;
  }
}

async function reloadIntoCurrentDeployment(
  registration: ServiceWorkerRegistration | null,
  serverBuildId: string,
): Promise<never> {
  showUpdatingState();

  if (registration) {
    try {
      await registration.update();
      await waitForWorkerActivation(registration);
    } catch {
      // Navigation below still performs the final network-fresh load.
    }
  }

  const url = new URL(window.location.href);
  url.searchParams.set(UPDATE_QUERY_KEY, serverBuildId);
  url.searchParams.set('_', String(Date.now()));

  reloadTriggered = true;
  window.location.replace(url.toString());

  await new Promise<never>(() => undefined);
}

async function ensureCurrentDeployment(
  registration: ServiceWorkerRegistration | null,
): Promise<void> {
  if (import.meta.env.DEV || !navigator.onLine || reloadTriggered) return;

  const serverBuildId = await fetchServerBuildId();
  if (!serverBuildId) return;

  const activeWorkerBuild = registration
    ? await getWorkerBuildId(registration.active)
    : null;

  const appIsCurrent = DEPLOYMENT_TAG === serverBuildId;
  const workerIsCurrent = activeWorkerBuild === serverBuildId;

  if (appIsCurrent && (workerIsCurrent || !registration)) {
    // Remove one-time cache-busting parameters after a successful update.
    if (window.location.search.includes(UPDATE_QUERY_KEY)) {
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete(UPDATE_QUERY_KEY);
      cleanUrl.searchParams.delete('_');
      window.history.replaceState({}, document.title, cleanUrl.toString());
    }
    return;
  }

  await reloadIntoCurrentDeployment(registration, serverBuildId);
}

async function bootstrap(): Promise<void> {
  const registration = await registerCurrentServiceWorker();

  await ensureCurrentDeployment(registration);

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

  const checkWhileOpen = () => {
    if (reloadTriggered || !navigator.onLine) return;
    void ensureCurrentDeployment(registration);
  };

  // Do not wait for a pull-to-refresh gesture. The installed Home Screen app
  // checks on launch, resume/focus, visibility changes and periodically while open.
  window.setInterval(checkWhileOpen, 5 * 60 * 1000);
  window.addEventListener('focus', checkWhileOpen);
  window.addEventListener('pageshow', checkWhileOpen);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkWhileOpen();
  });
}

void bootstrap();
