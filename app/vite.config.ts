import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

/* GitHub Pages serves a project site from /<repo>/, so the production
   build needs that prefix. Override with SIRAJ_BASE=/ when moving to a
   custom domain or another host. */
const BASE = process.env.SIRAJ_BASE ?? '/Siraj/'

export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? BASE : '/',
  plugins: [
    /* Installable app + offline shell. This manifest is also what Bubblewrap
       reads to generate the Android (TWA) wrapper, so the APK never carries
       the web code: a push to main reaches installed apps on their next launch.
       Registration and the update policy live in src/platform/pwa.ts. */
    VitePWA({
      injectRegister: false,
      registerType: 'prompt',
      includeManifestIcons: false, // already covered by globPatterns
      manifest: {
        id: BASE,
        name: 'سراج: تعلّم الإسلام',
        short_name: 'سراج',
        description: 'سراج: رحلة تفاعلية لتعلّم الإسلام، خطوة بخطوة.',
        lang: 'ar',
        dir: 'rtl',
        display: 'standalone',
        theme_color: '#FEBD00',
        background_color: '#FEBD00',
        categories: ['education', 'books'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // the whole app is small (fonts + webp art), so precache all of it:
        // every lesson and pose works offline after the first visit
        globPatterns: ['**/*.{js,css,html,svg,webp,png,woff2}'],
        // macOS writes ._ sidecar files on external drives; never ship them
        globIgnores: ['**/._*'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  // a preview launcher may hand us a free port; otherwise Vite's default
  server: { port: Number(process.env.PORT) || 5173 },
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    rollupOptions: {
      // framer-motion marks its modules "use client" for RSC; meaningless in a SPA
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return
        warn(warning)
      },
      output: {
        manualChunks(id) {
          if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils')) return 'motion'
          if (id.includes('react-dom') || id.includes('/react/')) return 'react'
        },
      },
    },
  },
}))
