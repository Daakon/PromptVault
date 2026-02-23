import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => {
    const envDir = path.resolve(__dirname, '../../');
    const isDevServer = command === 'serve';
    return {
      envDir,
      base: isDevServer ? '/' : './',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'src'),
          '@prompt-vault/app': path.resolve(__dirname, '../../packages/app/src')
        }
      }
    };
});
