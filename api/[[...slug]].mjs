import app from "../server/src/app.js";

// Allow longer cold starts (Prisma engine + Supabase TLS handshake).
export const config = { maxDuration: 30 };

// Vercel invokes this catch-all for /api/*. The full path arrives in req.url
// (Vercel also appends ?...slug=<rest>, which is harmless for Express routing).
export default function handler(req, res) {
  return app(req, res);
}
