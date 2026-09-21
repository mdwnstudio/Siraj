import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/* GitHub Pages serves a project site from /<repo>/, so the production
   build needs that prefix. Override with SIRAJ_BASE=/ when moving to a
   custom domain or another host. */
const BASE = process.env.SIRAJ_BASE ?? '/Siraj/'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? BASE : '/',
  // a preview launcher may hand us a free port; otherwise Vite's default
  server: { port: Number(process.env.PORT) || 5173 },
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils')) return 'motion'
          if (id.includes('react-dom') || id.includes('/react/')) return 'react'
        },
      },
    },
  },
}))
