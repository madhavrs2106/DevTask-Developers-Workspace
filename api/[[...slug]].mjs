import app from "../server/src/app.js";

// Allow longer cold starts (Prisma engine + Supabase TLS handshake).
export const config = { maxDuration: 30 };

// Vercel Node functions receive a standard (req, res). Express' app is itself a
// request listener, so we can invoke it directly. Vercel may strip the "/api"
// prefix from req.url, so re-add it when missing so Express routes match.
export default function handler(req, res) {
  if (req.url && !req.url.startsWith("/api/")) {
    req.url = "/api" + (req.url.startsWith("/") ? "" : "/") + req.url;
  }
  return app(req, res);
}
