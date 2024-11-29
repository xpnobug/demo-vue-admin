import Vue from '@vitejs/plugin-vue';
import VueJsx from '@vitejs/plugin-vue-jsx';
import { configDefaults, defineConfig } from 'vitest/config';
import createVitePlugins from './apps/web-antd/config/plugins'
export default defineConfig(({command,mode}) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd());
  // plugins: [Vue(), VueJsx()],
  plugins: createVitePlugins(env, command === 'build'),
  test: {
    environment: 'happy-dom',
    exclude: [...configDefaults.exclude, '**/e2e/**'],
  },
});
