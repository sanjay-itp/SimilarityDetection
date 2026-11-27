import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// host: true lets other machines on the institution network reach the dev
// and preview servers (http://<server-ip>:5173 or :8080).
// /api/mail goes to the mail service (npm run mail), which sends the
// "account created" emails.
const mailPort = process.env.MAIL_PORT || 8787;
const proxy = { "/api/mail": { target: `http://127.0.0.1:${mailPort}`, changeOrigin: true } };

export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5173, proxy },
  preview: { host: true, port: 8080, proxy },
});
