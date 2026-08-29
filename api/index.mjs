export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  const chunks = [];
  try {
    await new Promise((resolve, reject) => {
      req.on("data", (c) =>
        chunks.push(typeof c === "string" ? Buffer.from(c) : c)
      );
      req.on("end", resolve);
      req.on("error", reject);
      setTimeout(resolve, 3000);
    });
  } catch (e) {
    chunks.push(Buffer.from("STREAM_ERR:" + e.message));
  }
  const raw = Buffer.concat(chunks).toString();
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ ok: true, len: raw.length, raw }));
}
