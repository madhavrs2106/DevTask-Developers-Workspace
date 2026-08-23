import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { signToken } from "../utils/jwt.js";
import { toPublicUser } from "../utils/user.js";
import { asyncHandler } from "../utils/httpError.js";
import { parse } from "../utils/validate.js";

export const ROLES = ["DEVELOPER", "LEARNER"];

/** Company policy: accounts are limited to this email domain. */
export const ALLOWED_EMAIL_DOMAIN = "@dev.io";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address")
  .refine((email) => email.endsWith(ALLOWED_EMAIL_DOMAIN), {
    message: "Only @dev.io email addresses are allowed.",
  });

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  email: emailSchema,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
  role: z.enum(["DEVELOPER", "LEARNER"]).default("DEVELOPER"),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

const DEFAULT_SKILLS = {
  DEVELOPER: [
    { name: "JavaScript", level: 10 },
    { name: "Git", level: 15 },
  ],
  LEARNER: [
    { name: "Python", level: 10 },
    { name: "Data Structures", level: 5 },
  ],
};

/** POST /api/auth/register */
export const register = asyncHandler(async (req, res) => {
  const data = parse(registerSchema, req.body);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return res.status(409).json({ message: "An account with this email already exists." });
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name,
      role: data.role,
      skills: { create: DEFAULT_SKILLS[data.role] },
    },
  });

  res.status(201).json({ user: toPublicUser(user), token: signToken(user) });
});

/** POST /api/auth/login */
export const login = asyncHandler(async (req, res) => {
  const data = parse(loginSchema, req.body);

  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  res.json({ user: toPublicUser(user), token: signToken(user) });
});

/** GET /api/auth/me */
export const me = asyncHandler(async (req, res) => {
  const skills = await prisma.skillProgress.findMany({
    where: { userId: req.user.id },
    orderBy: [{ level: "desc" }, { name: "asc" }],
  });

  res.json({ user: { ...req.user, skills } });
});
