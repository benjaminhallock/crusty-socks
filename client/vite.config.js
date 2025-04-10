import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// Added definitions for 'process' and '__dirname' to resolve undefined variable errors
const __dirname = path.dirname(new URL(import.meta.url).pathname)

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    css: {
      postcss: './postcss.config.js',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@shared': path.resolve(__dirname, '../shared'),
      },
    },
    server: {
      port: 5174,
      strictPort: true,
      open: true,
      host: false,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
        '/socket.io': {
          target: env.VITE_SOCKET_URL || 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
    },
    build: {
      target: 'esnext',
      minify: 'esbuild',
      sourcemap: true,
      outDir: 'dist',
      emptyOutDir: true,
      assetsDir: 'assets',
      assetsInlineLimit: 0,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('.svg')) {
              return 'svg'
            }
          },
        },
      },
    },
    publicDir: 'public',
    assetsInclude: ['**/*.svg', '**/*.woff'],
    base: mode === 'production' ? '/' : '/', // Add this for GitHub Pages
  }
})
