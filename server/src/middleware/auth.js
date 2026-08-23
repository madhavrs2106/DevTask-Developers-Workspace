import { prisma } from "../lib/prisma.js";
import { publicUserSelect } from "../utils/user.js";
import { verifyToken } from "../utils/jwt.js";

function extractToken(req) {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) return header.slice("Bearer ".length);
  return null;
}

/** Express middleware — requires a valid Bearer token, attaches `req.user`. */
export async function requireAuth(req, _res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return next({
        status: 401,
        message: "Authentication required. Provide a Bearer token.",
      });
    }

    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: publicUserSelect,
    });

    if (!user) {
      return next({ status: 401, message: "Account no longer exists." });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/** Optional auth — attaches `req.user` when a valid token is present. */
export async function optionalAuth(req, _res, next) {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const payload = verifyToken(token);
    req.user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: publicUserSelect,
    });
  } catch {
    /* ignore invalid tokens for optional auth */
  }
  next();
}
