import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const developmentBuild = process.env.NODE_ENV !== 'production';

export default defineConfig({
  plugins: [react()],
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
