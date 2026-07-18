import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub project Pages serves the app from a repository subpath
// (e.g. /fine-companion-public-beta/). The base is configurable via
// VITE_BASE_PATH so the same source builds for local ("/") and for Pages.
// The workflow passes VITE_BASE_PATH=/<repository-name>/ — no repo name is
// hardcoded in application logic. Production source maps are disabled.
// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  build: {
    sourcemap: false,
  },
})
