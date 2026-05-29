import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
      manifest: {
        name: 'TutorUPTC',
        short_name: 'TutorUPTC',
        description: 'Plataforma de tutorías entre estudiantes - Universidad Pedagógica y Tecnológica de Colombia',
        theme_color: '#0f3816',      // UPTC brand dark green
        background_color: '#0f3816',  // UPTC brand dark green
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icons/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // RNF-07: Cache First for the static app shell
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        
        // Custom runtime caching strategies
        runtimeCaching: [
          {
            // RNF-08: Stale-While-Revalidate for dynamic resources (Tutor Profiles & Schedules)
            urlPattern: ({ url }) => url.pathname.startsWith('/api/tutors') || url.pathname.includes('/availability'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'dynamic-tutors-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 24 * 60 * 60 * 7 // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // RNF-09: Network-First for critical transactional requests (Bookings & Payments)
            urlPattern: ({ url }) => url.pathname.startsWith('/api/bookings') || url.pathname.startsWith('/api/payments'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'critical-transactions-cache',
              networkTimeoutSeconds: 5, // fallback to cache if offline or slow connection (>5s)
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 24 * 60 * 60 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ]
})
