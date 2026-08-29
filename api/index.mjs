export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  let raw = "NO_BODY_READ";
  try {
    if (req.body !== undefined && req.body !== null) {
      raw =
        "REQ_BODY:" +
        (typeof req.body === "string" ? req.body : JSON.stringify(req.body));
    } else {
      const chunks = [];
      await new Promise((resolve) => {
        let done = false;
        const finish = () => {
          if (!done) {
            done = true;
            resolve();
          }
        };
        req.on("data", (c) =>
          chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c))
        );
        req.on("end", finish);
        req.on("error", finish);
        setTimeout(finish, 3000);
      });
      raw = Buffer.concat(chunks).toString() || "EMPTY_STREAM";
    }
  } catch (e) {
    raw = "ERR:" + e.message;
  }
  res.setHeader("Content-Type", "application/json");
  res.end(
    JSON.stringify({
      ok: true,
      url: req.url,
      method: req.method,
      ct: req.headers["content-type"],
      raw,
    })
  );
}
