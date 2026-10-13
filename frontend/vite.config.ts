/// <reference types="vitest/config" />
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  // Unit tests run in Node; fake-indexeddb stands in for the browser's database.
  test: {
    environment: 'node',
    setupFiles: ['fake-indexeddb/auto'],
  },
})
