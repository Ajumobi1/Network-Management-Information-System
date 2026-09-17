import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import AppErrorBoundary from './components/system/AppErrorBoundary';
import './index.css';

// Register the service worker for PWA support. Private data is explicitly kept
// network-only by the Workbox configuration in vite.config.ts.
registerSW({ immediate: true });

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
