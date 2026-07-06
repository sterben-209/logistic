import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    tailwindcss(),
    react()
  ],
  build: {
    outDir: '../stitch_ai_yard_pathfinding_system/map_app',
    emptyOutDir: true,
  },
})
