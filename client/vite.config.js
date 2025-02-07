import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    "process.env": process.env,
  },
  envPrefix: "VITE_",
  server: {
    host: false, // allows access from other devices on the network
    port: 5174, // sets the port to match the client configuration
    strictPort: true, // ensures the server doesn't fallback to another port if 5174 is in use
    open: true, // opens the browser automatically when the server starts
  },
  build: {
    sourcemap: true, // generates source maps for easier debugging
    target: 'esnext', // sets the target for modern builds
    minify: 'esbuild', // uses esbuild for minification for faster builds
    outDir: '../server/public', // sets the output directory to the server's public folder
    emptyOutDir: true, // ensures the output directory is clean before building
    brotliSize: false, // disables Brotli compression to speed up build times
  }
});
