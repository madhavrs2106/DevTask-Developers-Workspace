import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { HttpError } from "./httpError.js";

/**
 * Signs a JWT for the given user.
 * @param {{ id: string, role: string }} user
 */
export function signToken(user) {
  // @ts-expect-error jsonwebtoken accepts string | number expiresIn at runtime
  return jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

/**
 * Verifies a JWT and returns its payload.
 * @param {string} token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, env.jwtSecret);
  } catch {
    throw new HttpError(401, "Invalid or expired token");
  }
}
