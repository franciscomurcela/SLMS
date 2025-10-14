 import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // forward API calls in development to the carrier service on localhost:8082
      '/carriers': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        secure: false,
      },
      // forward orders API to the orders service on localhost:8081
      '/api/orders': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
