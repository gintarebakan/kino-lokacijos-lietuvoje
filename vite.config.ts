// Vite  - pagrindinis įrankis React aplikacijos paleidimui ir kompiliavimui

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; // React JSX ir hot-reload palaikymas
import { TanStackRouterVite } from "@tanstack/router-plugin/vite"; // Automatinis maršrutų generavimas iš /src/routes/ aplankalo
import tsconfigPaths from "vite-tsconfig-paths"; // TypeScript path alias palaikymas (pvz. @/components -> src/components)

export default defineConfig({
  plugins: [
    // TanStack Router įskiepis, kuris automatiškai generuoja maršrutų konfigūraciją
    // autoCodeSplitting su true, kiekvieną puslapį įkelia atskirai (lazy loading)
    TanStackRouterVite({ autoCodeSplitting: true }),

    // React įskiepis: JSX kompiliavimas ir hot-reload kūrimo metu
    react(),

    // TypeScript path alias palaikymas pagal tsconfig.json nustatymus
    tsconfigPaths(),
  ],

  build: {
    outDir: "dist", // Sukurtos versijos dist aplankas

    rollupOptions: {
      output: {
        // Didelės bibliotekos atskiriamos į atskirus failus
        // Tai pagerina naršyklės cache efektyvumą/ bibliotekos nesikeičia dažnai
        manualChunks: {
          maplibre: ["maplibre-gl"], // MapLibre GL JS = žemėlapio variklis
          tanstack: ["@tanstack/react-query", "@tanstack/react-router"], // TanStack bibliotekos = duomenų ir navigacijos valdymas
          supabase: ["@supabase/supabase-js"], // Supabase klientas = duomenų bazės ryšys
        },
      },
    },
  },

  server: {
    // Leidžia prisijungti iš bet kokio hosto kūrimo metu
    // Reikalinga kai serveris paleistas 
    allowedHosts: true,
  },
});