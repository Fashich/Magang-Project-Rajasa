import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact(), tailwindcss()],
  server: {
    host: true,
    port: 3000,
    strictPort: true,
    allowedHosts: true, // hanya untuk kebutuhan demo dev scanner
    // - `frontend/vite.config.js` memakai `server.allowedHosts: true` agar Cloudflare Quick Tunnel dengan host dinamis bisa langsung dipakai tanpa konfigurasi ulang setiap demo.
    // - Konfigurasi ini hanya untuk demo/dev scanner, bukan konfigurasi production.
    proxy: {
      '/api': {
        target: 'http://nginx:80',
        changeOrigin: true,
      },
    },
  },
});
