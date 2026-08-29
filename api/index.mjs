export const config = { maxDuration: 30 };

export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.end(
    JSON.stringify({
      ok: true,
      url: req.url,
      method: req.method,
      hasBody: typeof req.body,
      ct: req.headers["content-type"],
    })
  );
}
