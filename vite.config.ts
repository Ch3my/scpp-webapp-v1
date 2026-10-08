import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { VitePWA } from "vite-plugin-pwa"

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  define: {
    // Busts the persisted query cache (src/api/persist.ts) on every deploy. A
    // build whose wire format changed must not hydrate the old shape; the cache
    // refills on the first render, which is online by definition because the
    // update had to be downloaded.
    __BUILD_ID__: JSON.stringify(Date.now().toString(36)),
  },
  build: {
    rolldownOptions: {
      output: {
        manualChunks: (id: string) => {
          // Vendor chunks for third-party libraries
          if (id.includes('node_modules')) {
            // Don't split recharts - it has circular dependencies that break when chunked
            if (id.includes('react-query') || id.includes('@tanstack/query')) return 'react-query';
            if (id.includes('react-router') || id.includes('react-dom') || id.includes('react/')) return 'react-vendor';
            if (id.includes('@radix-ui')) return 'radix';
            if (id.includes('react-day-picker') ||
                id.includes('numeral') ||
                id.includes('luxon') ||
                id.includes('zustand') ||
                id.includes('axios')) return 'utils';
          }
        }
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // "prompt", not "autoUpdate": the new worker waits instead of activating
      // under the running page, so its precached chunks stay valid until the
      // reload. src/lib/pwa.ts drives the actual update (periodic checks, a
      // toast, auto-apply when the app is backgrounded) - the plugin's own
      // injected registerSW.js never reloads the page, which is why installed
      // phones kept running the old bundle.
      registerType: "prompt",
      // We import `virtual:pwa-register` ourselves in src/lib/pwa.ts.
      injectRegister: null,
      includeAssets: ["favicon.ico", "apple-touch-icon.png"],
      manifest: {
        name: "SCPP - Control de Presupuestos Personales",
        short_name: "SCPP",
        description:
          "Seguimiento de gastos, inventario de alimentos y documentos.",
        lang: "es",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        // Hex equivalents of the dark theme's --background, which is oklch in
        // App.css; manifest colours have to be plain CSS colours.
        theme_color: "#121113",
        background_color: "#121113",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            // Separate file with the logo inside the safe zone: launchers crop
            // maskable icons to a circle/squircle.
            src: "maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // App shell only. API responses are deliberately NOT cached here:
        // TanStack Query already owns that layer, and a service worker cache of
        // authenticated responses would survive a logout and leak across users.
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        navigateFallback: "/index.html",
        // Recharts alone is ~300 kB, over workbox's 2 MiB default per entry.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        // skipWaiting stays off deliberately. Leaving it off is what makes
        // workbox emit the SKIP_WAITING message listener that src/lib/pwa.ts
        // triggers, so the swap happens at a moment we choose and is always
        // followed by a reload.
      },
      devOptions: {
        // Keep the service worker out of `vite dev`; it caches aggressively and
        // makes HMR confusing. Verify it against `vite preview` instead.
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: true,
    allowedHosts: [
      "scppdesktop.lezora.cl",
      // Same build serves both: the shell picks desktop or mobile by viewport
      "scppapp.lezora.cl"
    ]
  }
}));
