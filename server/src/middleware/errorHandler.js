import { ZodError } from "zod";
import { env } from "../config/env.js";

export function notFoundHandler(req, res) {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  let status = err.status ?? 500;
  let message = err.message ?? "Internal server error";

  if (err instanceof ZodError) {
    status = 400;
    const issue = err.issues[0];
    message = `${issue.path.join(".") || "request"}: ${issue.message}`;
  }

  if (err.code === "P2002") {
    status = 409;
    message = "A record with this value already exists.";
  }
  if (err.code === "P2025") {
    status = 404;
    message = "Record not found.";
  }

  if (status >= 500) {
    console.error("[error]", err);
    message = env.nodeEnv === "production" ? "Internal server error" : message;
  }

  res.status(status).json({ message });
}
