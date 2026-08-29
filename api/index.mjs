export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  let raw;
  if (req.body !== undefined) {
    raw = "BODY_OBJ:" + JSON.stringify(req.body);
  } else {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    raw = Buffer.concat(chunks).toString();
  }
  res.setHeader("Content-Type", "application/json");
  res.end(
    JSON.stringify({
      url: req.url,
      method: req.method,
      ct: req.headers["content-type"],
      raw,
    })
  );
}
