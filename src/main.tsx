import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import AppErrorBoundary from './components/system/AppErrorBoundary';
import './index.css';
import './public-portal-security.css';

// Keep installed web apps aligned with the current deployment. Private data is
// explicitly kept network-only by the Workbox configuration in vite.config.ts.
registerSW({
  immediate: true,
  onRegisteredSW: (_swUrl, registration) => {
    if (!registration) return;
    const checkForUpdate = () => { void registration.update(); };
    checkForUpdate();
    window.setInterval(checkForUpdate, 5 * 60 * 1000);
    window.addEventListener('focus', checkForUpdate);
    window.addEventListener('pageshow', checkForUpdate);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkForUpdate(); });
  },
  onNeedRefresh: () => {
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
