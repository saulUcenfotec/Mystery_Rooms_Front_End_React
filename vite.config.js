import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('three')) {
            return 'three-vendor'
          }
          if (id.includes('react')) {
            return 'react-vendor'
          }
          return undefined
        }
      }
    }
  }
})
