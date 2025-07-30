import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
<<<<<<< HEAD
=======
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
>>>>>>> 85abfde (Home page and about section. Redesigned the UI)

export default defineConfig({
  plugins: [react()],
<<<<<<< HEAD
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true
    }
  }
})
=======
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer,
      ],
    },
  },
})
>>>>>>> 85abfde (Home page and about section. Redesigned the UI)
