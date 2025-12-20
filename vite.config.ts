import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/rest': {
        target: 'http://localhost:8081', // Replace with actual hawkBit server URL
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
