import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path"
import tailwindcss from "@tailwindcss/vite"

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          // Vendor chunks for third-party libraries
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) return 'chart';
            if (id.includes('react-query') || id.includes('@tanstack/query')) return 'react-query';
            if (id.includes('react-router') || id.includes('react-dom') || id.includes('react/')) return 'react-vendor';
            if (id.includes('@radix-ui')) return 'radix';
            if (id.includes('react-image-file-resizer') ||
                id.includes('react-day-picker') ||
                id.includes('numeral') ||
                id.includes('luxon') ||
                id.includes('zustand') ||
                id.includes('axios')) return 'utils';
          }

          // Split Dashboard components separately since it's always loaded
          if (id.includes('/src/screens/Dashboard')) return 'dashboard';
          if (id.includes('/src/components/') &&
              (id.includes('Chart') || id.includes('Graph') || id.includes('Categories'))) {
            return 'dashboard-charts';
          }
        }
      },
    },
  },
  plugins: [react(), tailwindcss()],
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
      "scppdesktop.lezora.cl"
    ]
  }
}));
