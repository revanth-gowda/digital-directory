import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite = the build tool. It runs your dev server and bundles the app for production.
export default defineConfig({
  plugins: [react()],
})
