import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
 server: {
  host: "127.0.0.1",
  port: 5173,
  strictPort: true,
  allowedHosts: [
    "site.local",
    "clamshell-passage-relive.ngrok-free.dev",
  ],
  open: "http://site.local:5173",
  proxy: {
    "/api": {
      target: "http://localhost:5024",
      changeOrigin: true,
    },
  },
},
});



