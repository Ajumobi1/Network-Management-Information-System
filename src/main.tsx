import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');

if (rootElement) {
  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  } catch (error) {
    console.error('NMIS Critical Initialization Error:', error);
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif; background: #fff1f2; color: #991b1b; border: 1px solid #f87171; border-radius: 8px; margin: 20px;">
        <h1 style="margin-top: 0;">System Startup Error</h1>
        <p>The application could not start. This is usually due to missing environment variables or a network block.</p>
        <pre style="background: #fee2e2; padding: 10px; border-radius: 4px; overflow: auto;">${error instanceof Error ? error.message : String(error)}</pre>
        <p>Please check your Vercel Environment Variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).</p>
      </div>
    `;
  }
}
