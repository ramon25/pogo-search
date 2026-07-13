/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'PoGO Box-Cleanup – Suchstring-Generator',
        short_name: 'PoGO Cleanup',
        description:
          'Generiert Pokémon-GO-Suchstrings zum sicheren Aufräumen der Pokémon-Box.',
        lang: 'de',
        theme_color: '#059669',
        background_color: '#f4f4f5',
        display: 'standalone',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  // GitHub Pages: muss '/<REPO-NAME>/' sein (siehe README).
  // Bei Umbenennung des Repos hier anpassen.
  base: '/pogo-search/',
  test: {
    environment: 'node',
  },
})
