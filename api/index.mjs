import app from "../server/src/app.js";

// Allow longer cold starts (Prisma engine + Supabase TLS handshake).
export const config = { maxDuration: 30 };

function readRaw(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (c) =>
      chunks.push(typeof c === "string" ? Buffer.from(c) : c)
    );
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", () => resolve(Buffer.concat(chunks)));
    setTimeout(() => resolve(Buffer.concat(chunks)), 5000);
  });
}

export default async function handler(req, res) {
  // Vercel rewrites /api/<rest> -> /api?p=<rest>; rebuild the real path.
  const u = new URL(req.url, "http://localhost");
  const rest = u.searchParams.get("p");
  if (rest) {
    u.searchParams.delete("p");
    const query = u.searchParams.toString();
    req.url = "/api/" + rest + (query ? "?" + query : "");
  }

  // Vercel's req.body getter throws on JSON bodies; pre-parse and override it
  // so express.json() skips parsing and uses our parsed object.
  const ct = req.headers["content-type"] || "";
  if (ct.includes("application/json")) {
    const raw = (await readRaw(req)).toString();
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        try {
          req.body = parsed;
        } catch {
          Object.defineProperty(req, "body", {
            value: parsed,
            writable: true,
            configurable: true,
          });
        }
        // Tell body-parser the body is already parsed so it won't try to
        // read the (now consumed) stream again.
        req._body = true;
      } catch {
        // leave undefined; express.json will surface the parse error
      }
    }
  }

  return app(req, res);
}
