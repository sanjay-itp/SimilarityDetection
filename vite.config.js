import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// host: true lets other machines on the institution network reach the dev
// and preview servers (http://<server-ip>:5173 or :8080).
export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5173 },
  preview: { host: true, port: 8080 },
});
