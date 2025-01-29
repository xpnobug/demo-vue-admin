import type {PluginOption} from 'vite'
import vue from '@vitejs/plugin-vue'

import createAutoImport from './auto-import'
import createComponents from './auto-import'
import createSvgIcon from './svg-icon'

export default function createVitePlugins(isBuild = false) {
  const vitePlugins: (PluginOption | PluginOption[])[] = [vue()]
  vitePlugins.push(createAutoImport())
  vitePlugins.push(createComponents())
  vitePlugins.push(createSvgIcon(isBuild))
  return vitePlugins
}
