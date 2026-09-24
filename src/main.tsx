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
    window.setInterval(() => { void registration.update(); }, 15 * 60 * 1000);
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
