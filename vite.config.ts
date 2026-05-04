import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    TanStackRouterVite({ autoCodeSplitting: true }),
    react(),
    tsconfigPaths(),
  ],
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          maplibre: ["maplibre-gl"],
          tanstack: ["@tanstack/react-query", "@tanstack/react-router"],
          supabase: ["@supabase/supabase-js"],
        },
      },
    },
  },
  server: {
    allowedHosts: true,
  },
});