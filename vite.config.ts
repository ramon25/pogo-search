/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // GitHub Pages: muss '/<REPO-NAME>/' sein (siehe README).
  // Bei Umbenennung des Repos hier anpassen.
  base: '/pogo-search/',
  test: {
    environment: 'node',
  },
})
