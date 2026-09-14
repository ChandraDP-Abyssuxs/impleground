import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // @imgly/background-removal and tesseract.js are both loaded via
    // dynamic import() in their panels, so Rollup already splits them
    // into their own async chunks — the initial bundle stays small and
    // Vercel's static CDN can cache the heavy WASM-adjacent chunks
    // independently, without any manual chunking config.
    chunkSizeWarningLimit: 2000,
  },
  // Both libraries fetch their WASM/model assets at runtime via fetch(),
  // not via bundler imports, so no special `optimizeDeps.exclude` is
  // required — but we do want dev-server prebundling to leave them alone
  // so the WASM binaries aren't re-wrapped.
  optimizeDeps: {
    exclude: ['@imgly/background-removal'],
  },
})
