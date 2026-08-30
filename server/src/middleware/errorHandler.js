import { ZodError } from "zod";
import { env } from "../config/env.js";

export function notFoundHandler(req, res) {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  let status = err.status ?? 500;
  let message = err.message ?? "Internal server error";

  // Handle multer errors
  if (err.code === "LIMIT_FILE_SIZE") {
    status = 413;
    message = "File too large. Maximum size is 50MB.";
  }
  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    status = 400;
    message = "Unexpected file field.";
  }
  if (err.code === "LIMIT_FILE_COUNT") {
    status = 400;
    message = "Too many files.";
  }
  if (err.code === "LIMIT_FIELD_COUNT") {
    status = 400;
    message = "Too many fields.";
  }
  if (err.message && err.message.includes("File type") && err.message.includes("not allowed")) {
    status = 400;
  }

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
    message = `${err.message}${err.code ? " (" + err.code + ")" : ""}`;
  }

  res.status(status).json({ message });
}
