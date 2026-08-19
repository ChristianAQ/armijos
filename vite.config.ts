import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Deployed to GitHub Pages at https://<user>.github.io/armijos-jardineria/
// Change `base` if the repo name or hosting path differs.
export default defineConfig({
  base: "/armijos-jardineria/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon-16.png", "favicon-32.png"],
      manifest: {
        id: "/armijos-jardineria/",
        name: "Armijos — Facturas y presupuestos",
        short_name: "Armijos",
        description: "Genera facturas, presupuestos y avisos de mantenimiento en segundos.",
        start_url: "/armijos-jardineria/",
        scope: "/armijos-jardineria/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#0d211a",
        theme_color: "#12352b",
        lang: "es",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        navigateFallback: "index.html",
        runtimeCaching: [
          {
            // Nunca cachear tráfico de Firebase/Firestore/Auth: siempre red,
            // el SDK de Firestore ya gestiona su propia persistencia offline.
            urlPattern: /^https:\/\/(firestore|identitytoolkit|securetoken)\.googleapis\.com\/.*/,
            handler: "NetworkOnly",
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: { "@": "/src" },
  },
  build: {
    chunkSizeWarningLimit: 900,
  },
});
