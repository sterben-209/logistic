import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: '../stitch_ai_yard_pathfinding_system/map_app',
    emptyOutDir: true,
  },
})
