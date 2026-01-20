// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'SOS Fire Response',
        short_name: 'FireSOS',
        description: 'Report and respond to fire incidents',
        theme_color: '#d32f2f',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },

      // 🔒 Production precache only
      workbox: {
        globPatterns: ['**/*.{js,css,html,wasm}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },

      // 🚫 Dev fix (THIS removes the warning permanently)
      devOptions: {
        enabled: false, // ⬅ disables SW + precache in dev
      },
    }),
  ],
});
