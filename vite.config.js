import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all network interfaces
    port: 5173, // Default Vite port
  },
  base: process.env.NODE_ENV === 'production' ? '/REPO_NAME/' : '/', // Replace REPO_NAME with your actual repo name
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

