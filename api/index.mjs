export const config = { maxDuration: 30 };

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
    req.on("error", () => resolve(""));
  });
}

export default async function handler(req, res) {
  const raw = await readBody(req);
  res.setHeader("Content-Type", "application/json");
  res.end(
    JSON.stringify({
      ok: true,
      url: req.url,
      method: req.method,
      hasBody: typeof req.body,
      ct: req.headers["content-type"],
      raw,
    })
  );
}
