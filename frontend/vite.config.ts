import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  cacheDir: './.vite_cache',
  css: {
    transformer: 'lightningcss',
    lightningcss: {
      targets: {
        chrome: 109 << 16,
        firefox: 110 << 16,
        safari: 14 << 16,
        edge: 109 << 16
      }
    }
  },
  build: {
    cssMinify: 'lightningcss'
  },
  cacheDir: './.vite-cache',
  server: {
    host: true,
    port: 5186,
    strictPort: false,
    allowedHosts: ['sgp.florestal.com'],
    hmr: false,
  },
  preview: {
    host: true,
    port: 5186,
    strictPort: false,
    allowedHosts: ['sgp.florestal.com'],
  },
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        navigateFallback: 'index.html',
        // Skip waiting and claim clients immediately, but WITHOUT forcing a reload
        skipWaiting: false,
        clientsClaim: false,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              expiration: { maxEntries: 2000, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          // DO NOT cache API calls in the Service Worker.
          // The app handles its own offline data via localStorage (offlineStore.ts).
          // SW caching of API responses caused stale data conflicts on reconnection.
        ],
      },
      manifest: {
        name: 'Frota & Patrimônio',
        short_name: 'Frota',
        description: 'Controle de Frota e Patrimônio — Rondas, Veículos e Motoristas',
        theme_color: '#0f172a',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        categories: ['business', 'utilities'],
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      },
      devOptions: {
        // Enabled for HTTPS — needed for PWA install prompt
        enabled: true,
        type: 'module',
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
