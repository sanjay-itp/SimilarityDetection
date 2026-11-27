/* ==========================================================================
   Origyn mail service
   --------------------------------------------------------------------------
   Sends the "account created" email (name, email, temporary password) when an
   administrator adds a student or teacher. It is a stopgap until the real
   Origyn backend exists: that backend should send this email itself, from
   the same request that creates the account.

   Configure SMTP in a .env file in the project root (see .env.example), then:
     npm run mail
   The Vite dev and preview servers forward /api/mail/* to this service.
   ========================================================================== */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nodemailer from "nodemailer";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Minimal .env loader so no extra package is needed. Real env vars win.
function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m || line.trim().startsWith("#")) continue;
    const value = m[2].replace(/^(['"])(.*)\1$/, "$2");
    if (process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
}
loadEnv(path.join(ROOT, ".env"));

const env = process.env;
const PORT = Number(env.MAIL_PORT || 8787);
const configured = Boolean(env.SMTP_HOST && env.MAIL_FROM);

const transport = configured
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT || 587),
      secure: String(env.SMTP_SECURE || "").toLowerCase() === "true",
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS || "" } : undefined,
    })
  : null;

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());
const escapeHtml = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const clean = (v, max) => String(v ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, max);

// Simple guard against this endpoint being used to flood inboxes.
const RATE = { windowMs: 60_000, max: Number(env.MAIL_RATE_PER_MIN || 60), hits: [] };
function rateLimited() {
  const cutoff = Date.now() - RATE.windowMs;
  RATE.hits = RATE.hits.filter((t) => t > cutoff);
  if (RATE.hits.length >= RATE.max) return true;
  RATE.hits.push(Date.now());
  return false;
}

function buildMessage({ role, name, email, tempPassword, institution, loginUrl }) {
  const who = role === "teacher" ? "teacher" : "student";
  const org = institution || "Origyn";
  const link = env.APP_URL ? `${env.APP_URL.replace(/\/$/, "")}/login` : loginUrl;
  const text = [
    `Hello ${name},`,
    "",
    `Your Origyn ${who} account at ${org} has been created.`,
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Temporary password: ${tempPassword}`,
    "",
    link ? `Sign in here: ${link}` : "Sign in to Origyn with the details above.",
    "",
    "Please keep this password private.",
  ].join("\n");
  const html = `
    <p>Hello ${escapeHtml(name)},</p>
    <p>Your Origyn ${who} account at ${escapeHtml(org)} has been created.</p>
    <table cellpadding="6" style="border-collapse:collapse">
      <tr><td><strong>Name</strong></td><td>${escapeHtml(name)}</td></tr>
      <tr><td><strong>Email</strong></td><td>${escapeHtml(email)}</td></tr>
      <tr><td><strong>Temporary password</strong></td><td><code>${escapeHtml(tempPassword)}</code></td></tr>
    </table>
    ${link ? `<p><a href="${escapeHtml(link)}">Sign in to Origyn</a></p>` : ""}
    <p>Please keep this password private.</p>`;
  return { from: env.MAIL_FROM, to: email, subject: `Your Origyn account at ${org}`, text, html };
}

function send(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 10_000) {
        reject(new Error("Request too large."));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(raw || "{}"));
      } catch {
        reject(new Error("Invalid JSON."));
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/api/mail/status") return send(res, 200, { configured });
  if (req.method !== "POST" || req.url !== "/api/mail/account-created") return send(res, 404, { error: "Not found." });
  if (!configured) return send(res, 503, { error: "Email is not set up on this server. Add SMTP settings to .env." });
  if (rateLimited()) return send(res, 429, { error: "Too many emails in the last minute. Try again shortly." });

  let body;
  try {
    body = await readJson(req);
  } catch (err) {
    return send(res, 400, { error: err.message });
  }

  const input = {
    role: body.role === "teacher" ? "teacher" : body.role === "student" ? "student" : null,
    name: clean(body.name, 120),
    email: clean(body.email, 200).toLowerCase(),
    tempPassword: clean(body.tempPassword, 64),
    institution: clean(body.institution, 160),
    loginUrl: /^https?:\/\//.test(body.loginUrl || "") ? clean(body.loginUrl, 300) : "",
  };
  if (!input.role) return send(res, 400, { error: "Only student and teacher accounts are emailed." });
  if (!input.name || !isEmail(input.email) || !input.tempPassword) return send(res, 400, { error: "Missing name, email or password." });

  try {
    await transport.sendMail(buildMessage(input));
    return send(res, 200, { sent: true });
  } catch (err) {
    console.error("Mail error:", err.message);
    return send(res, 502, { error: `The mail server refused the message: ${err.message}` });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Origyn mail service on http://127.0.0.1:${PORT} (${configured ? "SMTP configured" : "SMTP NOT configured: emails will fail"})`);
});
