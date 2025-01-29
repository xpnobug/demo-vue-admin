import { defineConfig } from '@vben/vite-config';
import { loadEnv } from 'vite';
import createVitePlugins from './config/plugins'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd()) as ImportMetaEnv
  return {
    application: {},
    vite: {
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            // mock代理目标地址
            target: 'http://localhost:5320/api',
            ws: true,
          },
        },
      },
    },
    plugins: createVitePlugins(env, command === 'build'),
  };
});
