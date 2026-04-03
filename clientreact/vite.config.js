import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:4000',
      '/apps': 'http://localhost:4000',
      '/categories': 'http://localhost:4000',
      '/tags': 'http://localhost:4000',
      '/admin': 'http://localhost:4000',
      '/users': 'http://localhost:4000',
      '/developer': 'http://localhost:4000',
      '/reports': 'http://localhost:4000',
      '/recommendations': 'http://localhost:4000',
      '/health': 'http://localhost:4000',
    },
  },
})
