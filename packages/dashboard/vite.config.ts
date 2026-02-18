import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const spaFallbackPlugin = (): Plugin => ({
  name: "spa-fallback",
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = req.url || "";
      
      if (url === "/api" || url.startsWith("/api/") || url.includes(".") || url.startsWith("/@")) {
        return next();
      }
      
      req.url = "/index.html";
      next();
    });
  },
});

export default defineConfig({
  plugins: [react(), tailwindcss(), spaFallbackPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@spinekit/shared": path.resolve(__dirname, "../shared/src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
