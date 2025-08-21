import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: mode === 'production' ? 8081 : 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
    'process.env.BACKEND_URL': JSON.stringify(process.env.BACKEND_URL),
    'process.env.FRONTEND_URL': JSON.stringify(process.env.FRONTEND_URL),
    'process.env.NOVNC_URL': JSON.stringify(process.env.NOVNC_URL),
    'process.env.HOST': JSON.stringify(process.env.HOST)
  }
}));
