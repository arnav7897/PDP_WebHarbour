import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:5000',
      '/apps': 'http://localhost:5000',
      '/categories': 'http://localhost:5000',
      '/tags': 'http://localhost:5000',
      '/admin': 'http://localhost:5000',
      '/users': 'http://localhost:5000',
      '/developer': 'http://localhost:5000',
      '/reports': 'http://localhost:5000',
      '/recommendations': 'http://localhost:5000',
      '/health': 'http://localhost:5000',
    },
  },
})
