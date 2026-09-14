import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The built dashboard is served by dashboard/server.py as static files
// from dist/, and that same server exposes the /api/* endpoints — so in
// production there's one origin and no proxy needed. In dev mode
// (`npm run dev`), proxy /api to the Python server so you can run both
// with hot reload.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://127.0.0.1:5173",
    },
    port: 5174,
  },
});
