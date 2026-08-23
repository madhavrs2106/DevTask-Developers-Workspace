import { HttpError } from "./httpError.js";

/**
 * Validates `data` against a zod schema, throwing a 400 HttpError on failure.
 * @template T
 * @param {import('zod').ZodType<T>} schema
 * @param {unknown} data
 * @returns {T}
 */
export function parse(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue.path.join(".");
    throw new HttpError(400, `${path || "request"}: ${issue.message}`);
  }
  return result.data;
}
