import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode, command }) => {
    const envDir = path.resolve(__dirname, '../../');
    const env = loadEnv(mode, envDir, '');
    const isDevServer = command === 'serve';
    return {
      envDir,
      base: isDevServer ? '/' : './',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'src'),
          '@prompt-vault/app': path.resolve(__dirname, '../../packages/app/src')
        }
      }
    };
});
