import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    strictPort: true,
    open: true,
    host: false,

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
            return 'svg';
          }
        }
      }
    }
  },
  publicDir: 'public',
  assetsInclude: ['**/*.svg', '**/*.woff'],
  define: {
    'process.env': {}
  },
  base: process.env.NODE_ENV === 'production' ? '/crustysocks/' : '/' // Add this for GitHub Pages
});
