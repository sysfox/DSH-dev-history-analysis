import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: './',
  plugins: [vue()],
  server: { host: true, port: 5173, fs: { allow: ['..'] } },
  build: { chunkSizeWarningLimit: 2500 },
})
