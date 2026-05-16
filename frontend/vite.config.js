import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/gasolineras-nl/',
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('leaflet') || id.includes('markercluster')) return 'vendor-map'
          if (id.includes('@tanstack/react-query'))                     return 'vendor-query'
          if (id.includes('lucide-react'))                              return 'vendor-ui'
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('react-router-dom')) return 'vendor-react'
        },
      },
    },
  },
})
