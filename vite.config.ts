import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

const developmentBuild = process.env.NODE_ENV !== 'production';

const privateNavigationPattern = /^\/(?:dashboard|providers(?:\/.*)?|provider-registration|credentialing(?:\/.*)?|contracts(?:\/.*)?|capitation(?:\/.*)?|financial(?:\/.*)?|analytics(?:\/.*)?|population(?:\/.*)?|inspections(?:\/.*)?|accreditations(?:\/.*)?|performance(?:\/.*)?|reports(?:\/.*)?|communication(?:\/.*)?|complaints(?:\/.*)?|admin(?:\/.*)?|settings(?:\/.*)?|setup(?:\/.*)?)(?:\/|$)/;

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'android-chrome-192x192.png', 'android-chrome-512x512.png'],
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [privateNavigationPattern],
        cleanupOutdatedCaches: true,
        clientsClaim: false,
        skipWaiting: false,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/[^/]+\.supabase\.co\/(?:rest\/v1|auth\/v1|storage\/v1)(?:\/.*)?$/i,
            handler: 'NetworkOnly',
          },
        ],
      },
      manifest: {
        name: 'ODCHC NMIS',
        short_name: 'NMIS',
        description: 'Ondo State Contributory Health Commission Network Management Information System',
        theme_color: '#071c4b',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'android-chrome-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'android-chrome-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'android-chrome-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  server: {
    allowedHosts: true,
    host: true,
    port: 5173,
    strictPort: true,
    hmr: { clientPort: 443 },
  },
  resolve: {
    alias: {
      '@nmis/mock-auth': path.resolve(
        __dirname,
        developmentBuild ? 'src/services/auth/authService.mock.ts' : 'src/services/auth/authService.mock.disabled.ts',
      ),
    },
  },
});
