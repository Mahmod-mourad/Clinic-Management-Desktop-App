import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'

const env = loadEnv('', process.cwd(), '')

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    define: {
      'process.env.HMAC_SECRET': JSON.stringify(env.HMAC_SECRET ?? ''),
    },
    build: {
      lib: {
        entry: resolve('electron/main/index.ts'),
      },
    },
    resolve: {
      alias: {
        '@main': resolve('electron/main'),
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: resolve('electron/preload/index.ts'),
      },
    },
  },
  renderer: {
    root: '.',
    build: {
      rollupOptions: {
        input: resolve('index.html'),
      },
    },
    resolve: {
      alias: {
        '@': resolve('src'),
        '@shared': resolve('src/types'),
      },
    },
    plugins: [react()],
  },
})
