import app from "../server/src/app.js";

// Allow longer cold starts (Prisma engine + Supabase TLS handshake).
export const config = { maxDuration: 30 };

// Vercel rewrites send /api/<rest> -> /api?p=<rest>.
// Reconstruct the real path before handing off to Express.
export default function handler(req, res) {
  let url = req.url || "/";
  const pathOnly = url.split("?")[0];

  // If Vercel passed the original full path, use it directly.
  if (/^\/api\/.+/.test(pathOnly)) {
    return app(req, res);
  }

  const u = new URL(url, "http://localhost");
  const rest = u.searchParams.get("p") || u.searchParams.get("...slug");
  if (rest) {
    u.searchParams.delete("p");
    u.searchParams.delete("...slug");
    const query = u.searchParams.toString();
    req.url = "/api/" + rest + (query ? "?" + query : "");
  }

  return app(req, res);
}
