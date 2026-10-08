import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { VitePWA } from "vite-plugin-pwa"

// https://vitejs.dev/config/
export default defineConfig(async () => ({
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
      registerType: "autoUpdate",
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
