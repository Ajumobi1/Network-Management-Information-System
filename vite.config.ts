import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { execSync } from 'node:child_process';

const developmentBuild = process.env.NODE_ENV !== 'production';

function resolveDeploymentBuildId(): string {
  const configured = process.env.VITE_NMIS_BUILD_ID?.trim();
  if (configured) return configured;

  const vercelDeployment = process.env.VERCEL_DEPLOYMENT_ID?.trim();
  if (vercelDeployment) return vercelDeployment;

  const vercelCommit = process.env.VERCEL_GIT_COMMIT_SHA?.trim();
  if (vercelCommit) return vercelCommit;

  const githubCommit = process.env.GITHUB_SHA?.trim();
  if (githubCommit) return githubCommit;

  try {
    const gitCommit = execSync('git rev-parse HEAD', {
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().trim();
    if (gitCommit) return gitCommit;
  } catch {
    // A source archive or restricted build environment may not contain .git metadata.
  }

  return `local-${Date.now()}`;
}

const deploymentBuildId = resolveDeploymentBuildId();

function deploymentVersionPlugin(buildId: string): Plugin {
  return {
    name: 'nmis-deployment-version',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify(
          {
            buildId,
            generatedAt: new Date().toISOString(),
          },
          null,
          2,
        ),
      });
    },
  };
}

function serviceWorkerPlugin(buildId: string): Plugin {
  const workerBuildId = JSON.stringify(buildId);

  return {
    name: 'nmis-service-worker',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: `const NMIS_BUILD_ID = ${workerBuildId};

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter(name => /^(workbox-|nmis-|odchc-)/i.test(name))
        .map(name => caches.delete(name)),
    );
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    void self.skipWaiting();
    return;
  }

  if (event.data?.type === 'NMIS_GET_BUILD_ID' && event.ports?.[0]) {
    event.ports[0].postMessage({
      type: 'NMIS_BUILD_ID',
      buildId: NMIS_BUILD_ID,
    });
  }
});

self.addEventListener('fetch', event => {
  const request = event.request;

  // Navigation is deliberately network-first with an explicit no-store request.
  // This is the critical path for iPhone/Android Home Screen update reliability.
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request, { cache: 'no-store' }));
  }

  // Everything else is intentionally left to the browser's normal request path.
  // This keeps Supabase/API requests, hashed JS/CSS assets, images, downloads and
  // third-party resources out of service-worker caching and interception.
});
`,
      });
    },
  };
}

export default defineConfig({
  define: {
    'import.meta.env.VITE_NMIS_BUILD_ID': JSON.stringify(deploymentBuildId),
  },
  plugins: [
    react(),
    deploymentVersionPlugin(deploymentBuildId),
    serviceWorkerPlugin(deploymentBuildId),
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
        developmentBuild
          ? 'src/services/auth/authService.mock.ts'
          : 'src/services/auth/authService.mock.disabled.ts',
      ),
    },
  },
});
