import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base can be overridden for GitHub Pages project sites (e.g. VITE_BASE=/enn-studio/)
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
})
