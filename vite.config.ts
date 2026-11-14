import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// SITE_BASE: oyun, oyun merkezi sitesinin alt klasöründe yayınlanırken (örn. /kayip-pilot/) scripts/site-kur.mjs tarafından verilir.
export default defineConfig({
  base: process.env.SITE_BASE || '/',
  plugins: [react()],
})
