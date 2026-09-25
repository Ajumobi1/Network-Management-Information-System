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
    const gitCommit = execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
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

const privateNavigationPattern = /^\/(?:dashboard|providers(?:\/.*)?|provider-registration|credentialing(?:\/.*)?|contracts(?:\/.*)?|capitation(?:\/.*)?|financial(?:\/.*)?|analytics(?:\/.*)?|population(?:\/.*)?|inspections(?:\/.*)?|accreditations(?:\/.*)?|quality-compliance(?:\/.*)?|performance(?:\/.*)?|reports(?:\/.*)?|communication(?:\/.*)?|complaints(?:\/.*)?|admin(?:\/.*)?|settings(?:\/.*)?|setup(?:\/.*)?)(?:\/|$)/;

export default defineConfig({
  define: {
    'import.meta.env.VITE_NMIS_BUILD_ID': JSON.stringify(deploymentBuildId),
  },
  plugins: [
    react(),
    deploymentVersionPlugin(deploymentBuildId),
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
